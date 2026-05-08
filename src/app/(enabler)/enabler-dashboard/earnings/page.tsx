import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import EarningsClient from "./EarningsClient";

export default async function EnablerEarningsPage() {
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

  const role = userRow?.role;
  if (role !== "enabler" && role !== "super_admin") redirect("/");

  // 본인 수익 내역 (RLS: enabler_id = auth.uid())
  const { data: earnings } = await db
    .from("enabler_earnings")
    .select(
      `id, booking_id, credits_earned, fee_pct, net_amount, credit_rate,
       status, accrued_at,
       booking:booking_id ( id, type, scheduled_at, credits_amount )`
    )
    .eq("enabler_id", user.id)
    .order("accrued_at", { ascending: false })
    .limit(200);

  // 누적 합계
  const allEarnings = earnings ?? [];
  const totalCredits = allEarnings
    .filter((e: { status: string }) => e.status !== "reversed")
    .reduce((sum: number, e: { credits_earned: number }) => sum + Number(e.credits_earned), 0);
  const totalNet = allEarnings
    .filter((e: { status: string }) => e.status !== "reversed")
    .reduce((sum: number, e: { net_amount: number }) => sum + Number(e.net_amount), 0);
  const pendingNet = allEarnings
    .filter((e: { status: string }) => e.status === "accrued")
    .reduce((sum: number, e: { net_amount: number }) => sum + Number(e.net_amount), 0);

  return (
    <EarningsClient
      earnings={allEarnings}
      summary={{ totalCredits, totalNet, pendingNet }}
    />
  );
}
