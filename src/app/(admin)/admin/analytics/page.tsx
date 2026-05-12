import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import AnalyticsClient from "./AnalyticsClient";

export const metadata = { title: "KPI 퍼널 | Admin" };

export default async function AnalyticsPage() {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authAny = authClient as any;
  const { data: profile } = await authAny
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") redirect("/");

  const db = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  const [totalsRes, dailyRes] = await Promise.all([
    dbAny.from("v_funnel_totals").select("*").single(),
    dbAny.from("v_daily_funnel").select("*").order("day", { ascending: true }),
  ]);

  const t = totalsRes.data ?? {};
  const totals = {
    signups:       Number(t.total_signups      ?? 0),
    paid_users:    Number(t.total_paid_users    ?? 0),
    booking_users: Number(t.total_booking_users ?? 0),
    bookings:      Number(t.total_bookings      ?? 0),
    completed:     Number(t.total_completed     ?? 0),
    reviews:       Number(t.total_reviews       ?? 0),
  };

  const daily = (dailyRes.data ?? []).map((row: Record<string, unknown>) => ({
    day:       String(row.day ?? ""),
    signups:   Number(row.signups   ?? 0),
    purchases: Number(row.purchases ?? 0),
    bookings:  Number(row.bookings  ?? 0),
    completed: Number(row.completed ?? 0),
    reviews:   Number(row.reviews   ?? 0),
  }));

  return <AnalyticsClient totals={totals} daily={daily} />;
}
