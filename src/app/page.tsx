import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroEnablerStack from "@/components/landing/HeroEnablerStack";
import EnablerCard from "@/components/enabler/EnablerCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { shouldShowTestData } from "@/lib/test-mode";
import type { EnablerBadge } from "@/types";

// ─── 원시 행 타입 ──────────────────────────────────────────────────────────────
type RawEnablerRow = {
  user_id: string;
  university: string;
  degree_type: string;
  specialties: string[];
  location: string;
  badge_level: string;
  session_count: number;
  rating: number | string;
  users:
    | { full_name: string; avatar_url: string | null; is_test: boolean }
    | { full_name: string; avatar_url: string | null; is_test: boolean }[]
    | null;
};

// ─── 데이터 fetch ──────────────────────────────────────────────────────────────
async function fetchFeaturedEnablers() {
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
      badge_level,
      session_count,
      rating,
      users!inner ( full_name, avatar_url, is_test )
    `)
    .eq("status", "approved")
    .order("rating", { ascending: false })
    .order("session_count", { ascending: false })
    .limit(6);

  if (!showTest) {
    query = query.eq("users.is_test", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[home] Featured enablers fetch error:", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as RawEnablerRow[];

  return rows.map((row) => {
    const usersRaw = Array.isArray(row.users) ? row.users[0] : row.users;
    const fullName: string = usersRaw?.full_name ?? "";
    const avatarUrl: string = usersRaw?.avatar_url ?? "";
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
      badgeLevel: row.badge_level as EnablerBadge,
      sessionCount: row.session_count,
      rating: Number(row.rating),
      // EnablerProfile 필수 필드 기본값
      bio: "",
      creditRate: 0,
      enablerScore: 0,
      status: "approved" as const,
      reRequestRate: 0,
      availability: {},
    };
  });
}

// ─── 페이지 ────────────────────────────────────────────────────────────────────
export default async function LandingPage() {
  const [tHero, tTrust, tHow, tFeatured, tCTA, featuredEnablers] = await Promise.all([
    getTranslations("Hero"),
    getTranslations("TrustBanner"),
    getTranslations("HowItWorks"),
    getTranslations("FeaturedEnablers"),
    getTranslations("FinalCTA"),
    fetchFeaturedEnablers(),
  ]);


  const howItWorksSteps = [
    { num: "01", titleKey: "step1Title", descKey: "step1Desc" },
    { num: "02", titleKey: "step2Title", descKey: "step2Desc" },
    { num: "03", titleKey: "step3Title", descKey: "step3Desc" },
    { num: "04", titleKey: "step4Title", descKey: "step4Desc" },
  ] as const;

  const trustStats = [
    { value: "24+", labelKey: "orgPartners" },
    { value: "50+", labelKey: "enablers" },
    { value: "312", labelKey: "sessionsCompleted" },
    { value: "4.7", labelKey: "avgSatisfaction" },
  ] as const;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-black)" }}>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden"
        style={{ backgroundColor: "var(--color-black)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 60% 0%, oklch(0.91 0.2 110 / 0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.24 0.008 280 / 0.25) 1px, transparent 1px), linear-gradient(90deg, oklch(0.24 0.008 280 / 0.25) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.35,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
              gap: "64px",
              alignItems: "center",
            }}
          >
            {/* LEFT: Copy */}
            <div className="flex flex-col gap-8">
              {/* Animated badge */}
              <div className="flex items-center gap-2 w-fit">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                <span
                  className="text-xs font-bold uppercase"
                  style={{
                    color: "var(--color-accent)",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.12em",
                  }}
                >
                  {tHero("badge")}
                </span>
              </div>

              {/* Eyebrow lead-in */}
              <p
                className="leading-relaxed whitespace-pre-line"
                style={{ fontSize: "17px", color: "var(--color-dim)", maxWidth: "520px" }}
              >
                {tHero("eyebrow")}
              </p>

              {/* Headline */}
              <div>
                <h1
                  className="leading-[1.0] tracking-tight"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: "clamp(56px, 8vw, 96px)",
                    color: "var(--color-accent)",
                  }}
                >
                  {tHero("headline")}
                </h1>
              </div>

              {/* Subheading */}
              <p
                className="leading-relaxed"
                style={{ fontSize: "18px", color: "var(--color-text)", maxWidth: "520px" }}
              >
                {tHero("subheading")}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/enablers"
                  className="landing-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "oklch(0.1 0 0)",
                    fontFamily: "var(--font-display)",
                    boxShadow: "var(--shadow-accent)",
                  }}
                >
                  {tHero("ctaFind")}
                  <span style={{ fontSize: "16px" }}>→</span>
                </Link>
                <Link
                  href="/program"
                  className="landing-btn-ghost inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    backgroundColor: "transparent",
                  }}
                >
                  {tHero("ctaProgram")}
                </Link>
              </div>

              {/* Stats row */}
              <div
                className="flex items-center gap-8 pt-4"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                {[
                  { value: "87+", labelKey: "statSessions" },
                  { value: "4.8", labelKey: "statRating" },
                  { value: "78%", labelKey: "statReRequest" },
                ].map((stat) => (
                  <div key={stat.labelKey} className="flex flex-col gap-0.5">
                    <span
                      className="text-4xl font-black leading-none"
                      style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
                    >
                      {stat.value}
                    </span>
                    <span className="text-[15px]" style={{ color: "var(--color-dim)" }}>
                      {tHero(stat.labelKey as "statSessions" | "statRating" | "statReRequest")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Floating card stack */}
            <div>
              <HeroEnablerStack />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BANNER ──────────────────────────────────────────────────── */}
      <section
        className="py-5"
        style={{
          backgroundColor: "oklch(0.91 0.2 110 / 0.05)",
          borderTop: "1px solid oklch(0.91 0.2 110 / 0.15)",
          borderBottom: "1px solid oklch(0.91 0.2 110 / 0.15)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              columnGap: "40px",
              rowGap: "16px",
            }}
          >
            {trustStats.map((stat, i) => (
              <div key={stat.labelKey} className="flex items-center gap-3">
                <span
                  className="text-4xl font-black"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-accent)" }}
                >
                  {stat.value}
                </span>
                <span className="text-[17px]" style={{ color: "var(--color-dim)" }}>
                  {tTrust(stat.labelKey)}
                </span>
                {i < 3 && (
                  <span
                    className="hidden sm:block w-px h-4 ml-1"
                    style={{ backgroundColor: "oklch(0.91 0.2 110 / 0.2)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 20% 80%, oklch(0.65 0.15 250 / 0.06) 0%, transparent 60%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span
              className="text-xs font-bold uppercase"
              style={{ color: "var(--color-accent)", letterSpacing: "0.12em" }}
            >
              {tHow("sectionLabel")}
            </span>
            <h2
              className="mt-3 text-4xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
            >
              {tHow("sectionTitle")}
            </h2>
          </div>

          <div
            className="relative"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            <div
              className="absolute top-9 left-[13%] right-[13%] hidden lg:block"
              style={{
                height: "1px",
                backgroundImage:
                  "repeating-linear-gradient(90deg, var(--color-border) 0, var(--color-border) 5px, transparent 5px, transparent 13px)",
              }}
            />

            {howItWorksSteps.map((step) => (
              <div
                key={step.num}
                className="relative flex flex-col gap-5 p-6 rounded-2xl"
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  className="text-5xl font-black leading-none select-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "oklch(0.91 0.2 110 / 0.16)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {step.num}
                </div>
                <div
                  className="w-2 h-2 rounded-full -mt-2"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
                <div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
                  >
                    {tHow(step.titleKey)}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-dim)" }}>
                    {tHow(step.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ENABLERS ─────────────────────────────────────────────── */}
      <section
        className="py-28"
        style={{
          backgroundColor: "var(--color-dark)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "48px",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                className="text-xs font-bold uppercase"
                style={{ color: "var(--color-accent)", letterSpacing: "0.12em" }}
              >
                {tFeatured("sectionLabel")}
              </span>
              <h2
                className="mt-3 text-4xl font-black tracking-tight whitespace-pre-line"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
              >
                {tFeatured("sectionTitle")}
              </h2>
            </div>
            <Link
              href="/enablers"
              className="landing-link-underline flex items-center gap-1.5 text-sm font-semibold pb-1"
              style={{ color: "var(--color-dim)", borderBottom: "1px solid var(--color-border)" }}
            >
              {tFeatured("viewAll")}
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {featuredEnablers.map((enabler, i) => (
              <EnablerCard key={enabler.userId} enabler={enabler} delay={0.08 + i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="relative py-36 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 50%, oklch(0.91 0.2 110 / 0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.24 0.008 280 / 0.4) 1px, transparent 1px), linear-gradient(90deg, oklch(0.24 0.008 280 / 0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.2,
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: "768px",
            margin: "0 auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--color-accent)",
              letterSpacing: "0.12em",
              marginBottom: "16px",
            }}
          >
            {tCTA("label")}
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "clamp(36px, 4.5vw, 52px)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "var(--color-text)",
              wordBreak: "keep-all",
            }}
          >
            {tCTA("titleMain")}
            <br />
            <span style={{ color: "var(--color-accent)" }}>{tCTA("titleAccent")}</span>
          </h2>
          <p
            style={{
              marginTop: "20px",
              fontSize: "16px",
              lineHeight: 1.6,
              color: "var(--color-dim)",
              maxWidth: "400px",
              marginLeft: "auto",
              marginRight: "auto",
              wordBreak: "keep-all",
            }}
          >
            {tCTA("desc")}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginTop: "40px",
            }}
          >
            <Link
              href="/enablers"
              className="landing-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "14px",
                backgroundColor: "var(--color-accent)",
                color: "oklch(0.1 0 0)",
                fontFamily: "var(--font-display)",
                boxShadow: "var(--shadow-accent)",
                textDecoration: "none",
              }}
            >
              {tCTA("ctaFind")}
              <span style={{ fontSize: "16px" }}>→</span>
            </Link>
            <Link
              href="/program"
              className="landing-btn-ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "14px",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                backgroundColor: "transparent",
                textDecoration: "none",
              }}
            >
              {tCTA("ctaProgram")}
            </Link>
          </div>

          <p style={{ marginTop: "40px", fontSize: "12px", color: "var(--color-dim)" }}>
            {tCTA("footnote")}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
