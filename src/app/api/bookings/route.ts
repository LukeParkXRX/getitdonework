import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail, APP_URL } from "@/lib/email";
import { bookingRequestedEmail } from "@/lib/emails/templates";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: profile } = await db.from("users").select("role").eq("id", user.id).single();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = db.from("bookings").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);

    if (profile?.role === "startup") query = query.eq("startup_id", user.id);
    else if (profile?.role === "enabler") query = query.eq("enabler_id", user.id);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bookings: data, total: count, page, limit });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { enabler_id, type, scheduled_at, brief } = body;

    if (!enabler_id || !type || !scheduled_at) {
      return NextResponse.json({ error: "enabler_id, type, scheduled_at required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Get credits required for this session type
    const { data: setting } = await db.from("credit_settings").select("credits_required").eq("session_type", type).single();
    const creditsAmount = setting?.credits_required ?? 0;

    // Chemistry 1회 제한 검증
    if (type === "chemistry") {
      const { data: existing } = await db
        .from("bookings")
        .select("id")
        .eq("startup_id", user.id)
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
      .eq("startup_id", user.id)
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
      .eq("scheduled_at", scheduled_at)
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
      startup_id: user.id,
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
        p_startup_id: user.id,
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
        .eq("id", user.id)
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
        const { data: startupProfile } = await db.from("users").select("full_name").eq("id", user.id).single();
        await createNotification(db, {
          userId: enabler_id,
          type: "booking_requested",
          title: "새 매칭 요청",
          body: `${startupProfile?.full_name ?? "스타트업"}님이 매칭을 요청했습니다.`,
          link: "/enabler-dashboard/requests",
        });
      } catch { /* 무시 */ }
    })();

    return NextResponse.json({ booking: { ...booking, meeting_url: meetingUrl } });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
