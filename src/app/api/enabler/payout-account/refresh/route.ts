export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripeEnabled, getStripeClient } from "@/lib/stripe";

// POST /api/enabler/payout-account/refresh
// Stripe에서 최신 account 정보 가져와서 DB 업데이트
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

    const { data: existing } = await db
      .from("enabler_payout_accounts")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing?.stripe_account_id) {
      return NextResponse.json(
        { error: "Stripe Connect 계정이 없습니다." },
        { status: 400 }
      );
    }

    if (!stripeEnabled()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const stripe = getStripeClient();
    const acct = await stripe.accounts.retrieve(existing.stripe_account_id);

    // 외부 계좌 정보 추출
    const externalAccounts = acct.external_accounts?.data ?? [];
    const firstBank = externalAccounts[0] as
      | { last4?: string; country?: string; currency?: string; object?: string }
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

    const now = new Date().toISOString();
    const { data: updated, error: updateErr } = await db
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
        updated_at: now,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ account: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to refresh account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
