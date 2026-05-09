import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const { error, status, db, userId: adminId } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const body = (await request.json()) as { action: "hide_review" | "dismiss" };
    const { action } = body;

    if (action !== "hide_review" && action !== "dismiss") {
      return NextResponse.json({ error: "action must be hide_review or dismiss" }, { status: 400 });
    }

    // 신고 정보 조회
    const { data: report, error: reportErr } = await db
      .from("review_reports")
      .select("id, review_id, reason, status")
      .eq("id", reportId)
      .maybeSingle();

    if (reportErr || !report) {
      return NextResponse.json({ error: "신고를 찾을 수 없습니다" }, { status: 404 });
    }

    if (report.status !== "pending") {
      return NextResponse.json({ error: "이미 처리된 신고입니다" }, { status: 409 });
    }

    const now = new Date().toISOString();

    if (action === "hide_review") {
      // 리뷰 숨김 처리
      const { data: review, error: reviewErr } = await db
        .from("reviews")
        .update({
          hidden_at: now,
          hidden_by: adminId,
          hidden_reason: report.reason,
        })
        .eq("id", report.review_id)
        .select("id, author_id")
        .single();

      if (reviewErr) return NextResponse.json({ error: reviewErr.message }, { status: 500 });

      // 같은 리뷰의 모든 pending 신고 resolved 처리
      await db
        .from("review_reports")
        .update({ status: "resolved", resolved_by: adminId, resolved_at: now })
        .eq("review_id", report.review_id)
        .eq("status", "pending");

      // 리뷰 작성자에게 알림
      if (review?.author_id) {
        void (async () => {
          try {
            await createNotification(db, {
              userId: review.author_id,
              type: "review_hidden",
              title: "리뷰가 비공개 처리됐습니다",
              body: "운영 정책 위반으로 회원님의 리뷰가 비공개 처리됐습니다.",
              link: "/my",
            });
          } catch { /* 무시 */ }
        })();
      }

      return NextResponse.json({ ok: true, action: "hide_review" });
    }

    // dismiss
    const { error: dismissErr } = await db
      .from("review_reports")
      .update({ status: "dismissed", resolved_by: adminId, resolved_at: now })
      .eq("id", reportId);

    if (dismissErr) return NextResponse.json({ error: dismissErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, action: "dismiss" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
