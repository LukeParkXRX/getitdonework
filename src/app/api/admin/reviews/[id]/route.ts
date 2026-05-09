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

// PATCH /api/admin/reviews/[id]
// body: { action: "hide" | "unhide", reason?: string }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const { error, status, db, userId: adminId } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const body = (await request.json()) as { action: "hide" | "unhide"; reason?: string };
    const { action, reason } = body;

    if (action !== "hide" && action !== "unhide") {
      return NextResponse.json({ error: "action must be hide or unhide" }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === "hide") {
      const { error: updateErr } = await db
        .from("reviews")
        .update({
          hidden_at: now,
          hidden_by: adminId,
          hidden_reason: reason?.trim() ?? "관리자 직접 처리",
        })
        .eq("id", reviewId);

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, action: "hide" });
    }

    // unhide
    const { error: updateErr } = await db
      .from("reviews")
      .update({
        hidden_at: null,
        hidden_by: null,
        hidden_reason: null,
      })
      .eq("id", reviewId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "unhide" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
