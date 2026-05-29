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
      padding: "18px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      minWidth: 0,
    }}>
      <span style={{
        fontSize: "11px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--color-dim)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>{label}</span>
      <span style={{
        fontSize: "28px",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        color,
        lineHeight: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
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

export default async function EnablerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const showWelcome = welcome === "true";

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 기본 프로필 (users 테이블)
  const { data: userProfile } = await db
    .from("users")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  // Enabler 프로필
  const { data: enablerProfile } = await db
    .from("enabler_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single() as { data: DbEnablerProfile | null };

  const nowIso = new Date().toISOString();
  // 시작 시각이 지났지만 90분 이내인 세션도 목록에 표시 (진행 중 세션 포함)
  const ninetyMinAgoIso = new Date(Date.now() - 90 * 60 * 1000).toISOString();

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
    .gte("scheduled_at", ninetyMinAgoIso)
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
    .gte("scheduled_at", ninetyMinAgoIso);

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

  // 이번 달 수익
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: monthlyEarningsData } = await db
    .from("credit_transactions")
    .select("amount")
    .eq("enabler_id", user.id)
    .in("tx_type", ["confirm", "use"])
    .gte("created_at", monthStart.toISOString());

  const monthlyEarnings = ((monthlyEarningsData ?? []) as { amount: number }[]).reduce(
    (sum, t) => sum + (t.amount ?? 0),
    0,
  );

  // 정산 계정 상태
  const { data: payoutAccount } = await db
    .from("enabler_payout_accounts")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  const payoutStatus = (payoutAccount as { status: string } | null)?.status ?? null;

  // 온보딩 진행률 계산
  const profileComplete = !!(
    enablerProfile?.university &&
    enablerProfile?.degree_type &&
    enablerProfile?.specialties?.length > 0 &&
    enablerProfile?.bio
  );
  const availabilitySet = !!(
    enablerProfile?.availability &&
    Object.keys(enablerProfile.availability).length > 0
  );
  const payoutConnected = payoutStatus === "active";
  const onboardingTotal = 3;
  const onboardingDone = [profileComplete, availabilitySet, payoutConnected].filter(Boolean).length;

  // 최근 리뷰 (받은 것)
  const { data: recentReviewsRaw } = await db
    .from("reviews")
    .select("id, rating, comment, created_at, author_id")
    .eq("target_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);

  type ReviewRow = { id: string; rating: number; comment: string | null; created_at: string; author_id: string };
  const recentReviews: ReviewRow[] = (recentReviewsRaw ?? []) as ReviewRow[];

  // 리뷰 작성자 이름 조회
  const reviewAuthorIds = Array.from(new Set(recentReviews.map((r) => r.author_id)));
  let reviewAuthorMap = new Map<string, string>();
  if (reviewAuthorIds.length > 0) {
    const { data: reviewAuthors } = await db
      .from("users")
      .select("id, full_name")
      .in("id", reviewAuthorIds);
    reviewAuthorMap = new Map(
      ((reviewAuthors ?? []) as { id: string; full_name: string | null }[]).map((u) => [u.id, u.full_name ?? "스타트업"])
    );
  }

  const status = enablerProfile?.status ?? "pending";
  const statusCfg = STATUS_LABEL[status] ?? STATUS_LABEL.pending;
  const up = userProfile as { full_name?: string | null; avatar_url?: string | null } | null;
  const displayName = up?.full_name
    ?? user.email?.split("@")[0]
    ?? "Enabler";
  const avatarUrl = up?.avatar_url ?? null;
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "E";
  const specialtiesText = enablerProfile?.specialties?.join(" · ") || null;

  const onboardingItems: { label: string; done: boolean; href: string }[] = [
    { label: "프로필 완성하기 (학교, 전문 분야, 자기소개)", done: profileComplete, href: "/enabler-dashboard/profile" },
    { label: "가용 시간 설정하기", done: availabilitySet, href: "/enabler-dashboard/availability" },
    { label: "정산 계정 연결하기", done: payoutConnected, href: "/enabler-dashboard/payouts" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--color-black)",
      color: "var(--color-text)",
      fontFamily: "var(--font-body)",
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px" }}>
        {/* 신규 가입 환영 배너 */}
        {showWelcome && (
          <div style={{
            background: "linear-gradient(135deg, oklch(0.91 0.2 110 / 0.12) 0%, oklch(0.65 0.15 250 / 0.08) 100%)",
            border: "1px solid oklch(0.91 0.2 110 / 0.4)",
            borderRadius: "16px",
            padding: "24px 28px",
            marginBottom: "24px",
          }}>
            <p style={{
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              marginBottom: "6px",
            }}>
              Enabler 가입 완료
            </p>
            <h2 style={{
              fontSize: "20px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "8px",
              letterSpacing: "-0.02em",
            }}>
              환영합니다! 매칭 활성화를 위해 아래 3가지를 완료해 주세요.
            </h2>
            <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
              프로필, 가용 시간, 정산 계좌를 설정하면 스타트업 매칭 요청을 받을 수 있습니다.
            </p>
          </div>
        )}

        {/* 프로필 헤더 카드 — 인사말 + 아바타 + 상태 + 대학·전문분야 통합 */}
        <div style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}>
          {/* 아바타 */}
          <div style={{ flexShrink: 0 }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                width={72}
                height={72}
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--color-border)",
                  display: "block",
                }}
              />
            ) : (
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "var(--color-accent-dim)",
                border: "2px solid var(--color-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "30px",
                color: "var(--color-accent)",
              }}>
                {avatarInitial}
              </div>
            )}
          </div>

          {/* 인사말 + 이름 + 메타 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              marginBottom: "4px",
            }}>
              Enabler
            </p>
            <h1 style={{
              fontSize: "24px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--color-text)",
              margin: 0,
              marginBottom: "8px",
              letterSpacing: "-0.01em",
            }}>
              안녕하세요, {displayName}님
            </h1>
            {/* 대학 · 전문분야 */}
            {(enablerProfile?.university || specialtiesText) && (
              <p style={{
                color: "var(--color-dim)",
                fontSize: "14px",
                lineHeight: 1.5,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {[enablerProfile?.university, specialtiesText].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* 상태 뱃지 */}
          <div style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: statusCfg.bg,
            border: `1px solid ${statusCfg.color}`,
            borderRadius: "9999px",
            padding: "6px 14px",
          }}>
            <span style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: statusCfg.color,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: statusCfg.color,
              whiteSpace: "nowrap",
            }}>
              {statusCfg.label}
            </span>
          </div>

          {/* 상태별 안내 문구 (pending / suspended 시 전체 폭) */}
          {(status === "pending" || status === "suspended") && (
            <p style={{
              flexBasis: "100%",
              margin: 0,
              color: "var(--color-dim)",
              fontSize: "13px",
              lineHeight: 1.5,
            }}>
              {status === "pending" && "운영팀에서 검토 중입니다. 승인 완료 시 알림을 드립니다."}
              {status === "suspended" && "현재 활동이 일시 중단된 상태입니다. 운영팀에 문의해주세요."}
            </p>
          )}
        </div>

        {/* 빠른 메뉴 (상단 — 자주 쓰는 진입점) */}
        <section style={{ marginBottom: "24px" }}>
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

        {/* 온보딩 진행률 카드 — 완료(3/3) 시 숨김 */}
        {onboardingDone < onboardingTotal && (
        <div style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ fontSize: "16px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
              시작하기
            </h2>
            <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--color-accent)", fontWeight: 700 }}>
              {onboardingDone}/{onboardingTotal} 완료
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {onboardingItems.map((item) => (
              <a
                key={item.label}
                href={item.done ? undefined : item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  backgroundColor: item.done ? "rgba(255,255,255,0.02)" : "rgba(188,255,0,0.04)",
                  border: item.done ? "1px solid var(--color-border)" : "1px solid rgba(188,255,0,0.2)",
                  textDecoration: "none",
                  cursor: item.done ? "default" : "pointer",
                  opacity: item.done ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1, color: item.done ? "var(--color-green)" : "var(--color-accent)", flexShrink: 0 }}>
                  {item.done ? "✓" : "○"}
                </span>
                <span style={{ fontSize: "15px", fontFamily: "var(--font-body)", fontWeight: item.done ? 400 : 600, color: item.done ? "var(--color-dim)" : "var(--color-text)" }}>
                  {item.label}
                </span>
                {!item.done && (
                  <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--color-accent)", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                    설정하기 →
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
        )}

        {/* KPI 카드 — 데스크탑 5 / 태블릿 3 / 모바일 2 */}
        <div className="edash-kpi-grid" style={{ marginBottom: "32px" }}>
          <KpiCard label="대기 중인 요청" value={pendingCount ?? 0} color="var(--color-amber)" />
          <KpiCard label="예정된 세션" value={upcomingCount ?? 0} color="var(--color-blue)" />
          <KpiCard label="완료된 세션" value={completedCount ?? 0} suffix="건" color="var(--color-text)" />
          <KpiCard label="이번 달 수익" value={monthlyEarnings} suffix="C" color="var(--color-accent)" />
          <KpiCard label="총 수익" value={totalEarnings} suffix="C" color="var(--color-green)" />
        </div>

        {/* 빈 상태 — 매칭 없음 */}
        {(pendingCount ?? 0) === 0 && (upcomingCount ?? 0) === 0 && (
          <div style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "14px",
            padding: "32px 28px",
            marginBottom: "24px",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "18px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", marginBottom: "8px" }}>
              아직 매칭이 없습니다
            </p>
            <p style={{ fontSize: "15px", color: "var(--color-dim)", lineHeight: 1.6 }}>
              프로필을 풍성하게 작성하면 더 많은 노출을 받을 수 있습니다. 전문 분야, 자기소개, 가용 시간을 추가해 보세요.
            </p>
          </div>
        )}

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

        {/* 최근 받은 리뷰 */}
        {recentReviews.length > 0 && (
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontSize: "16px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              marginBottom: "12px",
            }}>
              최근 받은 리뷰
            </h2>
            <div style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              overflow: "hidden",
            }}>
              {recentReviews.map((review, idx) => (
                <div key={review.id} style={{
                  padding: "16px 20px",
                  borderBottom: idx < recentReviews.length - 1 ? "1px solid var(--color-border)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", color: "var(--color-text)" }}>
                      {reviewAuthorMap.get(review.author_id) ?? "Startup"}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-dim)", flexShrink: 0 }}>
                      {review.created_at.slice(5, 10)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ fontSize: "14px", color: i < review.rating ? "var(--color-accent)" : "var(--color-border)" }}>
                        {i < review.rating ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                  {review.comment && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-dim)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
