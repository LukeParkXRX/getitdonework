import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { searchParams } = new URL(request.url);
    const target_id = searchParams.get("target_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = db
      .from("reviews")
      .select("*, users!author_id(full_name, avatar_url)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (target_id) query = query.eq("target_id", target_id);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reviews: data, total: count, page, limit });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  // Rate limiting: 시간당 10회 제한 (리뷰 스팸 방지)
  const rl = await rateLimit(`reviews:${getClientKey(request)}`, { max: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const body = await request.json();
    const { booking_id, target_id, rating, comment } = body;

    if (!booking_id || !target_id || !rating) {
      return NextResponse.json({ error: "booking_id, target_id, rating required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    // Verify booking belongs to user and is completed
    const { data: booking } = await db.from("bookings").select("*").eq("id", booking_id).single();
    if (!booking || booking.startup_id !== user.id) {
      return NextResponse.json({ error: "Invalid booking" }, { status: 403 });
    }
    if (booking.status !== "completed") {
      return NextResponse.json({ error: "Booking must be completed to leave a review" }, { status: 400 });
    }

    const { data, error } = await db.from("reviews").insert({
      author_id: user.id,
      target_id,
      booking_id,
      rating,
      comment: comment || "",
    }).select().single();

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "이미 리뷰를 작성하셨습니다" }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 인앱 알림: 리뷰 대상자에게 새 리뷰 알림 (fire-and-forget)
    void (async () => {
      try {
        const { data: authorProfile } = await db.from("users").select("full_name").eq("id", user.id).single();
        await createNotification(db, {
          userId: target_id,
          type: "review_received",
          title: "새 리뷰가 등록되었습니다",
          body: `${authorProfile?.full_name ?? "스타트업"}님이 리뷰를 남겼습니다. (${rating}점)`,
          link: `/enabler-dashboard`,
        });
      } catch { /* 무시 */ }
    })();

    return NextResponse.json({ review: data });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
