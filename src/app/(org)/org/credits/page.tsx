import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import OrgCreditsClient, {
  type OrgInfo,
  type MemberRow,
  type ProfileRow,
  type TxRow,
} from "./OrgCreditsClient";

export default async function OrgCreditsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: me } = await db
    .from("users")
    .select("role, org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "org_admin" || !me?.org_id) redirect("/");

  const myOrgId = me.org_id as string;

  // 병렬 fetch: org + members
  const [orgResult, membersResult] = await Promise.all([
    db
      .from("organizations")
      .select("id, name, program_name, total_credits, invite_code")
      .eq("id", myOrgId)
      .maybeSingle(),
    db
      .from("users")
      .select("id, full_name, email")
      .eq("org_id", myOrgId)
      .eq("role", "startup"),
  ]);

  const org = orgResult.data as OrgInfo | null;
  if (!org) redirect("/");

  const members: MemberRow[] = membersResult.data ?? [];
  const memberIds = members.map((m) => m.id);

  // 트랜잭션: org_id 기준 + startup_id 기준 두 번 쿼리 후 병합 (dedupe)
  const txSelect =
    "id, tx_type, amount, startup_id, enabler_id, booking_id, description, balance_after, created_at";

  const [orgTxsResult, startupTxsResult, profilesResult] = await Promise.all([
    db
      .from("credit_transactions")
      .select(txSelect)
      .eq("org_id", myOrgId)
      .order("created_at", { ascending: false })
      .limit(200),
    memberIds.length > 0
      ? db
          .from("credit_transactions")
          .select(txSelect)
          .in("startup_id", memberIds)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] }),
    memberIds.length > 0
      ? db
          .from("startup_profiles")
          .select("user_id, company_name, credit_balance")
          .in("user_id", memberIds)
      : Promise.resolve({ data: [] }),
  ]);

  // 병합 + dedupe
  const orgTxs: TxRow[] = orgTxsResult.data ?? [];
  const startupTxs: TxRow[] = startupTxsResult.data ?? [];
  const seenIds = new Set<string>();
  const allTxs: TxRow[] = [];
  for (const tx of [...orgTxs, ...startupTxs]) {
    if (!seenIds.has(tx.id)) {
      seenIds.add(tx.id);
      allTxs.push(tx);
    }
  }
  allTxs.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const profiles: ProfileRow[] = profilesResult.data ?? [];

  return (
    <OrgCreditsClient
      org={org}
      members={members}
      profiles={profiles}
      txs={allTxs}
    />
  );
}
