export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  // super_admin 인증
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authAny = authClient as any;
  const { data: profile } = await authAny
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // service role로 뷰 조회 (RLS 우회)
  const db = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  const [totalsResult, dailyResult] = await Promise.all([
    dbAny.from("v_funnel_totals").select("*").single(),
    dbAny.from("v_daily_funnel").select("*").order("day", { ascending: true }),
  ]);

  if (totalsResult.error) {
    return NextResponse.json({ error: totalsResult.error.message }, { status: 500 });
  }

  const t = totalsResult.data;

  return NextResponse.json({
    totals: {
      signups:       Number(t.total_signups       ?? 0),
      paid_users:    Number(t.total_paid_users     ?? 0),
      booking_users: Number(t.total_booking_users  ?? 0),
      bookings:      Number(t.total_bookings       ?? 0),
      completed:     Number(t.total_completed      ?? 0),
      reviews:       Number(t.total_reviews        ?? 0),
    },
    daily: (dailyResult.data ?? []).map((row: Record<string, unknown>) => ({
      day:       row.day,
      signups:   Number(row.signups   ?? 0),
      purchases: Number(row.purchases ?? 0),
      bookings:  Number(row.bookings  ?? 0),
      completed: Number(row.completed ?? 0),
      reviews:   Number(row.reviews   ?? 0),
    })),
  });
}
