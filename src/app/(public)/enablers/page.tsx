import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { shouldShowTestData } from "@/lib/test-mode";
import EnablersList, { type EnablerListItem, type EnablerListStats } from "./EnablersList";
import type { EnablerBadge } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enabler 찾기",
  description: "검증된 US Market Enabler 프로필을 둘러보세요. 미국 진출에 필요한 실행 파트너를 매칭합니다.",
  alternates: { canonical: "/enablers" },
  openGraph: {
    title: "Enabler 찾기 — Get It Done at Work",
    description: "검증된 US Market Enabler 프로필 리스트.",
    url: "/enablers",
  },
};

// ─── 원시 행 타입 ─────────────────────────────────────────────────────────────

type RawEnablerRow = {
  user_id: string;
  university: string;
  degree_type: string;
  specialties: string[];
  location: string;
  bio: string;
  credit_rate: number;
  badge_level: string;
  session_count: number;
  rating: number | string;
  users:
    | { full_name: string; avatar_url: string | null; role: string | null; is_test: boolean }
    | { full_name: string; avatar_url: string | null; role: string | null; is_test: boolean }[]
    | null;
};

// ─── 데이터 fetch ─────────────────────────────────────────────────────────────

async function fetchEnabler(): Promise<EnablerListItem[]> {
  const supabase = await createServerSupabaseClient();
  const showTest = await shouldShowTestData();

  let query = supabase
    .from("enabler_profiles")
    .select(`
      user_id,
      university,
      degree_type,
      specialties,
      location,
      bio,
      credit_rate,
      badge_level,
      session_count,
      rating,
      users!inner ( full_name, avatar_url, role, is_test )
    `)
    .eq("status", "approved")
    .eq("users.role", "enabler");

  if (!showTest) {
    query = query.eq("users.is_test", false);
  }

  const { data, error } = await query.order("rating", { ascending: false });

  if (error) {
    console.error("[enablers/page] Supabase fetch error:", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as RawEnablerRow[];

  return rows.map((row) => {
    const usersRaw = Array.isArray(row.users) ? row.users[0] : row.users;
    const fullName: string = usersRaw?.full_name ?? "";
    const avatarUrl: string | null = usersRaw?.avatar_url ?? null;

    const avatarInitial = fullName
      ? fullName
          .split(" ")
          .map((w: string) => w[0] ?? "")
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "";

    return {
      userId: row.user_id,
      fullName,
      avatarUrl,
      avatarInitial,
      university: row.university,
      degreeType: row.degree_type,
      specialties: row.specialties ?? [],
      location: row.location,
      bio: row.bio,
      creditRate: row.credit_rate,
      badgeLevel: row.badge_level as EnablerBadge,
      sessionCount: row.session_count,
      rating: Number(row.rating),
    };
  });
}

// ─── 통계 fetch ───────────────────────────────────────────────────────────────

async function fetchStats(): Promise<EnablerListStats> {
  const supabase = await createServerSupabaseClient();
  const showTest = await shouldShowTestData();

  let enablerQuery = supabase
    .from("enabler_profiles")
    .select("rating, users!inner ( is_test, role )", { count: "exact", head: false })
    .eq("status", "approved")
    .eq("users.role", "enabler");
  if (!showTest) enablerQuery = enablerQuery.eq("users.is_test", false);

  const { data: enablerRows, count: enablerCount } = await enablerQuery;

  const ratings = (enablerRows ?? [])
    .map((r) => Number((r as { rating: number | string }).rating))
    .filter((n) => Number.isFinite(n) && n > 0);
  const avgRating = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;

  const { count: completedSessions } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  return {
    enablerCount: enablerCount ?? 0,
    completedSessions: completedSessions ?? 0,
    avgRating,
  };
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default async function EnablersPage() {
  const [enablers, stats, t] = await Promise.all([
    fetchEnabler(),
    fetchStats(),
    getTranslations("EnablersPage"),
  ]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)" }}>
      <main>
        {/* ── Hero 섹션 ──────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-8 px-5 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 40% at 50% 0%, oklch(0.91 0.2 110 / 0.05) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div
            className="relative"
            style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{
                backgroundColor: "var(--color-accent-dim)",
                color: "var(--color-accent)",
                border: "1px solid oklch(0.91 0.2 110 / 0.2)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-accent)" }} />
              {t("heroLabel")}
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(40px, 5vw, 56px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "var(--color-text)",
                wordBreak: "keep-all",
                marginBottom: "20px",
                width: "100%",
                whiteSpace: "pre-line",
              }}
            >
              {t("heroTitle")}
            </h1>

            <p
              style={{
                color: "var(--color-dim)",
                fontSize: "18px",
                fontWeight: 400,
                lineHeight: 1.7,
                maxWidth: "560px",
                margin: "0 auto 40px auto",
                wordBreak: "keep-all",
                whiteSpace: "pre-line",
              }}
            >
              {t("heroSubtitle")}
            </p>
          </div>
        </section>

        {/* ── 검색 + 필터 + 그리드 (클라이언트) ───────────────────────── */}
        <EnablersList enablers={enablers} stats={stats} />

        {/* ── CTA 배너 ───────────────────────────────────────────────── */}
        <section style={{ padding: "0 20px 80px 20px" }}>
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "56px 32px",
              textAlign: "center",
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 100%, oklch(0.91 0.2 110 / 0.07) 0%, transparent 70%)",
              }}
            />

            <div className="relative w-full">
              <p className="w-full text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-accent)" }}>
                {t("ctaLabel")}
              </p>
              <h2
                style={{
                  width: "100%",
                  fontSize: "clamp(24px, 3vw, 32px)",
                  fontWeight: 700,
                  marginBottom: "16px",
                  letterSpacing: "-0.02em",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-display)",
                  whiteSpace: "pre-line",
                }}
              >
                {t("ctaTitle")}
              </h2>
              <p
                style={{
                  width: "100%",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  marginBottom: "32px",
                  maxWidth: "480px",
                  margin: "0 auto 32px auto",
                  color: "var(--color-dim)",
                  whiteSpace: "pre-line",
                }}
              >
                {t("ctaDesc")}
              </p>
              <Link
                href="/organizations"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "oklch(0.1 0 0)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {t("ctaButton")}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
