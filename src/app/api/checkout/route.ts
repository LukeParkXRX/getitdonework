import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripeEnabled, getStripeClient } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://getitdonework.com";

export async function POST(request: Request) {
  const rl = rateLimit(`checkout:${getClientKey(request)}`, { max: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  // Stripe 미설정 시 503
  if (!stripeEnabled()) {
    return NextResponse.json(
      { error: "결제 서비스가 현재 준비 중입니다." },
      { status: 503 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // startup 역할 검증
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: profile } = await db
      .from("users")
      .select("role, email, name")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "startup") {
      return NextResponse.json(
        { error: "스타트업 계정만 크레딧을 구매할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { packageId } = body as { packageId: string };

    if (!packageId) {
      return NextResponse.json({ error: "packageId is required" }, { status: 400 });
    }

    // 패키지 조회
    const { data: pkg } = await db
      .from("credit_packages")
      .select("id, name, credits, price_krw, stripe_price_id, is_active")
      .eq("id", packageId)
      .single();

    if (!pkg || !pkg.is_active) {
      return NextResponse.json({ error: "패키지를 찾을 수 없습니다." }, { status: 404 });
    }

    const stripe = getStripeClient();

    // Stripe Checkout Session 생성
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? profile.email,
      line_items: pkg.stripe_price_id
        ? [{ price: pkg.stripe_price_id, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "krw",
                unit_amount: pkg.price_krw,
                product_data: {
                  name: `${pkg.name} — ${pkg.credits} 크레딧`,
                  description: `Get It Done at Work 크레딧 ${pkg.credits}개`,
                },
              },
              quantity: 1,
            },
          ],
      metadata: {
        userId: user.id,
        packageId: pkg.id,
        credits: String(pkg.credits),
        amountKrw: String(pkg.price_krw),
      },
      success_url: `${APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/credits/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
