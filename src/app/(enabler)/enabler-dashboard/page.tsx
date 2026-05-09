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
  const displayName = (userProfile as { full_name?: string } | null)?.full_name
    ?? user.email?.split("@")[0]
    ?? "Enabler";

  const onboardingItems: { label: string; done: boolean; href: string }[] = [
    { label: "Complete your profile (university, specialties, bio)", done: profileComplete, href: "/enabler-dashboard/profile" },
    { label: "Set your availability", done: availabilitySet, href: "/enabler-dashboard/availability" },
    { label: "Connect payout account", done: payoutConnected, href: "/enabler-dashboard/payouts" },
  ];

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

        {/* 온보딩 진행률 카드 */}
        <div style={{
          backgroundColor: "var(--color-card)",
          border: onboardingDone === onboardingTotal ? "1px solid var(--color-green)" : "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ fontSize: "16px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
              Getting Started
            </h2>
            {onboardingDone === onboardingTotal ? (
              <span style={{
                fontSize: "13px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-green)",
                backgroundColor: "rgba(34,197,94,0.1)",
                border: "1px solid var(--color-green)",
                borderRadius: "20px",
                padding: "3px 12px",
              }}>
                Ready to receive matches
              </span>
            ) : (
              <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--color-accent)", fontWeight: 700 }}>
                {onboardingDone}/{onboardingTotal} done
              </span>
            )}
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
                    Set up →
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* KPI 카드 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}>
          <KpiCard label="Pending requests" value={pendingCount ?? 0} color="var(--color-amber)" />
          <KpiCard label="Upcoming sessions" value={upcomingCount ?? 0} color="var(--color-blue)" />
          <KpiCard label="Completed" value={completedCount ?? 0} suffix="ses." color="var(--color-text)" />
          <KpiCard label="This month" value={monthlyEarnings} suffix="C" color="var(--color-accent)" />
          <KpiCard label="Total earned" value={totalEarnings} suffix="C" color="var(--color-green)" />
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
              No matches yet
            </p>
            <p style={{ fontSize: "15px", color: "var(--color-dim)", lineHeight: 1.6 }}>
              A richer profile gets more visibility. Add your specialties, bio, and availability to attract startups.
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
            New Requests
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
            Upcoming Sessions
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
              Recent Reviews
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

        {/* Quick Menu */}
        <section>
          <h2 style={{
            fontSize: "16px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            marginBottom: "12px",
          }}>
            Quick Menu
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
