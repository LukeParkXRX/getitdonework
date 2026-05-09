import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAdminDb() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, db: null, userId: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: me } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "super_admin") return { error: "Forbidden", status: 403, db: null, userId: null };

  return { error: null, status: 200, db, userId: user.id };
}

export async function GET(request: Request) {
  try {
    const { error, status, db } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? "pending"; // pending | resolved | dismissed | all

    // 신고 목록 조회 — 같은 리뷰의 최초 pending 신고만 대표로 가져옴
    // review 정보(별점, 본문, 신고 수)와 신고자 정보 함께 포함
    let query = db
      .from("review_reports")
      .select(
        `
        id,
        reason,
        details,
        status,
        created_at,
        resolved_at,
        reporter:reporter_id ( id, full_name, email ),
        review:review_id (
          id,
          rating,
          comment,
          created_at,
          hidden_at,
          report_count,
          author:author_id ( id, full_name ),
          target:target_id ( id, full_name )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error: fetchErr } = await query;
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    return NextResponse.json({ reports: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}