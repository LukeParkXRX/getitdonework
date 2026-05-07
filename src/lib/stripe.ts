import Stripe from "stripe";

/**
 * Stripe 활성화 여부 가드.
 * STRIPE_SECRET_KEY 없으면 결제 기능 전체 비활성.
 */
export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
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
