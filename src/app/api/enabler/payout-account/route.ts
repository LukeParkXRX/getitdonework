export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripeEnabled, getStripeClient } from "@/lib/stripe";

async function getEnablerUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, user: null, supabase: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: me } = await db
    .from("users")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "enabler" && me?.role !== "super_admin") {
    return { error: "Forbidden", status: 403, user: null, supabase: null };
  }

  return { error: null, status: 200, user: { ...user, role: me?.role }, supabase };
}

// GET /api/enabler/payout-account
// 본인 enabler_payout_accounts row 반환. 없으면 null
export async function GET() {
  try {
    const { error, status, user, supabase } = await getEnablerUser();
    if (error || !user || !supabase) return NextResponse.json({ error }, { status });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error: dbErr } = await db
      .from("enabler_payout_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ account: data ?? null });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/enabler/payout-account
// body: { country: string, business_type?: "individual" | "company" }
// Stripe Connect Express 계정 생성 후 onboarding_url 반환
export async function POST(request: Request) {
  try {
    const { error, status, user, supabase } = await getEnablerUser();
    if (error || !user || !supabase) return NextResponse.json({ error }, { status });

    if (!stripeEnabled()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const body = await request.json() as { country?: string; business_type?: string };
    const country = body.country ?? "US";
    const businessType = (body.business_type ?? "individual") as "individual" | "company";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 기존 row 확인
    const { data: existing } = await db
      .from("enabler_payout_accounts")
      .select("stripe_account_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    let stripeAccountId: string;

    if (existing?.stripe_account_id) {
      stripeAccountId = existing.stripe_account_id;
    } else {
      // Stripe Connect Express 계정 생성
      const stripe = getStripeClient();
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email: user.email ?? undefined,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: businessType,
      });
      stripeAccountId = account.id;

      // DB upsert
      const now = new Date().toISOString();
      const { error: upsertErr } = await db
        .from("enabler_payout_accounts")
        .upsert(
          {
            user_id: user.id,
            stripe_account_id: stripeAccountId,
            status: "incomplete",
            bank_country: country,
            updated_at: now,
          },
          { onConflict: "user_id" }
        );

      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }
    }

    // onboarding link 생성
    const stripe = getStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/enabler-dashboard/payouts?status=refresh`,
      return_url: `${appUrl}/enabler-dashboard/payouts?status=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ accountId: stripeAccountId, onboarding_url: link.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe account creation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/enabler/payout-account
// body: { tax_form_type: "w9" | "w8ben" | "w8ben_e" | "none", tax_form_url: string | null }
// 세무 서류 종류 및 업로드 파일 경로 업데이트
export async function PATCH(request: Request) {
  try {
    const { error, status, user, supabase } = await getEnablerUser();
    if (error || !user || !supabase) return NextResponse.json({ error }, { status });

    const body = await request.json() as { tax_form_type?: string; tax_form_url?: string | null };
    const taxFormType = body.tax_form_type ?? "none";
    const taxFormUrl = body.tax_form_url ?? null;

    if (!["w9", "w8ben", "w8ben_e", "none"].includes(taxFormType)) {
      return NextResponse.json({ error: "Invalid tax form type" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const now = new Date().toISOString();

    const { error: upsertErr } = await db
      .from("enabler_payout_accounts")
      .upsert(
        {
          user_id: user.id,
          tax_form_type: taxFormType,
          tax_form_url: taxFormUrl,
          tax_form_completed: !!taxFormUrl,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update tax form info";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
