import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email";
import { weeklyDigestStartupEmail, weeklyDigestEnablerEmail } from "@/lib/emails/templates";

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

  const { start, end, label } = getWeekRange();
  const weekStart = start.toISOString();
  const weekEnd = end.toISOString();

  let sentStartup = 0;
  let sentEnabler = 0;
  let errors = 0;

  try {
    // marketing 동의 사용자만 fetch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: users, error: usersError } = await (db as any)
      .from("users")
      .select("id, email, full_name, role, notification_prefs")
      .in("role", ["startup", "enabler"])
      .not("email", "is", null);

    if (usersError) throw usersError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eligible = (users as any[]).filter((u) => {
      const prefs = u.notification_prefs as Record<string, boolean> | null;
      return prefs?.marketing === true;
    });

    // 새 Enabler 목록 (공통으로 한 번만 조회)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newEnablersRaw } = await (db as any)
      .from("enabler_profiles")
      .select("full_name, expertise")
      .gte("created_at", weekStart)
      .lte("created_at", weekEnd)
      .limit(3);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newEnablers = ((newEnablersRaw as any[]) ?? []).map((e) => ({
      name: e.full_name ?? "Enabler",
      expertise: e.expertise ?? "",
    }));

    for (let i = 0; i < eligible.length; i++) {
      const user = eligible[i];

      // Rate limit: 10건/초 유지 (100ms 간격)
      if (i > 0 && i % 10 === 0) await delay(1000);

      try {
        if (user.role === "startup") {
          // 지난주 토큰 사용량
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: txRows } = await (db as any)
            .from("credit_transactions")
            .select("amount")
            .eq("user_id", user.id)
            .eq("type", "debit")
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tokenUsed = ((txRows as any[]) ?? []).reduce(
            (sum: number, r: { amount: number }) => sum + Math.abs(r.amount),
            0
          );

          // 잔여 토큰
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: balanceRow } = await (db as any)
            .from("credit_balances")
            .select("balance")
            .eq("user_id", user.id)
            .maybeSingle();

          const tokenBalance = (balanceRow as { balance?: number } | null)?.balance ?? 0;

          // 세션 현황
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: bookingRows } = await (db as any)
            .from("bookings")
            .select("status")
            .eq("startup_user_id", user.id)
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bookings = (bookingRows as any[]) ?? [];
          const bookingsPending = bookings.filter((b) => b.status === "pending").length;
          const bookingsConfirmed = bookings.filter((b) => b.status === "confirmed").length;
          const bookingsCompleted = bookings.filter((b) => b.status === "completed").length;

          const payload = weeklyDigestStartupEmail({
            fullName: user.full_name ?? "회원",
            weekLabel: label,
            tokenUsed,
            tokenBalance,
            bookingsPending,
            bookingsConfirmed,
            bookingsCompleted,
            newEnablers,
          });

          const result = await sendEmail(user.email, payload);
          if (result.ok) sentStartup++;
          else errors++;
        } else if (user.role === "enabler") {
          // 지난주 매칭 요청 수
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: matchRows } = await (db as any)
            .from("bookings")
            .select("status")
            .eq("enabler_user_id", user.id)
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allBookings = (matchRows as any[]) ?? [];
          const matchRequests = allBookings.length;
          const sessionsCompleted = allBookings.filter((b) => b.status === "completed").length;

          // 적립 USD
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: earningRows } = await (db as any)
            .from("enabler_earnings")
            .select("amount_usd")
            .eq("enabler_user_id", user.id)
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd);

          const earningsUsd = ((earningRows as { amount_usd: number }[]) ?? []).reduce(
            (sum, r) => sum + (r.amount_usd ?? 0),
            0
          );

          // 받은 리뷰 수
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: reviewRows } = await (db as any)
            .from("reviews")
            .select("id")
            .eq("enabler_user_id", user.id)
            .gte("created_at", weekStart)
            .lte("created_at", weekEnd);

          const reviewsReceived = ((reviewRows as unknown[]) ?? []).length;

          const payload = weeklyDigestEnablerEmail({
            fullName: user.full_name ?? "Enabler",
            weekLabel: label,
            matchRequests,
            sessionsCompleted,
            earningsUsd,
            reviewsReceived,
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
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
