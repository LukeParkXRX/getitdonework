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

// GET /api/admin/payouts/[id]
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error, status } = await getAdminUser();
    if (error) return NextResponse.json({ error }, { status });

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;

    const { data: invoice, error: invErr } = await dbAny
      .from("invoices")
      .select(
        `id, enabler_id, period_start, period_end, total_credits, total_net,
         status, approved_by, approved_at, cancelled_by, cancelled_at, cancel_reason,
         created_at, updated_at,
         enabler:enabler_id ( id, full_name, email )`
      )
      .eq("id", id)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { data: earnings, error: earnErr } = await dbAny
      .from("enabler_earnings")
      .select(
        `id, booking_id, credits_earned, fee_pct, net_amount, credit_rate,
         status, accrued_at,
         booking:booking_id ( id, type, scheduled_at, credits_amount )`
      )
      .eq("invoice_id", id)
      .order("accrued_at", { ascending: false });

    if (earnErr) return NextResponse.json({ error: earnErr.message }, { status: 500 });

    return NextResponse.json({ invoice, earnings: earnings ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/payouts/[id]
// body: { action: "approve" | "cancel", cancel_reason?: string }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error, status, userId } = await getAdminUser();
    if (error || !userId) return NextResponse.json({ error }, { status });

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const body = await request.json() as { action: string; cancel_reason?: string };
    const { action, cancel_reason } = body;

    if (!["approve", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use approve or cancel" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;

    // 현재 상태 확인
    const { data: invoice, error: invErr } = await dbAny
      .from("invoices")
      .select("id, status")
      .eq("id", id)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "pending") {
      return NextResponse.json(
        { error: `처리할 수 없는 상태입니다: ${invoice.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      const { data, error: updateErr } = await dbAny
        .from("invoices")
        .update({
          status: "approved",
          approved_by: userId,
          approved_at: now,
          updated_at: now,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
      return NextResponse.json({ invoice: data });
    }

    // cancel
    const { data, error: updateErr } = await dbAny
      .from("invoices")
      .update({
        status: "cancelled",
        cancelled_by: userId,
        cancelled_at: now,
        cancel_reason: cancel_reason ?? null,
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    return NextResponse.json({ invoice: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
