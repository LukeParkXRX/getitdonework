import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

async function getAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, userId: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: me } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") return { error: "Forbidden", status: 403, userId: null };

  return { error: null, status: 200, userId: user.id };
}

// GET /api/admin/payment-approvals
// paid_pending_admin 목록 반환. 만료 항목은 expired 처리(lazy).
export async function GET() {
  try {
    const { error, status, userId } = await getAdminUser();
    if (error || !userId) return NextResponse.json({ error }, { status });

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;

    // Lazy 만료: expires_at 지난 paid_pending_admin → expired 처리
    const now = new Date().toISOString();
    await dbAny
      .from("credit_purchases")
      .update({ status: "expired", updated_at: now })
      .eq("status", "paid_pending_admin")
      .lt("expires_at", now);

    // 목록 조회 (사용자·패키지 join)
    const { data: orders, error: dbErr } = await dbAny
      .from("credit_purchases")
      .select(
        `id, status, credits, amount_krw, expires_at, created_at, updated_at,
         rejection_reason, rejected_at, approved_at,
         users:startup_id ( id, name, email ),
         credit_packages:package_id ( id, name )`
      )
      .in("status", ["paid_pending_admin", "rejected", "expired"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    // 통계
    const pending = (orders ?? []).filter(
      (o: { status: string }) => o.status === "paid_pending_admin"
    ).length;

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const rejectedThisMonth = (orders ?? []).filter((o: { status: string; rejected_at: string | null }) => {
      if (o.status !== "rejected") return false;
      if (!o.rejected_at) return false;
      return new Date(o.rejected_at) >= thisMonthStart;
    }).length;

    return NextResponse.json({ orders: orders ?? [], stats: { pending, rejectedThisMonth } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
