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
  if (me?.role !== "super_admin")
    return { error: "Forbidden", status: 403, db: null, userId: null };

  return { error: null, status: 200, db, userId: user.id };
}

export async function GET(request: Request) {
  try {
    const { error, status, db } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? "all";

    let query = db
      .from("disputes")
      .select(
        `id, status, filer_role, reason, created_at, resolved_at, refund_amount,
         booking:bookings!disputes_booking_id_fkey(id, credits_amount, scheduled_at, type),
         filer:users!disputes_filer_id_fkey(id, full_name, email)`
      )
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      if (statusFilter === "resolved") {
        query = query.in("status", [
          "resolved_refund",
          "resolved_partial",
          "resolved_dismissed",
        ]);
      } else {
        query = query.eq("status", statusFilter);
      }
    }

    const { data, error: fetchErr } = await query;
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    // 통계
    const { data: statsData } = await db
      .from("disputes")
      .select("status, created_at");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const stats = {
      open: 0,
      in_review: 0,
      resolved_this_month: 0,
    };

    for (const row of (statsData as { status: string; created_at: string }[]) ?? []) {
      if (row.status === "open") stats.open++;
      if (row.status === "in_review") stats.in_review++;
      if (
        ["resolved_refund", "resolved_partial", "resolved_dismissed"].includes(row.status) &&
        row.created_at >= monthStart
      ) {
        stats.resolved_this_month++;
      }
    }

    return NextResponse.json({ disputes: data, stats });
  } catch (e) {
    console.warn("GET /api/admin/disputes error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
