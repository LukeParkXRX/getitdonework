import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const uid = user.id;

    // 본인 users row
    const { data: userRow } = await db.from("users").select("*").eq("id", uid).maybeSingle();

    // 역할별 프로필
    const { data: startupProfile } = await db
      .from("startup_profiles")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    const { data: enablerProfile } = await db
      .from("enabler_profiles")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    // 예약 (startup 또는 enabler 본인)
    const { data: bookingsAsStartup } = await db
      .from("bookings")
      .select("*")
      .eq("startup_user_id", uid);
    const { data: bookingsAsEnabler } = await db
      .from("bookings")
      .select("*")
      .eq("enabler_user_id", uid);

    // 리뷰 (author 또는 target)
    const { data: reviewsAsAuthor } = await db
      .from("reviews")
      .select("*")
      .eq("reviewer_id", uid);
    const { data: reviewsAsTarget } = await db
      .from("reviews")
      .select("*")
      .eq("reviewee_id", uid);

    // 크레딧 트랜잭션
    const { data: creditTransactions } = await db
      .from("credit_transactions")
      .select("*")
      .eq("user_id", uid);

    // 알림
    const { data: notifications } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(500);

    // 삭제 요청
    const { data: deletionRequest } = await db
      .from("account_deletion_requests")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();

    // 약관 동의 이력
    const { data: termsAcceptances } = await db
      .from("user_terms_acceptances")
      .select("*, terms_versions(*)")
      .eq("user_id", uid);

    const payload = {
      exported_at: new Date().toISOString(),
      user: userRow,
      startup_profile: startupProfile,
      enabler_profile: enablerProfile,
      bookings: {
        as_startup: bookingsAsStartup ?? [],
        as_enabler: bookingsAsEnabler ?? [],
      },
      reviews: {
        as_author: reviewsAsAuthor ?? [],
        as_target: reviewsAsTarget ?? [],
      },
      credit_transactions: creditTransactions ?? [],
      notifications: notifications ?? [],
      deletion_request: deletionRequest,
      terms_acceptances: termsAcceptances ?? [],
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
