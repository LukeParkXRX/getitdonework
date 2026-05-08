import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import OrgDashboardClient, {
  type OrgInfo,
  type MemberRow,
  type ProfileRow,
  type BookingRow,
  type OrgTxRow,
  type DashboardKPI,
} from "./OrgDashboardClient";

export default async function OrgDashboardPage() {
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

  // 병렬 fetch
  const [orgResult, membersResult] = await Promise.all([
    db
      .from("organizations")
      .select("id, name, program_name, total_credits, invite_code, created_at")
      .eq("id", myOrgId)
      .maybeSingle(),
    db
      .from("users")
      .select("id, full_name, email, created_at")
      .eq("org_id", myOrgId)
      .eq("role", "startup"),
  ]);

  const org = orgResult.data as OrgInfo | null;
  if (!org) redirect("/");

  const members: MemberRow[] = membersResult.data ?? [];
  const memberIds = members.map((m) => m.id);

  // 멤버 있을 때만 추가 쿼리
  const [profilesResult, bookingsResult, orgTxsResult] = await Promise.all([
    memberIds.length > 0
      ? db
          .from("startup_profiles")
          .select("user_id, company_name, credit_balance")
          .in("user_id", memberIds)
      : Promise.resolve({ data: [] }),
    memberIds.length > 0
      ? db
          .from("bookings")
          .select("id, status, scheduled_at, credits_amount, startup_id, enabler_id")
          .in("startup_id", memberIds)
          .order("scheduled_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    db
      .from("credit_transactions")
      .select("id, tx_type, amount, description, created_at")
      .eq("org_id", myOrgId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const profiles: ProfileRow[] = profilesResult.data ?? [];
  const bookings: BookingRow[] = bookingsResult.data ?? [];
  const orgTxs: OrgTxRow[] = orgTxsResult.data ?? [];

  // KPI 계산
  const totalCreditsAllocated = orgTxs
    .filter((t) => t.tx_type === "allocate")
    .reduce((sum, t) => sum + t.amount, 0);

  const kpi: DashboardKPI = {
    totalMembers: members.length,
    totalCreditsGranted: org.total_credits,
    totalCreditsAllocated,
    totalSessions: bookings.length,
    completedSessions: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <OrgDashboardClient
      org={org}
      members={members}
      profiles={profiles}
      bookings={bookings}
      orgTxs={orgTxs}
      kpi={kpi}
    />
  );
}
