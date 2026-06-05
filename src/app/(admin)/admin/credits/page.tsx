import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CreditsAdminClient, {
  type TransactionRecord,
  type CreditSummary,
} from "./CreditsAdminClient";
import type { CreditTransactionType } from "@/types";

export default async function CreditsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: me } = await db
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();
  if (me?.role !== "super_admin") redirect("/");

  // 트랜잭션 fetch
  const { data: txs } = await db
    .from("credit_transactions")
    .select(
      "id, tx_type, amount, startup_id, enabler_id, org_id, booking_id, description, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rawTxs = (txs ?? []) as Array<{
    id: string;
    tx_type: string;
    amount: number;
    startup_id: string | null;
    enabler_id: string | null;
    org_id: string | null;
    booking_id: string | null;
    description: string;
    created_at: string;
  }>;

  // 연관 user IDs 수집 (startup + enabler)
  const startupIds = Array.from(
    new Set(rawTxs.map((t) => t.startup_id).filter(Boolean) as string[])
  );
  const enablerIds = Array.from(
    new Set(rawTxs.map((t) => t.enabler_id).filter(Boolean) as string[])
  );
  const allUserIds = Array.from(new Set([...startupIds, ...enablerIds]));
  const orgIds = Array.from(
    new Set(rawTxs.map((t) => t.org_id).filter(Boolean) as string[])
  );

  const [usersResult, orgsResult] = await Promise.all([
    allUserIds.length
      ? db.from("users").select("id, full_name").in("id", allUserIds)
      : { data: [] },
    orgIds.length
      ? db.from("organizations").select("id, name").in("id", orgIds)
      : { data: [] },
  ]);

  const userMap = new Map<string, string>(
    ((usersResult.data ?? []) as { id: string; full_name: string }[]).map(
      (u) => [u.id, u.full_name]
    )
  );
  const orgMap = new Map<string, string>(
    ((orgsResult.data ?? []) as { id: string; name: string }[]).map((o) => [
      o.id,
      o.name,
    ])
  );

  // 변환
  const transactions: TransactionRecord[] = rawTxs.map((t) => ({
    id: t.id,
    txType: t.tx_type as CreditTransactionType,
    amount: t.amount,
    startupName: t.startup_id ? userMap.get(t.startup_id) : undefined,
    enablerName: t.enabler_id ? userMap.get(t.enabler_id) : undefined,
    orgName: t.org_id ? orgMap.get(t.org_id) : undefined,
    bookingId: t.booking_id ?? undefined,
    description: t.description ?? "",
    createdAt: t.created_at,
  }));

  // 이번 달 계산 (현재 월)
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const summary: CreditSummary = {
    totalCirculation: transactions
      .filter((t) => t.txType === "purchase")
      .reduce((s, t) => s + t.amount, 0),
    thisMonthUsed: transactions
      .filter(
        (t) =>
          t.createdAt.startsWith(thisMonth) &&
          (t.txType === "use" || t.txType === "confirm")
      )
      .reduce((s, t) => s + Math.abs(t.amount), 0),
    thisMonthPurchased: transactions
      .filter(
        (t) => t.createdAt.startsWith(thisMonth) && t.txType === "purchase"
      )
      .reduce((s, t) => s + t.amount, 0),
    thisMonthRefunded: transactions
      .filter(
        (t) => t.createdAt.startsWith(thisMonth) && t.txType === "refund"
      )
      .reduce((s, t) => s + t.amount, 0),
  };

  // 스타트업 목록 조회
  const { data: startupsRaw } = await db
    .from("users")
    .select("id, full_name, email")
    .eq("role", "startup");

  const startupRows = (startupsRaw ?? []) as Array<{ id: string; full_name: string; email: string }>;
  const startupProfileIds = startupRows.map((s) => s.id);
  const { data: startupBalancesRaw } = startupProfileIds.length
    ? await db
        .from("startup_profiles")
        .select("user_id, credit_balance")
        .in("user_id", startupProfileIds)
    : { data: [] };
  const startupBalanceMap = new Map(
    ((startupBalancesRaw ?? []) as Array<{ user_id: string; credit_balance: number }>).map((row) => [
      row.user_id,
      row.credit_balance ?? 0,
    ])
  );
  const startups = startupRows.map((startup) => ({
    ...startup,
    credit_balance: startupBalanceMap.get(startup.id) ?? 0,
  }));

  // 기관 목록 조회
  const { data: orgs } = await db
    .from("organizations")
    .select("id, name, total_credits");

  return (
    <CreditsAdminClient
      transactions={transactions}
      summary={summary}
      startups={startups}
      organizations={(orgs ?? []) as Array<{ id: string; name: string; total_credits: number }>}
    />
  );
}
