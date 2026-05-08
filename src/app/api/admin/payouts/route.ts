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

// GET /api/admin/payouts?status=pending|approved|cancelled
export async function GET(request: Request) {
  try {
    const { error, status } = await getAdminUser();
    if (error) return NextResponse.json({ error }, { status });

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;
    let query = dbAny
      .from("invoices")
      .select(
        `id, enabler_id, period_start, period_end, total_credits, total_net,
         status, approved_at, cancelled_at, cancel_reason, created_at, updated_at,
         enabler:enabler_id ( id, full_name, email )`
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter && ["pending", "approved", "cancelled"].includes(statusFilter)) {
      query = query.eq("status", statusFilter);
    }

    const { data, error: fetchErr } = await query;
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    return NextResponse.json({ invoices: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
