import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail, APP_URL } from "@/lib/email";
import { bookingConfirmedEmail, bookingCancelledEmail } from "@/lib/emails/templates";
import { createNotification } from "@/lib/notifications";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db.from("bookings").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ booking: data });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 권한 검증: booking 조회 후 startup_id 또는 enabler_id 일치 확인
    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select("id, startup_id, enabler_id, status")
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isStartup = booking.startup_id === user.id;
    const isEnabler = booking.enabler_id === user.id;

    if (!isStartup && !isEnabler) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, cancel_reason } = body as { status: string; cancel_reason?: string };

    if (status === "confirmed") {
      // Enabler만 수락 가능
      if (!isEnabler) {
        return NextResponse.json({ error: "Forbidden: Enabler만 수락할 수 있습니다" }, { status: 403 });
      }
      const { data, error } = await db
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", id)
        .select("*, scheduled_at, type, brief")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // 이메일 알림: Startup에게 예약 확정 (best-effort)
      try {
        const [{ data: startupProfile }, { data: enablerProfile }] = await Promise.all([
          db.from("users").select("email, full_name").eq("id", booking.startup_id).single(),
          db.from("users").select("full_name").eq("id", booking.enabler_id).single(),
        ]);
        if (startupProfile?.email) {
          const SESSION_LABEL: Record<string, string> = {
            chemistry: "케미스트리 세션",
            standard: "스탠다드 세션",
            project: "프로젝트 세션",
          };
          const sessionDatetime = new Date(data.scheduled_at).toLocaleString("ko-KR", {
            year: "numeric", month: "long", day: "numeric",
            weekday: "short", hour: "2-digit", minute: "2-digit",
            timeZone: "Asia/Seoul",
          });
          await sendEmail(
            startupProfile.email,
            bookingConfirmedEmail({
              recipientName: startupProfile.full_name ?? "스타트업",
              recipientRole: "startup",
              counterpartName: enablerProfile?.full_name ?? "Enabler",
              sessionType: (SESSION_LABEL[data.type] ?? data.type) as "Chemistry" | "Standard" | "Project",
              sessionDatetime,
              creditsCharged: data.credits_amount ?? 0,
              livekitUrl: data.meeting_url ?? `${APP_URL}/bookings`,
              briefPreview: data.brief ? String(data.brief).slice(0, 200) : undefined,
              bookingId: id,
            })
          );
        }
      } catch { /* 이메일 실패는 무시 */ }

      // 인앱 알림: Startup에게 예약 확정 (fire-and-forget)
      void (async () => {
        try {
          await createNotification(db, {
            userId: booking.startup_id,
            type: "booking_confirmed",
            title: "예약이 확정되었습니다",
            body: "Enabler가 매칭 요청을 수락했습니다. 세션 상세를 확인하세요.",
            link: `/bookings`,
          });
        } catch { /* 무시 */ }
      })();

      // 정산 적립은 수락 시점이 아닌 세션 '완료' 시점(auto_complete_session, migration 054)에 수행.
      // 노쇼/짧은 세션 환불 시 적립되지 않도록 여기서는 적립하지 않는다.

      return NextResponse.json({ booking: data });
    }

    if (status === "cancelled") {
      // pending 또는 confirmed 상태만 취소 가능
      if (booking.status !== "pending" && booking.status !== "confirmed") {
        return NextResponse.json(
          { error: `취소할 수 없는 상태입니다: ${booking.status}` },
          { status: 400 },
        );
      }
      const reason = cancel_reason || "예약 취소";
      const { error: rpcError } = await db.rpc("release_credits", {
        p_booking_id: id,
        p_reason: reason,
      });
      if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

      const { data, error: updateError } = await db
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason,
        })
        .eq("id", id)
        .select("*, scheduled_at, type")
        .single();
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

      // 이메일 알림: enabler가 거절한 경우에만 startup에게 발송 (best-effort)
      if (isEnabler) {
        try {
          const [{ data: startupProfile }, { data: enablerProfile }] = await Promise.all([
            db.from("users").select("email, full_name").eq("id", booking.startup_id).single(),
            db.from("users").select("full_name").eq("id", booking.enabler_id).single(),
          ]);
          if (startupProfile?.email) {
            const SESSION_LABEL: Record<string, string> = {
              chemistry: "케미스트리 세션",
              standard: "스탠다드 세션",
              project: "프로젝트 세션",
            };
            const sessionDatetime = new Date(data.scheduled_at).toLocaleString("ko-KR", {
              year: "numeric", month: "long", day: "numeric",
              weekday: "short", hour: "2-digit", minute: "2-digit",
              timeZone: "Asia/Seoul",
            });
            await sendEmail(
              startupProfile.email,
              bookingCancelledEmail({
                recipientName: startupProfile.full_name ?? "스타트업",
                counterpartName: enablerProfile?.full_name ?? "Enabler",
                sessionType: SESSION_LABEL[data.type] ?? data.type,
                sessionDatetime,
                cancelledBy: "enabler",
                cancelReason: reason !== "예약 취소" ? reason : undefined,
                refundPolicy: "full",
                refundedCredits: data.credits_amount ?? 0,
                originalCredits: data.credits_amount ?? 0,
                bookingId: id,
              })
            );
          }
        } catch { /* 이메일 실패는 무시 */ }
      }

      // 인앱 알림: 취소 — 양쪽 모두에게 (fire-and-forget)
      void (async () => {
        try {
          const cancellerLabel = isEnabler ? "Enabler" : "스타트업";
          const notifyIds = [booking.startup_id, booking.enabler_id].filter(
            (uid) => uid !== user.id
          );
          await Promise.all(
            notifyIds.map((uid) =>
              createNotification(db, {
                userId: uid,
                type: "booking_cancelled",
                title: "예약이 취소되었습니다",
                body: `${cancellerLabel}에 의해 예약이 취소되었습니다.`,
                link: `/bookings`,
              })
            )
          );
          // 취소 당사자에게도 알림
          await createNotification(db, {
            userId: user.id,
            type: "booking_cancelled",
            title: "예약 취소 완료",
            body: "예약이 취소되었습니다.",
            link: `/bookings`,
          });
        } catch { /* 무시 */ }
      })();

      return NextResponse.json({ booking: data });
    }

    if (status === "completed") {
      // confirmed 상태만 완료 처리 가능
      if (booking.status !== "confirmed") {
        return NextResponse.json(
          { error: `완료 처리할 수 없는 상태입니다: ${booking.status}` },
          { status: 400 },
        );
      }
      const { error } = await db.rpc("confirm_credits", { p_booking_id: id });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const { data } = await db.from("bookings").select("*").eq("id", id).single();
      return NextResponse.json({ booking: data });
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 권한 검증: booking 소유자만 삭제 가능
    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select("id, startup_id, enabler_id, status")
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.startup_id !== user.id && booking.enabler_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // pending 또는 confirmed 상태만 삭제 가능
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return NextResponse.json(
        { error: `삭제할 수 없는 상태입니다: ${booking.status}` },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = (body as Record<string, string>).reason || "사용자 취소";

    const { error } = await db.rpc("release_credits", { p_booking_id: id, p_reason: reason });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = await db.from("bookings").select("*").eq("id", id).single();
    return NextResponse.json({ booking: data });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
