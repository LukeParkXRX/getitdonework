export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { stripeEnabled, getStripeClient, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { createNotification } from "@/lib/notifications";
import { getPaymentSettings } from "@/lib/payment-settings";

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

        // 결제 정책 조회
        const settings = await getPaymentSettings();
        const currency = (session.currency ?? "krw").toLowerCase();
        const amountCents = session.amount_total ?? amountKrw;

        const overThreshold =
          currency === settings.autoApproveCurrency.toLowerCase() &&
          amountCents > settings.autoApproveThresholdCents;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbAny = db as any;

        if (overThreshold) {
          // 관리자 승인 대기 — credit_purchases upsert (pending_admin)
          const expiresAt = new Date(
            Date.now() + settings.approvalExpiryDays * 24 * 60 * 60 * 1000
          ).toISOString();

          const { error: upsertErr } = await dbAny
            .from("credit_purchases")
            .upsert(
              {
                provider_session_id: session.id,
                provider_payment_id: session.payment_intent ?? null,
                startup_id: userId,
                org_id: null,
                package_id: packageId,
                credits: credits,
                amount_krw: amountKrw,
                status: "paid_pending_admin",
                expires_at: expiresAt,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "provider_session_id", ignoreDuplicates: false }
            );

          if (upsertErr) {
            console.error("[webhook] pending upsert error:", upsertErr);
            return NextResponse.json({ error: upsertErr.message }, { status: 500 });
          }

          // super_admin 전체에게 인앱 알림
          const { data: admins } = await dbAny
            .from("users")
            .select("id")
            .eq("role", "super_admin");

          if (admins && admins.length > 0) {
            for (const admin of admins) {
              await createNotification(db, {
                userId: admin.id,
                type: "application_status",
                title: "결제 승인 요청",
                body: `${credits}크레딧 (${amountKrw.toLocaleString("ko-KR")}원) 결제가 승인을 기다리고 있습니다.`,
                link: "/admin/payment-approvals",
              });
            }
          }

          // 구매자에게 대기 안내 알림
          await createNotification(db, {
            userId,
            type: "application_status",
            title: "결제 확인 중",
            body: `${credits}크레딧 결제가 완료되었습니다. 관리자 승인 후 크레딧이 충전됩니다.`,
            link: "/credits",
          });
        } else {
          // 임계 이하 — 즉시 충전 (기존 흐름)
          const { data: rpcResult, error: rpcErr } = await dbAny.rpc("purchase_credits", {
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

          if (rpcResult?.duplicate) {
            return NextResponse.json({ received: true, duplicate: true });
          }

          await createNotification(db, {
            userId,
            type: "application_status",
            title: "크레딧 구매 완료",
            body: `${credits}크레딧이 충전되었습니다.`,
            link: "/credits",
          });
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as import("stripe").Stripe.PaymentIntent;
        console.warn("[webhook] payment_intent.payment_failed:", pi.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as import("stripe").Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id ?? null;

        if (!paymentIntentId) break;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbAny = db as any;
        const { data: purchase } = await dbAny
          .from("credit_purchases")
          .select("provider_session_id, startup_id")
          .eq("provider_payment_id", paymentIntentId)
          .maybeSingle();

        if (!purchase?.provider_session_id) {
          console.warn("[webhook] charge.refunded: purchase not found for pi:", paymentIntentId);
          break;
        }

        const { error: refundErr } = await dbAny.rpc("refund_credits", {
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

        // 환불 시 연관 enabler_earnings 상태를 reversed로 변경
        // (해당 크레딧으로 진행된 booking의 accrued earnings만 대상)
        try {
          // provider_session_id로 연관 bookings 탐색 — credit_purchases.provider_session_id 기준
          const { data: relatedBookings } = await dbAny
            .from("bookings")
            .select("id")
            .eq("credit_purchase_session_id", purchase.provider_session_id);

          if (relatedBookings && relatedBookings.length > 0) {
            const bookingIds = relatedBookings.map((b: { id: string }) => b.id);
            await dbAny
              .from("enabler_earnings")
              .update({ status: "reversed" })
              .in("booking_id", bookingIds)
              .eq("status", "accrued");
          }
        } catch { /* 수익 역전 실패는 로그만 남기고 진행 */ }

        break;
      }

      case "account.updated": {
        // Stripe Connect Express 계정 상태 변경 → enabler_payout_accounts DB 업데이트
        const acct = event.data.object as import("stripe").Stripe.Account;

        const { data: payoutRow } = await (db as any)
          .from("enabler_payout_accounts")
          .select("user_id")
          .eq("stripe_account_id", acct.id)
          .maybeSingle();

        if (!payoutRow?.user_id) {
          // 알 수 없는 계정 — 무시
          break;
        }

        const externalAccounts = acct.external_accounts?.data ?? [];
        const firstBank = externalAccounts[0] as
          | { last4?: string; country?: string; currency?: string }
          | undefined;

        const chargesEnabled = acct.charges_enabled ?? false;
        const payoutsEnabled = acct.payouts_enabled ?? false;
        const detailsSubmitted = acct.details_submitted ?? false;

        let newStatus: string;
        if (chargesEnabled && payoutsEnabled) {
          newStatus = "active";
        } else if (acct.requirements?.disabled_reason) {
          newStatus = "restricted";
        } else {
          newStatus = "incomplete";
        }

        await (db as any)
          .from("enabler_payout_accounts")
          .update({
            charges_enabled: chargesEnabled,
            payouts_enabled: payoutsEnabled,
            details_submitted: detailsSubmitted,
            onboarding_completed: detailsSubmitted,
            status: newStatus,
            requirements_pending: acct.requirements?.currently_due ?? [],
            bank_account_last4: firstBank?.last4 ?? null,
            bank_country: firstBank?.country ?? null,
            bank_currency: firstBank?.currency ?? null,
            raw_payload: acct,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", payoutRow.user_id);

        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
