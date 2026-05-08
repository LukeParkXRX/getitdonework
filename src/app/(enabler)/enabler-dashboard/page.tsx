import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbEnablerProfile } from "@/lib/db/types";
import { RequestsList, UpcomingSessionsList } from "./RequestsList";
import type { RequestBooking, UpcomingBooking } from "./RequestsList";

// ─── JOIN 쿼리 결과 raw 타입 ──────────────────────────────────────────────────

interface RawStartupProfile {
  company_name: string | null;
  industry: string[] | null;
  stage: string | null;
}

interface RawStartupUser {
  full_name: string | null;
  avatar_url: string | null;
  startup_profile: RawStartupProfile | RawStartupProfile[] | null;
}

interface RawBookingRow {
  id: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  credits_amount: number;
  brief: string | null;
  meeting_url: string | null;
  startup_user: RawStartupUser | RawStartupUser[] | null;
}

function pickStartup(raw: RawStartupUser | RawStartupUser[] | null): RawStartupUser | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function pickProfile(raw: RawStartupProfile | RawStartupProfile[] | null | undefined): RawStartupProfile | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "승인 대기 중", color: "var(--color-amber)", bg: "oklch(0.78 0.15 75 / 0.1)" },
  approved: { label: "활동 중", color: "var(--color-accent)", bg: "var(--color-accent-dim)" },
  suspended: { label: "활동 정지", color: "var(--color-red)", bg: "rgba(239,68,68,0.1)" },
};

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function KpiCard({ label, value, suffix, color }: {
  label: string;
  value: number | string;
  suffix?: string;
  color: string;
}) {
  return (
    <div style={{
      backgroundColor: "var(--color-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "12px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}>
      <span style={{
        fontSize: "13px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-dim)",
      }}>{label}</span>
      <span style={{
        fontSize: "32px",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        color,
        lineHeight: 1,
      }}>
        {value}
        {suffix && (
          <span style={{ fontSize: "16px", fontFamily: "var(--font-display)", fontWeight: 600, marginLeft: "4px", opacity: 0.7 }}>
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}

// ─── 페이지 (서버 컴포넌트) ───────────────────────────────────────────────────

export default async function EnablerDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 기본 프로필 (users 테이블)
  const { data: userProfile } = await db
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // Enabler 프로필
  const { data: enablerProfile } = await db
    .from("enabler_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single() as { data: DbEnablerProfile | null };

  const nowIso = new Date().toISOString();

  // 새 매칭 요청 (pending) — users 안에 startup_profile nested
  const { data: pendingRaw } = await db
    .from("bookings")
    .select(`
      id, type, status, scheduled_at, credits_amount, brief,
      startup_user:users!bookings_startup_id_fkey(
        full_name,
        avatar_url,
        startup_profile:startup_profiles(company_name, industry, stage)
      )
    `)
    .eq("enabler_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const pendingRows = (pendingRaw ?? []) as RawBookingRow[];
  const pendingBookings: RequestBooking[] = pendingRows.map((r) => {
    const su = pickStartup(r.startup_user);
    const sp = pickProfile(su?.startup_profile);
    return {
      id: r.id,
      type: r.type as RequestBooking["type"],
      status: r.status,
      scheduled_at: r.scheduled_at,
      credits_amount: r.credits_amount,
      brief: r.brief,
      startup_user_name: su?.full_name ?? null,
      startup_user_avatar: su?.avatar_url ?? null,
      startup_company_name: sp?.company_name ?? null,
      startup_industry: sp?.industry ?? null,
      startup_stage: sp?.stage ?? null,
    };
  });

  // 다가오는 세션 (confirmed + scheduled_at > now)
  const { data: upcomingRaw } = await db
    .from("bookings")
    .select(`
      id, type, status, scheduled_at, credits_amount, meeting_url,
      startup_user:users!bookings_startup_id_fkey(
        full_name,
        avatar_url,
        startup_profile:startup_profiles(company_name, industry, stage)
      )
    `)
    .eq("enabler_id", user.id)
    .eq("status", "confirmed")
    .gte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(5);

  const upcomingRows = (upcomingRaw ?? []) as RawBookingRow[];
  const upcomingBookings: UpcomingBooking[] = upcomingRows.map((r) => {
    const su = pickStartup(r.startup_user);
    const sp = pickProfile(su?.startup_profile);
    return {
      id: r.id,
      type: r.type as UpcomingBooking["type"],
      scheduled_at: r.scheduled_at,
      credits_amount: r.credits_amount,
      meeting_url: r.meeting_url ?? null,
      startup_user_name: su?.full_name ?? null,
      startup_user_avatar: su?.avatar_url ?? null,
      startup_company_name: sp?.company_name ?? null,
    };
  });

  // KPI 카운트
  const { count: pendingCount } = await db
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("enabler_id", user.id)
    .eq("status", "pending");

  const { count: upcomingCount } = await db
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("enabler_id", user.id)
    .eq("status", "confirmed")
    .gte("scheduled_at", nowIso);

  const { count: completedCount } = await db
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("enabler_id", user.id)
    .eq("status", "completed");

  const { data: earningsData } = await db
    .from("credit_transactions")
    .select("amount")
    .eq("enabler_id", user.id)
    .in("tx_type", ["confirm", "use"]);

  const totalEarnings = ((earningsData ?? []) as { amount: number }[]).reduce(
    (sum, t) => sum + (t.amount ?? 0),
    0,
  );

  const status = enablerProfile?.status ?? "pending";
  const statusCfg = STATUS_LABEL[status] ?? STATUS_LABEL.pending;
  const displayName = (userProfile as { full_name?: string } | null)?.full_name
    ?? user.email?.split("@")[0]
    ?? "Enabler";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--color-black)",
      color: "var(--color-text)",
      fontFamily: "var(--font-body)",
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{
            fontSize: "13px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: "8px",
          }}>
            Enabler
          </p>
          <h1 style={{
            fontSize: "28px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "var(--color-text)",
            margin: 0,
            marginBottom: "12px",
          }}>
            안녕하세요, {displayName}님
          </h1>
          <p style={{ color: "var(--color-dim)", fontSize: "15px", lineHeight: 1.6 }}>
            오늘도 한국 스타트업의 미국 진출을 함께 만들어가요.
          </p>
        </div>

        {/* 상태 배너 */}
        <div style={{
          backgroundColor: statusCfg.bg,
          border: `1px solid ${statusCfg.color}`,
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <span style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: statusCfg.color,
          }} />
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: "13px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: statusCfg.color,
              marginBottom: "2px",
            }}>
              프로필 {statusCfg.label}
            </p>
            <p style={{ color: "var(--color-dim)", fontSize: "13px" }}>
              {status === "pending" && "운영팀에서 검토 중입니다. 승인 완료 시 알림을 드립니다."}
              {status === "approved" && `${enablerProfile?.university || "—"} · ${enablerProfile?.specialties?.join(" · ") || ""}`}
              {status === "suspended" && "현재 활동이 일시 중단된 상태입니다. 운영팀에 문의해주세요."}
            </p>
          </div>
        </div>

        {/* KPI 카드 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}>
          <KpiCard label="대기 중인 요청" value={pendingCount ?? 0} color="var(--color-amber)" />
          <KpiCard label="예정된 세션" value={upcomingCount ?? 0} color="var(--color-blue)" />
          <KpiCard label="완료한 세션" value={completedCount ?? 0} suffix="회" color="var(--color-text)" />
          <KpiCard label="누적 수익" value={totalEarnings} suffix="C" color="var(--color-accent)" />
        </div>

        {/* 새 매칭 요청 */}
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{
            fontSize: "16px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            marginBottom: "12px",
          }}>
            새 매칭 요청
          </h2>
          <RequestsList bookings={pendingBookings} />
        </section>

        {/* 다가오는 세션 */}
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{
            fontSize: "16px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            marginBottom: "12px",
          }}>
            다가오는 세션
          </h2>
          <UpcomingSessionsList bookings={upcomingBookings} displayName={displayName} />
        </section>

        {/* 빠른 메뉴 */}
        <section>
          <h2 style={{
            fontSize: "16px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            marginBottom: "12px",
          }}>
            빠른 메뉴
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}>
            <Link href="/enabler-dashboard/profile" style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "16px",
              textDecoration: "none",
              color: "var(--color-text)",
            }}>
              <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>프로필 편집</p>
              <p style={{ fontSize: "12px", color: "var(--color-dim)" }}>전공·전문 분야·요율 업데이트</p>
            </Link>
            <Link href="/enabler-dashboard/availability" style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "16px",
              textDecoration: "none",
              color: "var(--color-text)",
            }}>
              <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>가용 시간 설정</p>
              <p style={{ fontSize: "12px", color: "var(--color-dim)" }}>요일·시간대 슬롯과 메모 관리</p>
            </Link>
            <Link href="/session" style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "16px",
              textDecoration: "none",
              color: "var(--color-text)",
            }}>
              <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>세션 관리</p>
              <p style={{ fontSize: "12px", color: "var(--color-dim)" }}>전체 세션 이력·정산 확인</p>
            </Link>
            <Link href="/enabler-dashboard/payouts" style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "16px",
              textDecoration: "none",
              color: "var(--color-text)",
            }}>
              <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>정산 계정</p>
              <p style={{ fontSize: "12px", color: "var(--color-dim)" }}>Stripe Connect 은행 연결 및 정산 현황</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
