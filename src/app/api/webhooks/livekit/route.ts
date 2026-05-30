import { WebhookReceiver } from "livekit-server-sdk";
import { createServiceClient } from "@/lib/supabase/service";
import { logWebhookEvent } from "@/lib/webhook-log";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const receiver = apiKey && apiSecret ? new WebhookReceiver(apiKey, apiSecret) : null;

export async function POST(req: Request) {
  if (!receiver) {
    return NextResponse.json({ error: "LiveKit not configured" }, { status: 503 });
  }

  const body = await req.text();
  const auth = req.headers.get("Authorization") ?? "";

  let event: Awaited<ReturnType<typeof receiver.receive>>;
  try {
    event = await receiver.receive(body, auth);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const start = Date.now();
  let db: ReturnType<typeof createServiceClient>;
  try {
    db = createServiceClient();
  } catch {
    return NextResponse.json({ error: "Service role missing" }, { status: 503 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  const roomName = event.room?.name;
  const sessionMatch = roomName?.match(/^session-(.+)$/);
  if (!sessionMatch) {
    await logWebhookEvent(dbAny, {
      provider: "livekit",
      eventType: event.event ?? "unknown",
      status: "ignored",
      payloadSummary: { roomName },
    });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const bookingId = sessionMatch[1];

  try {
    // participant_joined / participant_left → booking_session_events INSERT
    if (event.event === "participant_joined" || event.event === "participant_left") {
      const userId = event.participant?.identity ?? null;
      await dbAny.from("booking_session_events").insert({
        booking_id: bookingId,
        user_id: userId,
        event_type: event.event === "participant_joined" ? "joined" : "left",
        metadata: { participant_name: event.participant?.name },
      });

      // 첫 joined일 때 session_started_at 기록
      if (event.event === "participant_joined") {
        await dbAny
          .from("bookings")
          .update({ session_started_at: new Date().toISOString() })
          .eq("id", bookingId)
          .is("session_started_at", null);
      }
    }

    // room_finished → 자동 완료
    if (event.event === "room_finished") {
      // creationTime이 유효하면 그것으로 duration 계산
      let duration: number;
      const rawCreationTime = Number(event.room?.creationTime ?? 0);

      if (rawCreationTime > 0) {
        duration = Math.floor(Date.now() / 1000 - rawCreationTime);
      } else {
        // creationTime이 없거나 0 → DB의 session_started_at으로 대체
        console.warn(
          `[livekit-webhook] room_finished: creationTime 누락 (bookingId=${bookingId}). DB fallback 시도.`
        );

        const { data: sessionRow } = await dbAny
          .from("bookings")
          .select("session_started_at")
          .eq("id", bookingId)
          .single();

        const sessionStartedAt = (sessionRow as { session_started_at: string | null } | null)
          ?.session_started_at;

        if (sessionStartedAt) {
          // session_started_at(ISO 문자열)을 초 단위로 변환하여 duration 계산
          duration = Math.floor(
            (Date.now() - new Date(sessionStartedAt).getTime()) / 1000
          );
        } else {
          // session_started_at도 없음 → 환불 방지를 위해 충분히 큰 값 설정
          console.warn(
            `[livekit-webhook] room_finished: session_started_at도 없음 (bookingId=${bookingId}). 환불 방지를 위해 duration=999999 설정.`
          );
          duration = 999999;
        }
      }

      // 양측 입장 여부: joined 이벤트의 distinct user_id 가 2명 이상이어야 실제 세션.
      // 한 명만 입장(상대 미입장)했으면 과금하지 않고 환불한다.
      const { data: joinedRows } = await dbAny
        .from("booking_session_events")
        .select("user_id")
        .eq("booking_id", bookingId)
        .eq("event_type", "joined");
      const distinctJoined = new Set(
        ((joinedRows ?? []) as { user_id: string | null }[])
          .map((r) => r.user_id)
          .filter((id): id is string => Boolean(id)),
      );
      const bothJoined = distinctJoined.size >= 2;

      await dbAny.from("booking_session_events").insert({
        booking_id: bookingId,
        event_type: "room_finished",
        metadata: { duration_seconds: duration, both_joined: bothJoined },
      });

      const { error: rpcError } = await dbAny.rpc("auto_complete_session", {
        p_booking_id: bookingId,
        p_duration_seconds: duration,
        p_both_joined: bothJoined,
      });
      if (rpcError) throw rpcError;

      // 양쪽에게 알림 발송
      const { data: bookingData } = await dbAny
        .from("bookings")
        .select("startup_id, enabler_id, status")
        .eq("id", bookingId)
        .single();

      if (bookingData) {
        const isCompleted = bookingData.status === "completed";
        const title = isCompleted ? "세션 완료" : "세션이 짧게 종료됨";
        const body = isCompleted
          ? "세션이 완료됐습니다. 리뷰를 작성해 주세요."
          : !bothJoined
          ? "상대방이 입장하지 않아 토큰이 환불됐습니다."
          : "세션 시간이 짧아 토큰이 환불됐습니다.";

        await Promise.all([
          createNotification(dbAny, {
            userId: bookingData.startup_id,
            type: "session_ended",
            title,
            body,
            link: `/bookings`,
          }).catch(() => {}),
          createNotification(dbAny, {
            userId: bookingData.enabler_id,
            type: "session_ended",
            title,
            body,
            link: `/enabler-dashboard`,
          }).catch(() => {}),
        ]);
      }
    }

    await logWebhookEvent(dbAny, {
      provider: "livekit",
      eventType: event.event ?? "unknown",
      status: "processed",
      payloadSummary: { bookingId, roomName },
      processingMs: Date.now() - start,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    await logWebhookEvent(dbAny, {
      provider: "livekit",
      eventType: event.event ?? "unknown",
      status: "failed",
      errorMessage: e instanceof Error ? e.message : String(e),
      payloadSummary: { bookingId, roomName },
      processingMs: Date.now() - start,
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
