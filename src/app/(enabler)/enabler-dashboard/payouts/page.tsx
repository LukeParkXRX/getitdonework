import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import PayoutsClient from "./PayoutsClient";
import type { PayoutAccount, InvoiceSummary, EarningsSummary } from "./PayoutsClient";

export default async function EnablerPayoutsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: userRow } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userRow?.role !== "enabler" && userRow?.role !== "super_admin") redirect("/");

  // 정산 계정
  const { data: accountRow } = await db
    .from("enabler_payout_accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // 최근 인보이스 5건
  const { data: invoiceRows } = await db
    .from("invoices")
    .select("id, period_start, period_end, total_credits, total_net, status, created_at")
    .eq("enabler_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // 누적 earnings 합계
  const { data: earningRows } = await db
    .from("enabler_earnings")
    .select("net_amount, status, credit_rate")
    .eq("enabler_id", user.id)
    .neq("status", "reversed");

  const allEarnings = (earningRows ?? []) as Array<{
    net_amount: number;
    status: string;
    credit_rate: number;
  }>;

  // KRW → USD 환산: credit_rate는 원/크레딧, net_amount는 KRW
  // 기본 환율 1350으로 USD 환산
  const DEFAULT_KRW_PER_USD = 1350;
  function toUsd(krw: number) {
    return Math.round((krw / DEFAULT_KRW_PER_USD) * 100) / 100;
  }

  const summary: EarningsSummary = {
    accrued: toUsd(
      allEarnings
        .filter((e) => e.status === "accrued")
        .reduce((s, e) => s + Number(e.net_amount), 0)
    ),
    invoiced: toUsd(
      allEarnings
        .filter((e) => e.status === "invoiced")
        .reduce((s, e) => s + Number(e.net_amount), 0)
    ),
    paid: toUsd(
      allEarnings
        .filter((e) => e.status === "paid")
        .reduce((s, e) => s + Number(e.net_amount), 0)
    ),
  };

  return (
    <PayoutsClient
      account={(accountRow as PayoutAccount) ?? null}
      invoices={(invoiceRows ?? []) as InvoiceSummary[]}
      earnings={summary}
    />
  );
}
