import { getEffectiveUserId } from "@/lib/auth-context";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail, APP_URL } from "@/lib/email";
import { bookingRequestedEmail } from "@/lib/emails/templates";
import { createNotification } from "@/lib/notifications";
import { rateLimit, getClientKey } from "@/lib/rate-limit";
import { generateAvailableSlots, type AvailabilityInput } from "@/lib/utils/timezone";

// scheduled_at(UTC ISO)이 전문가 가용시간(요일별 범위, 전문가 타임존)의 30분 슬롯과
// 정확히 일치하는지 서버에서 재검증. 위조된 시간 예약을 방지한다.
function isWithinAvailability(availability: unknown, scheduledAtISO: string): boolean {
  if (!availability || typeof availability !== "object") return false;
  const a = availability as { weekly?: unknown; timezone?: unknown; dateOverrides?: unknown };
  if (!a.weekly || typeof a.weekly !== "object") return false;
  const tz = typeof a.timezone === "string" && a.timezone ? a.timezone : "Asia/Seoul";
  const input: AvailabilityInput = {
    weekly: a.weekly as AvailabilityInput["weekly"],
    timezone: tz,
  };
  input.dateOverrides = (a.dateOverrides && typeof a.dateOverrides === "object")
    ? a.dateOverrides as AvailabilityInput["dateOverrides"]
    : undefined;
  // 클라이언트와 동일한 30분 단위. lead 0 으로 과거만 제외(임박 슬롯도 허용).
  const days = generateAvailableSlots(input, tz, { days: 40, slotMinutes: 30, leadMinutes: 0 });
  const target = new Date(scheduledAtISO).getTime();
  return days.some((d) => d.slots.some((s) => new Date(s.utcISO).getTime() === target));
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const effectiveUser = await getEffectiveUserId();
    if (!effectiveUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: profile } = await db.from("users").select("role").eq("id", effectiveUser.userId).single();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = db.from("bookings").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);

    if (profile?.role === "startup") query = query.eq("startup_id", effectiveUser.userId);
    else if (profile?.role === "enabler") query = query.eq("enabler_id", effectiveUser.userId);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bookings: data, total: count, page, limit });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  // Rate limiting: 시간당 20회 제한 (예약 남용 방지)
  const rl = await rateLimit(`bookings:${getClientKey(request)}`, { max: 20, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const effectiveUser = await getEffectiveUserId();
    if (!effectiveUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = effectiveUser.impersonating
      ? await createAdminClient()
      : await createServerSupabaseClient();

    const body = await request.json();
    const { enabler_id, type, scheduled_at, brief } = body;

    if (!enabler_id || !type || !scheduled_at) {
      return NextResponse.json({ error: "enabler_id, type, scheduled_at required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 스타트업 계정만 예약 요청 가능
    const { data: requester } = await db.from("users").select("role").eq("id", effectiveUser.userId).single();
    if (requester?.role !== "startup") {
      return NextResponse.json({ error: "스타트업 계정만 예약을 요청할 수 있습니다." }, { status: 403 });
    }

    // 전문가 승인 여부 + 가용시간 검증
    const { data: enablerProf } = await db
      .from("enabler_profiles")
      .select("status, availability")
      .eq("user_id", enabler_id)
      .maybeSingle();
    if (!enablerProf || enablerProf.status !== "approved") {
      return NextResponse.json({ error: "예약할 수 없는 전문가입니다." }, { status: 400 });
    }
    if (!isWithinAvailability(enablerProf.availability, scheduled_at)) {
      return NextResponse.json(
        { error: "선택한 시간은 전문가의 예약 가능 시간이 아닙니다. 다시 선택해 주세요." },
        { status: 400 },
      );
    }

    // Get credits required for this session type
    const { data: setting } = await db.from("credit_settings").select("credits_required").eq("session_type", type).single();
    const creditsAmount = setting?.credits_required ?? 0;

    // Chemistry 1회 제한 검증
    if (type === "chemistry") {
      const { data: existing } = await db
        .from("bookings")
        .select("id")
        .eq("startup_id", effectiveUser.userId)
        .eq("enabler_id", enabler_id)
        .in("status", ["pending", "confirmed", "completed"])
        .eq("type", "chemistry")
        .limit(1)
        .maybeSingle();
      if (existing) {
        return NextResponse.json(
          { error: "이 Enabler와의 Chemistry Call은 1회만 사용 가능합니다." },
          { status: 400 }
        );
      }
    }

    // B-4: 동시간 충돌 검증
    const scheduledTime = new Date(scheduled_at);
    const windowStart = new Date(scheduledTime.getTime() - 60 * 60 * 1000);
    const windowEnd = new Date(scheduledTime.getTime() + 60 * 60 * 1000);

    const { data: startupConflict } = await db
      .from("bookings")
      .select("id, scheduled_at")
      .eq("startup_id", effectiveUser.userId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", windowStart.toISOString())
      .lte("scheduled_at", windowEnd.toISOString())
      .limit(1)
      .maybeSingle();

    if (startupConflict) {
      return NextResponse.json({
        error: "동일 시간대에 이미 다른 예약이 있습니다.",
        code: "STARTUP_CONFLICT",
      }, { status: 409 });
    }

    const { data: enablerConflict } = await db
      .from("bookings")
      .select("id, scheduled_at")
      .eq("enabler_id", enabler_id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", windowStart.toISOString())
      .lte("scheduled_at", windowEnd.toISOString())
      .limit(1)
      .maybeSingle();

    if (enablerConflict) {
      return NextResponse.json({
        error: "이 Enabler는 해당 시간에 다른 예약이 있습니다. 다른 시간을 선택해 주세요.",
        code: "ENABLER_CONFLICT",
      }, { status: 409 });
    }

    // Create booking
    const { data: booking, error } = await db.from("bookings").insert({
      startup_id: effectiveUser.userId,
      enabler_id,
      type,
      scheduled_at,
      credits_amount: creditsAmount,
      brief: brief || "",
      status: "pending",
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Set meeting URL
    const meetingUrl = `/meeting/session-${booking.id}`;
    await db.from("bookings").update({ meeting_url: meetingUrl }).eq("id", booking.id);

    // Hold credits if needed
    if (creditsAmount > 0) {
      const { error: holdError } = await db.rpc("hold_credits", {
        p_booking_id: booking.id,
        p_startup_id: effectiveUser.userId,
        p_enabler_id: enabler_id,
        p_amount: creditsAmount,
      });
      if (holdError) {
        // Rollback booking
        await db.from("bookings").delete().eq("id", booking.id);
        return NextResponse.json({ error: "크레딧이 부족합니다: " + holdError.message }, { status: 400 });
      }
    }

    // 이메일 알림: Enabler에게 새 예약 신청 도착 (best-effort)
    try {
      const { data: enablerProfile } = await db
        .from("users")
        .select("email, full_name")
        .eq("id", enabler_id)
        .single();
      const { data: startupProfile } = await db
        .from("users")
        .select("full_name")
        .eq("id", effectiveUser.userId)
        .single();

      if (enablerProfile?.email) {
        const SESSION_LABEL: Record<string, string> = {
          chemistry: "케미스트리 세션",
          standard: "스탠다드 세션",
          project: "프로젝트 세션",
        };
        const sessionDatetime = new Date(scheduled_at).toLocaleString("ko-KR", {
          year: "numeric", month: "long", day: "numeric",
          weekday: "short", hour: "2-digit", minute: "2-digit",
          timeZone: "Asia/Seoul",
        });
        await sendEmail(
          enablerProfile.email,
          bookingRequestedEmail({
            enablerName: enablerProfile.full_name ?? "Enabler",
            startupName: startupProfile?.full_name ?? "스타트업",
            sessionType: SESSION_LABEL[type] ?? type,
            sessionDatetime,
            brief: brief || "",
            bookingId: booking.id,
            dashboardUrl: `${APP_URL}/enabler-dashboard`,
          })
        );
      }
    } catch { /* 이메일 실패는 무시 — booking 응답에 영향 없음 */ }

    // 인앱 알림: Enabler에게 새 매칭 요청 (fire-and-forget)
    void (async () => {
      try {
        const { data: startupProfile } = await db.from("users").select("full_name").eq("id", effectiveUser.userId).single();
        await createNotification(db, {
          userId: enabler_id,
          type: "booking_requested",
          title: "새 매칭 요청",
          body: `${startupProfile?.full_name ?? "스타트업"}님이 매칭을 요청했습니다.`,
          link: "/enabler-dashboard",
        });
      } catch { /* 무시 */ }
    })();

    return NextResponse.json({ booking: { ...booking, meeting_url: meetingUrl } });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
