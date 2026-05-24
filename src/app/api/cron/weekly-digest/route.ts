import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email";
import { weeklyDigestStartupEmail, weeklyDigestEnablerEmail } from "@/lib/emails/templates";
import { generateUnsubscribeToken } from "@/lib/unsubscribe-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getWeekRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 1); // 어제 (일요일)
  const start = new Date(end);
  start.setDate(start.getDate() - 6); // 7일 전 (월요일)

  const fmt = (d: Date) =>
    `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;

  return { start, end, label: `${fmt(start)} ~ ${fmt(end)}` };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface EligibleUser {
  id: string;
  email: string;
  full_name: string | null;
  role: "startup" | "enabler";
}

function groupBy<T, K extends string>(
  rows: T[],
  keyFn: (row: T) => K | undefined | null
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = keyFn(row);
    if (!k) continue;
    const arr = map.get(k);
    if (arr) arr.push(row);
    else map.set(k, [row]);
  }
  return map;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let db: ReturnType<typeof createServiceClient>;
  try {
    db = createServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 503 }
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  const { start, end, label } = getWeekRange();
  const weekStart = start.toISOString();
  const weekEnd = end.toISOString();

  let sentStartup = 0;
  let sentEnabler = 0;
  let errors = 0;

  try {
    // 1) marketing 동의 사용자 fetch
    const { data: users, error: usersError } = await dbAny
      .from("users")
      .select("id, email, full_name, role, notification_prefs")
      .in("role", ["startup", "enabler"])
      .not("email", "is", null);

    if (usersError) throw usersError;

    const allEligible = (users as Array<EligibleUser & {
      notification_prefs: Record<string, boolean> | null;
    }>).filter((u) => u.notification_prefs?.marketing === true);

    if (allEligible.length === 0) {
      return NextResponse.json({ ok: true, sent_startup: 0, sent_enabler: 0, errors: 0, week: label });
    }

    // 2) unsubscribed 제외
    const { data: unsubRows } = await dbAny
      .from("email_unsubscribes")
      .select("user_id")
      .in("user_id", allEligible.map((u) => u.id));

    const unsubSet = new Set(((unsubRows ?? []) as { user_id: string }[]).map((r) => r.user_id));
    const eligible = allEligible.filter((u) => !unsubSet.has(u.id));

    const startupIds = eligible.filter((u) => u.role === "startup").map((u) => u.id);
    const enablerIds = eligible.filter((u) => u.role === "enabler").map((u) => u.id);

    // 3) 모든 데이터를 batch로 fetch (병렬). 사용자별 직렬 N+1 제거.
    const [
      txAll,
      balanceAll,
      bookingsStartupAll,
      bookingsEnablerAll,
      earningsAll,
      reviewsAll,
      newEnablersRaw,
    ] = await Promise.all([
      startupIds.length > 0
        ? dbAny
            .from("credit_transactions")
            .select("user_id, amount")
            .eq("type", "debit")
            .in("user_id", startupIds)
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd)
        : Promise.resolve({ data: [] }),
      startupIds.length > 0
        ? dbAny
            .from("credit_balances")
            .select("user_id, balance")
            .in("user_id", startupIds)
        : Promise.resolve({ data: [] }),
      startupIds.length > 0
        ? dbAny
            .from("bookings")
            .select("startup_user_id, status")
            .in("startup_user_id", startupIds)
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd)
        : Promise.resolve({ data: [] }),
      enablerIds.length > 0
        ? dbAny
            .from("bookings")
            .select("enabler_user_id, status")
            .in("enabler_user_id", enablerIds)
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd)
        : Promise.resolve({ data: [] }),
      enablerIds.length > 0
        ? dbAny
            .from("enabler_earnings")
            .select("enabler_user_id, amount_usd")
            .in("enabler_user_id", enablerIds)
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd)
        : Promise.resolve({ data: [] }),
      enablerIds.length > 0
        ? dbAny
            .from("reviews")
            .select("enabler_user_id")
            .in("enabler_user_id", enablerIds)
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd)
        : Promise.resolve({ data: [] }),
      dbAny
        .from("enabler_profiles")
        .select("full_name, expertise")
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd)
        .limit(3),
    ]);

    // 4) 사용자별 group 인덱스
    const txByUser = groupBy(
      (txAll.data ?? []) as Array<{ user_id: string; amount: number }>,
      (r) => r.user_id
    );
    const balanceByUser = new Map<string, number>(
      ((balanceAll.data ?? []) as Array<{ user_id: string; balance: number }>).map(
        (r) => [r.user_id, r.balance ?? 0]
      )
    );
    const bookingsStartupByUser = groupBy(
      (bookingsStartupAll.data ?? []) as Array<{ startup_user_id: string; status: string }>,
      (r) => r.startup_user_id
    );
    const bookingsEnablerByUser = groupBy(
      (bookingsEnablerAll.data ?? []) as Array<{ enabler_user_id: string; status: string }>,
      (r) => r.enabler_user_id
    );
    const earningsByUser = groupBy(
      (earningsAll.data ?? []) as Array<{ enabler_user_id: string; amount_usd: number }>,
      (r) => r.enabler_user_id
    );
    const reviewsByUser = groupBy(
      (reviewsAll.data ?? []) as Array<{ enabler_user_id: string }>,
      (r) => r.enabler_user_id
    );

    const newEnablers = ((newEnablersRaw.data ?? []) as Array<{
      full_name: string | null;
      expertise: string | null;
    }>).map((e) => ({
      name: e.full_name ?? "Enabler",
      expertise: e.expertise ?? "",
    }));

    // 5) 사용자별 이메일 발송 (Resend rate limit 유지 — 10/sec)
    for (let i = 0; i < eligible.length; i++) {
      const user = eligible[i];
      if (i > 0 && i % 10 === 0) await delay(1000);

      try {
        if (user.role === "startup") {
          const tokenUsed = (txByUser.get(user.id) ?? []).reduce(
            (sum, r) => sum + Math.abs(r.amount),
            0
          );
          const tokenBalance = balanceByUser.get(user.id) ?? 0;
          const bookings = bookingsStartupByUser.get(user.id) ?? [];
          const payload = weeklyDigestStartupEmail({
            fullName: user.full_name ?? "회원",
            weekLabel: label,
            tokenUsed,
            tokenBalance,
            bookingsPending: bookings.filter((b) => b.status === "pending").length,
            bookingsConfirmed: bookings.filter((b) => b.status === "confirmed").length,
            bookingsCompleted: bookings.filter((b) => b.status === "completed").length,
            newEnablers,
            unsubscribeToken: generateUnsubscribeToken(user.id),
          });
          const result = await sendEmail(user.email, payload);
          if (result.ok) sentStartup++;
          else errors++;
        } else {
          const bookings = bookingsEnablerByUser.get(user.id) ?? [];
          const earningsUsd = (earningsByUser.get(user.id) ?? []).reduce(
            (sum, r) => sum + (r.amount_usd ?? 0),
            0
          );
          const reviewsReceived = (reviewsByUser.get(user.id) ?? []).length;
          const payload = weeklyDigestEnablerEmail({
            fullName: user.full_name ?? "Enabler",
            weekLabel: label,
            matchRequests: bookings.length,
            sessionsCompleted: bookings.filter((b) => b.status === "completed").length,
            earningsUsd,
            reviewsReceived,
            unsubscribeToken: generateUnsubscribeToken(user.id),
          });
          const result = await sendEmail(user.email, payload);
          if (result.ok) sentEnabler++;
          else errors++;
        }
      } catch {
        errors++;
      }
    }

    return NextResponse.json({
      ok: true,
      sent_startup: sentStartup,
      sent_enabler: sentEnabler,
      errors,
      week: label,
      // 운영 가시성: 쿼리 횟수 (사용자 수 무관 — 9회 고정)
      db_queries: 2 + 7,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
