export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { stripeEnabled, getStripeClient, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let stripe: ReturnType<typeof getStripeClient>;
  try {
    stripe = getStripeClient();
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  // 서명 검증
  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // service role client — RLS 우회
  let db: ReturnType<typeof createServiceClient>;
  try {
    db = createServiceClient();
  } catch (err) {
    console.error("[webhook] service client init failed:", err);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        const userId = meta.userId;
        const packageId = meta.packageId;
        const credits = parseInt(meta.credits ?? "0", 10);
        const amountKrw = parseInt(meta.amountKrw ?? "0", 10);

        if (!userId || !packageId || credits <= 0) {
          console.warn("[webhook] incomplete metadata", meta);
          return NextResponse.json({ received: true });
        }

        // RPC 호출 — idempotent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rpcResult, error: rpcErr } = await (db as any).rpc("purchase_credits", {
          p_provider_session_id: session.id,
          p_provider_payment_id: session.payment_intent ?? null,
          p_startup_id: userId,
          p_org_id: null,
          p_package_id: packageId,
          p_credits: credits,
          p_amount_krw: amountKrw,
        });

        if (rpcErr) {
          console.error("[webhook] purchase_credits RPC error:", rpcErr);
          return NextResponse.json({ error: rpcErr.message }, { status: 500 });
        }

        // 중복 webhook이면 알림 스킵
        if (rpcResult?.duplicate) {
          return NextResponse.json({ received: true, duplicate: true });
        }

        // 구매 완료 알림
        await createNotification(db, {
          userId,
          type: "application_status",
          title: "크레딧 구매 완료",
          body: `${credits}크레딧이 충전되었습니다.`,
          link: "/credits",
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as import("stripe").Stripe.PaymentIntent;
        console.warn("[webhook] payment_intent.payment_failed:", pi.id);
        // 별도 purchase row가 없을 수 있음 — 로그만 기록
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as import("stripe").Stripe.Charge;
        // PaymentIntent → Checkout Session ID를 역방향으로 찾기 어려우므로
        // checkout.session.completed에서 저장된 provider_payment_id로 purchase 조회
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id ?? null;

        if (!paymentIntentId) break;

        // provider_payment_id로 purchase 조회
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: purchase } = await (db as any)
          .from("credit_purchases")
          .select("provider_session_id, startup_id")
          .eq("provider_payment_id", paymentIntentId)
          .maybeSingle();

        if (!purchase?.provider_session_id) {
          console.warn("[webhook] charge.refunded: purchase not found for pi:", paymentIntentId);
          break;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: refundErr } = await (db as any).rpc("refund_credits", {
          p_provider_session_id: purchase.provider_session_id,
        });

        if (refundErr) {
          console.error("[webhook] refund_credits RPC error:", refundErr);
          return NextResponse.json({ error: refundErr.message }, { status: 500 });
        }

        if (purchase.startup_id) {
          await createNotification(db, {
            userId: purchase.startup_id,
            type: "application_status",
            title: "크레딧 환불 완료",
            body: "결제 환불이 처리되어 크레딧이 차감되었습니다.",
            link: "/credits",
          });
        }

        break;
      }

      default:
        // 처리하지 않는 이벤트 — 200 반환
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
