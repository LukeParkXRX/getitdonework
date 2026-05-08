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
  const { data: me } = await (supabase as any)
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") return { error: "Forbidden", status: 403, userId: null };
  return { error: null, status: 200, userId: user.id };
}

// POST /api/admin/payouts/generate
// body: { period_start?: string (YYYY-MM-DD), period_end?: string }
// default: 전월 1일 ~ 전월 말일
export async function POST(request: Request) {
  try {
    const { error, status } = await getAdminUser();
    if (error) return NextResponse.json({ error }, { status });

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({})) as {
      period_start?: string;
      period_end?: string;
    };

    // 기본값: 전월
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
    const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);

    const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

    const periodStart = body.period_start ?? toDateStr(firstOfPrevMonth);
    const periodEnd = body.period_end ?? toDateStr(lastOfPrevMonth);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: rpcErr } = await (db as any).rpc("generate_monthly_invoices", {
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 });

    return NextResponse.json({ results: data ?? [], period_start: periodStart, period_end: periodEnd });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
