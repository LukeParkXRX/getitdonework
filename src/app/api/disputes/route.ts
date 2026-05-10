import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const body = (await request.json()) as {
      bookingId: string;
      reason: string;
      details?: string;
      evidenceUrls?: string[];
    };

    const { bookingId, reason, details, evidenceUrls } = body;

    if (!bookingId || !reason) {
      return NextResponse.json({ error: "bookingId, reason 필수" }, { status: 400 });
    }

    // booking 조회 + 참여자 확인
    const { data: booking, error: bookingErr } = await db
      .from("bookings")
      .select("id, startup_id, enabler_id, status, credits_amount")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking을 찾을 수 없습니다" }, { status: 404 });
    }

    const isStartup = booking.startup_id === user.id;
    const isEnabler = booking.enabler_id === user.id;

    if (!isStartup && !isEnabler) {
      return NextResponse.json({ error: "이 Booking의 참여자가 아닙니다" }, { status: 403 });
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "완료된 Booking에만 분쟁 신청이 가능합니다" },
        { status: 400 }
      );
    }

    // 중복 분쟁 확인 (UNIQUE constraint이지만 사전 체크)
    const { data: existing } = await db
      .from("disputes")
      .select("id, status")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "이미 분쟁이 신청된 Booking입니다", disputeId: existing.id },
        { status: 409 }
      );
    }

    const filerRole: "startup" | "enabler" = isStartup ? "startup" : "enabler";

    // 분쟁 INSERT
    const { data: dispute, error: insertErr } = await db
      .from("disputes")
      .insert({
        booking_id: bookingId,
        filer_id: user.id,
        filer_role: filerRole,
        reason,
        details: details ?? null,
        evidence_urls: evidenceUrls ?? [],
        status: "open",
      })
      .select()
      .single();

    if (insertErr || !dispute) {
      return NextResponse.json({ error: insertErr?.message ?? "분쟁 신청 실패" }, { status: 500 });
    }

    // super_admin들에게 알림
    const { data: admins } = await db
      .from("users")
      .select("id")
      .eq("role", "super_admin");

    const adminNotifPromises = ((admins as { id: string }[]) ?? []).map((admin) =>
      createNotification(db, {
        userId: admin.id,
        type: "dispute_filed",
        title: "새 분쟁 신청",
        body: `${filerRole === "startup" ? "스타트업" : "Enabler"}이 Booking에 대해 분쟁을 신청했습니다. (사유: ${reason})`,
        link: `/admin/disputes/${dispute.id}`,
      })
    );

    // 상대방에게 알림 (옵션)
    const counterpartyId = isStartup ? booking.enabler_id : booking.startup_id;
    const counterpartyNotif = createNotification(db, {
      userId: counterpartyId,
      type: "dispute_filed",
      title: "분쟁 신청 알림",
      body: "귀하의 Booking에 대해 분쟁이 신청되었습니다. 관리팀이 검토할 예정입니다.",
      link: `/bookings`,
    });

    await Promise.allSettled([...adminNotifPromises, counterpartyNotif]);

    return NextResponse.json({ dispute }, { status: 201 });
  } catch (e) {
    console.warn("POST /api/disputes error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
