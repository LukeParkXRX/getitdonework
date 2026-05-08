import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { stripeEnabled, getStripeClient } from "@/lib/stripe";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { payoutCompletedEmail } from "@/lib/emails/templates";

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

    // 현재 invoice 상태 확인
    const { data: invoice, error: invErr } = await dbAny
      .from("invoices")
      .select(
        `id, enabler_id, period_start, period_end, total_credits, total_net,
         total_net_usd, status,
         enabler:enabler_id ( id, full_name, email )`
      )
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

    // ─── APPROVE ──────────────────────────────────────────────────────────────

    if (action === "approve") {
      // 1. Enabler Connect 계정 확인
      const { data: account } = await dbAny
        .from("enabler_payout_accounts")
        .select("stripe_account_id, status")
        .eq("user_id", invoice.enabler_id)
        .maybeSingle();

      const connectReady = account?.stripe_account_id && account?.status === "active";

      // 2. Stripe 미설정 또는 Connect 계정 미완료 → dry-run
      if (!stripeEnabled() || !connectReady) {
        const dryRunNote = !stripeEnabled()
          ? " [DRY RUN: Stripe 미설정으로 실 송금 안 됨]"
          : " [DRY RUN: Enabler Connect 계정 미완료로 실 송금 안 됨]";

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

        if (!connectReady && account?.status) {
          return NextResponse.json({
            error: "Enabler가 Stripe Connect 정산 계정을 완료하지 않았습니다.",
            code: "ENABLER_PAYOUT_INCOMPLETE",
            dry_run: true,
            invoice: data,
          }, { status: 422 });
        }

        return NextResponse.json({ ok: true, dry_run: true, note: dryRunNote, invoice: data });
      }

      // 3. Stripe Transfer 호출
      const stripe = getStripeClient();

      // USD 금액: total_net_usd 있으면 사용, 없으면 total_net(KRW) / 1350 환산
      const amountUsd =
        invoice.total_net_usd != null
          ? Number(invoice.total_net_usd)
          : Math.round((Number(invoice.total_net) / 1350) * 100) / 100;

      const amountInCents = Math.round(amountUsd * 100);

      if (amountInCents <= 0) {
        return NextResponse.json({ error: "정산 금액이 0입니다." }, { status: 400 });
      }

      const enablerName =
        (Array.isArray(invoice.enabler) ? invoice.enabler[0]?.full_name : invoice.enabler?.full_name) ?? "Enabler";
      const enablerEmail =
        (Array.isArray(invoice.enabler) ? invoice.enabler[0]?.email : invoice.enabler?.email) ?? null;

      let transfer: { id: string };
      try {
        transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: "usd",
          destination: account.stripe_account_id,
          description: `Invoice ${invoice.id} for ${enablerName}`,
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.id,
            enabler_id: invoice.enabler_id,
            period: `${invoice.period_start}~${invoice.period_end}`,
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Stripe Transfer 실패";
        return NextResponse.json({ error: `송금 실패: ${msg}` }, { status: 502 });
      }

      // 4. DB 업데이트: invoice → paid
      const { error: updateErr } = await dbAny
        .from("invoices")
        .update({
          status: "paid",
          approved_by: userId,
          approved_at: now,
          paid_at: now,
          stripe_transfer_id: transfer.id,
          updated_at: now,
        })
        .eq("id", id);

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      // 5. earnings invoiced → paid
      await dbAny
        .from("enabler_earnings")
        .update({ status: "paid" })
        .eq("invoice_id", id)
        .eq("status", "invoiced");

      // 6. 인앱 알림 (fire-and-forget)
      createNotification(db, {
        userId: invoice.enabler_id,
        type: "payout_paid",
        title: "정산 완료",
        body: `${invoice.id} — $${amountUsd} 정산이 완료됐습니다.`,
        link: "/enabler-dashboard/earnings",
      }).catch(() => {});

      // 7. 이메일 (fire-and-forget)
      if (enablerEmail) {
        sendEmail(
          enablerEmail,
          payoutCompletedEmail({
            enablerName,
            invoiceNumber: invoice.id,
            periodStart: invoice.period_start,
            periodEnd: invoice.period_end,
            amountUsd,
            transferId: transfer.id,
          })
        ).catch(() => {});
      }

      return NextResponse.json({ ok: true, transfer_id: transfer.id });
    }

    // ─── CANCEL ───────────────────────────────────────────────────────────────

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
