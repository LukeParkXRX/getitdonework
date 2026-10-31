import Stripe from "stripe";

/**
 * Stripe API 호출 가능 여부.
 * Checkout 생성, 환불, 송금처럼 Stripe 서버 API를 부를 때 사용한다.
 */
export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Stripe webhook 검증 가능 여부.
 * 결제 성공 처리는 반드시 STRIPE_WEBHOOK_SECRET까지 있어야 안전하다.
 */
export function stripeWebhookEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

/**
 * 서버 사이드 Stripe 클라이언트.
 * stripeEnabled() 확인 후 호출할 것.
 */
export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
