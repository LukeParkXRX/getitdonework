import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const body = (await request.json()) as { reason?: string; details?: string };
    const { reason, details } = body;

    if (!reason || reason.trim() === "") {
      return NextResponse.json({ error: "reason 필드는 필수입니다" }, { status: 400 });
    }

    // 리뷰 존재 확인 + 본인 리뷰 여부 체크
    const { data: review, error: reviewErr } = await db
      .from("reviews")
      .select("id, author_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewErr || !review) {
      return NextResponse.json({ error: "리뷰를 찾을 수 없습니다" }, { status: 404 });
    }

    if (review.author_id === user.id) {
      return NextResponse.json({ error: "본인 리뷰는 신고할 수 없습니다" }, { status: 403 });
    }

    const { error: insertErr } = await db.from("review_reports").insert({
      review_id: reviewId,
      reporter_id: user.id,
      reason: reason.trim(),
      details: details?.trim() ?? null,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        return NextResponse.json(
          { error: "이미 신고하셨습니다" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
