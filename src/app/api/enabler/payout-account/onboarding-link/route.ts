export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripeEnabled, getStripeClient } from "@/lib/stripe";

// POST /api/enabler/payout-account/onboarding-link
// 기존 stripe_account_id로 onboarding link 재생성
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: me } = await db
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (me?.role !== "enabler" && me?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: account } = await db
      .from("enabler_payout_accounts")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account?.stripe_account_id) {
      return NextResponse.json(
        { error: "Stripe Connect 계정이 없습니다. 먼저 계정을 생성해주세요." },
        { status: 400 }
      );
    }

    if (!stripeEnabled()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const link = await stripe.accountLinks.create({
      account: account.stripe_account_id,
      refresh_url: `${appUrl}/enabler-dashboard/payouts?status=refresh`,
      return_url: `${appUrl}/enabler-dashboard/payouts?status=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create onboarding link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
