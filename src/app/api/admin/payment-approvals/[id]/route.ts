import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripeEnabled, getStripeClient } from "@/lib/stripe";
import { createNotification } from "@/lib/notifications";
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

// POST /api/admin/payment-approvals/[id]
// body: { action: "approve" | "reject", reason?: string }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, status, userId } = await getAdminUser();
    if (error || !userId) return NextResponse.json({ error }, { status });

    const { id: purchaseId } = await params;

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;

    const body = await request.json() as { action: "approve" | "reject"; reason?: string };
    const { action, reason } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }

    // 구매 기록 조회
    const { data: purchase, error: fetchErr } = await dbAny
      .from("credit_purchases")
      .select("id, status, credits, amount_krw, startup_id, provider_payment_id, provider_session_id")
      .eq("id", purchaseId)
      .maybeSingle();

    if (fetchErr || !purchase) {
      return NextResponse.json({ error: "결제 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    if (purchase.status !== "paid_pending_admin") {
      return NextResponse.json(
        { error: `승인 대기 상태가 아닙니다 (현재: ${purchase.status}).` },
        { status: 409 }
      );
    }

    if (action === "approve") {
      // RPC 호출 — 크레딧 충전 + status=completed
      const { data: rpcResult, error: rpcErr } = await dbAny.rpc("approve_pending_purchase", {
        p_purchase_id: purchaseId,
        p_admin_id: userId,
      });

      if (rpcErr) {
        console.error("[payment-approvals] approve RPC error:", rpcErr);
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      // 사용자 알림
      if (purchase.startup_id) {
        await createNotification(db, {
          userId: purchase.startup_id,
          type: "application_status",
          title: "결제 승인 완료",
          body: `${purchase.credits}크레딧이 충전되었습니다. 이제 바로 사용할 수 있습니다.`,
          link: "/credits",
        });
      }

      return NextResponse.json({ ok: true, result: rpcResult });
    }

    // action === "reject"
    // Stripe 환불 시도
    if (stripeEnabled() && purchase.provider_payment_id) {
      try {
        const stripe = getStripeClient();
        await stripe.refunds.create({
          payment_intent: purchase.provider_payment_id,
          reason: "requested_by_customer",
        });
      } catch (stripeErr) {
        console.error("[payment-approvals] stripe refund error:", stripeErr);
        // 환불 실패 시에도 DB 상태는 rejected로 기록 (운영자가 수동 처리)
      }
    } else if (!stripeEnabled()) {
      console.warn("[payment-approvals] Stripe 미설정 — 환불 스킵. 수동 처리 필요.");
    } else if (!purchase.provider_payment_id) {
      console.warn("[payment-approvals] provider_payment_id 없음 — 환불 스킵.");
    }

    // DB 상태 업데이트
    const { error: updateErr } = await dbAny
      .from("credit_purchases")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        rejection_reason: reason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchaseId);

    if (updateErr) {
      console.error("[payment-approvals] reject update error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 사용자 알림
    if (purchase.startup_id) {
      await createNotification(db, {
        userId: purchase.startup_id,
        type: "application_status",
        title: "결제 거절 및 환불 처리",
        body: `결제가 승인되지 않았습니다. 환불이 처리되었으며 2-5 영업일 내 반환됩니다.${reason ? ` 사유: ${reason}` : ""}`,
        link: "/credits",
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
