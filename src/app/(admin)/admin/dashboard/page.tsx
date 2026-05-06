import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import DashboardAdminClient, {
  type DashboardKPI,
  type BookingRow,
  type OrgRow,
} from "./DashboardAdminClient";

export default async function AdminDashboardPage() {
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

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // KPI 병렬 fetch
  const [
    { count: userCount },
    { count: enablerCount },
    { count: pendingEnablerCount },
    { count: bookingCount },
    { count: completedBookingCount },
    { count: orgCount },
    { count: newUsers7d },
    { count: newBookings7d },
  ] = await Promise.all([
    db.from("users").select("*", { count: "exact", head: true }),
    db
      .from("enabler_profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    db
      .from("enabler_profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    db.from("bookings").select("*", { count: "exact", head: true }),
    db
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
    db.from("organizations").select("*", { count: "exact", head: true }),
    db
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    db
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
  ]);

  // enabler_applications, contact_inquiries는 없을 수도 있으므로 개별 try
  let pendingApplications = 0;
  let newInquiries = 0;
  try {
    const { count } = await db
      .from("enabler_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    pendingApplications = count ?? 0;
  } catch {
    // 테이블 없으면 0
  }
  try {
    const { count } = await db
      .from("contact_inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "new");
    newInquiries = count ?? 0;
  } catch {
    // 테이블 없으면 0
  }

  // 최근 예약 20건
  const { data: rawBookings } = await db
    .from("bookings")
    .select("id, status, type, scheduled_at, credits_amount")
    .order("scheduled_at", { ascending: false })
    .limit(20);

  const recentBookings: BookingRow[] = (
    (rawBookings ?? []) as Array<{
      id: string;
      status: string;
      type: string;
      scheduled_at: string;
      credits_amount: number;
    }>
  ).map((b) => ({
    id: b.id,
    status: b.status,
    type: b.type,
    scheduledAt: b.scheduled_at,
    creditsAmount: b.credits_amount ?? 0,
  }));

  // 기관 목록 (total_credits 기준 내림차순)
  const { data: rawOrgs } = await db
    .from("organizations")
    .select("id, name, total_credits, program_name")
    .order("total_credits", { ascending: false })
    .limit(20);

  const orgs: OrgRow[] = (
    (rawOrgs ?? []) as Array<{
      id: string;
      name: string;
      total_credits: number;
      program_name: string;
    }>
  ).map((o) => ({
    id: o.id,
    name: o.name,
    totalCredits: o.total_credits ?? 0,
    programName: o.program_name ?? "",
  }));

  const totalOrgCredits = orgs.reduce((s, o) => s + o.totalCredits, 0);

  const kpi: DashboardKPI = {
    totalUsers: userCount ?? 0,
    totalEnablers: enablerCount ?? 0,
    pendingEnablers: pendingEnablerCount ?? 0,
    totalBookings: bookingCount ?? 0,
    completedBookings: completedBookingCount ?? 0,
    totalOrgs: orgCount ?? 0,
    pendingApplications,
    newInquiries,
    newUsers7d: newUsers7d ?? 0,
    newBookings7d: newBookings7d ?? 0,
    totalOrgCredits,
  };

  return (
    <DashboardAdminClient
      kpi={kpi}
      recentBookings={recentBookings}
      orgs={orgs}
    />
  );
}
