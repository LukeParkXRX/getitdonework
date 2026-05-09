import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import DashboardAdminClient, {
  type DashboardKPI,
  type BookingRow,
  type OrgRow,
  type ChartData,
} from "./DashboardAdminClient";

// YYYY-MM-DD 문자열 반환
function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// 지난 N일 날짜 배열 (오늘 포함)
function buildDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    days.push(toDateStr(d));
  }
  return days;
}

function groupByDate<T>(
  days: string[],
  items: T[],
  getDate: (item: T) => string | null
): ChartData {
  const counts: Record<string, number> = {};
  days.forEach((d) => (counts[d] = 0));
  items.forEach((item) => {
    const d = getDate(item);
    if (d && d in counts) counts[d]++;
  });
  return days.map((date) => ({ date, value: counts[date] }));
}

function groupRevenueByDate(
  days: string[],
  items: Array<{ paid_at: string | null; amount_cents: number }>
): ChartData {
  const sums: Record<string, number> = {};
  days.forEach((d) => (sums[d] = 0));
  items.forEach((item) => {
    if (!item.paid_at) return;
    const d = item.paid_at.slice(0, 10);
    if (d in sums) sums[d] += item.amount_cents;
  });
  return days.map((date) => ({ date, value: Math.round(sums[date] / 100) }));
}

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
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
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

  // 30일 차트 데이터 fetch
  const days30 = buildDays(30);
  const [
    { data: newUsers30dRaw },
    { data: sessions30dRaw },
    { data: revenues30dRaw },
  ] = await Promise.all([
    db.from("users").select("created_at").gte("created_at", thirtyDaysAgo),
    db
      .from("bookings")
      .select("created_at")
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo),
    db
      .from("credit_purchases")
      .select("amount_cents, paid_at")
      .eq("status", "paid")
      .gte("paid_at", thirtyDaysAgo),
  ]);

  const newUsersChart: ChartData = groupByDate(
    days30,
    (newUsers30dRaw ?? []) as Array<{ created_at: string }>,
    (u) => u.created_at.slice(0, 10)
  );
  const sessionsChart: ChartData = groupByDate(
    days30,
    (sessions30dRaw ?? []) as Array<{ created_at: string }>,
    (b) => b.created_at.slice(0, 10)
  );
  const revenueChart: ChartData = groupRevenueByDate(
    days30,
    (revenues30dRaw ?? []) as Array<{ paid_at: string | null; amount_cents: number }>
  );

  // 최근 결제 5건
  let recentPayments: Array<{ id: string; amount_cents: number; paid_at: string; status: string }> = [];
  try {
    const { data: paymentsRaw } = await db
      .from("credit_purchases")
      .select("id, amount_cents, paid_at, status")
      .order("paid_at", { ascending: false })
      .limit(5);
    recentPayments = (paymentsRaw ?? []) as typeof recentPayments;
  } catch {
    // 테이블 없으면 빈 배열
  }

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
      newUsersChart={newUsersChart}
      sessionsChart={sessionsChart}
      revenueChart={revenueChart}
      recentPayments={recentPayments}
    />
  );
}
