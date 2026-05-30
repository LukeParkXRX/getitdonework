import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-static";

export default async function ProgramPage() {
  const t = await getTranslations("Program");

  const EXPERTISE_TAGS = [
    "B2B SaaS",
    "Fintech",
    "E-commerce",
    "Healthcare",
    "AI / DeepTech",
    t("expertiseMore"),
  ];

  const SESSION_TYPES = [
    { name: "Chemistry", color: "var(--color-accent)", sub: t("sessionChemistrySub") },
    { name: "Standard", color: "var(--color-blue)", sub: t("sessionStandardSub") },
    { name: "Project", color: "var(--color-amber)", sub: t("sessionProjectSub") },
  ];

  const ENABLER_QUALITIES = [
    {
      icon: "🎓",
      title: t("qualityMbaTitle"),
      desc: t("qualityMbaDesc"),
    },
    {
      icon: "💼",
      title: t("qualityExperienceTitle"),
      desc: t("qualityExperienceDesc"),
    },
    {
      icon: "🇺🇸",
      title: t("qualityNetworkTitle"),
      desc: t("qualityNetworkDesc"),
    },
  ];

  const STATS = [
    { num: "87+", label: t("statSessions") },
    { num: "4.9", label: t("statRating") },
    { num: "78%", label: t("statRepeat") },
    { num: "12+", label: t("statFields") },
  ];

  return (
    <>
      <main className="min-h-screen">
        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden"
          style={{ padding: "80px 0 64px" }}
        >
          {/* bg blob */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: 480 }}>
            <div
              className="absolute rounded-full"
              style={{
                width: 600,
                height: 600,
                background: "var(--color-accent)",
                top: -200,
                left: -100,
                filter: "blur(120px)",
                opacity: 0.12,
              }}
            />
          </div>

          <div className="relative max-w-[1160px] mx-auto px-10">
            <Eyebrow>{t("heroEyebrow")}</Eyebrow>
            <h1
              className="font-extrabold tracking-tighter leading-[1.1] mb-5"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 5vw, 56px)",
              }}
            >
              {t("heroTitleLine1")}
              <br />
              <span style={{ color: "var(--color-accent)" }}>{t("heroTitleHighlight")}</span>{" "}
              {t("heroTitleLine2")}
            </h1>
            <p
              className="max-w-[560px]"
              style={{ fontSize: 18, color: "var(--color-dim)", lineHeight: 1.7 }}
            >
              {t("heroSubtitle")}
            </p>
            <div className="flex gap-3 mt-9 flex-wrap">
              <Link
                href="/enablers"
                className="landing-btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] font-bold"
                style={{
                  background: "var(--color-accent)",
                  color: "#000",
                  fontSize: 15,
                }}
              >
                {t("ctaStartMatching")}
              </Link>
              <Link
                href="/enablers"
                className="landing-btn-ghost inline-flex items-center gap-2 px-7 py-3 rounded-[10px] font-semibold"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: 15,
                }}
              >
                {t("ctaFindEnabler")}
              </Link>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="max-w-[1160px] mx-auto px-10" style={{ padding: "80px 0" }}>
          <div className="mb-12">
            <Eyebrow>{t("howEyebrow")}</Eyebrow>
            <h2
              className="font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontSize: 36 }}
            >
              {t("howTitle")}
            </h2>
          </div>

          {/* Step 1 */}
          <div
            className="flex gap-8 items-start"
            style={{ padding: "36px 0", borderBottom: "1px solid var(--color-border)" }}
          >
            <StepNum>1</StepNum>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold mb-2">{t("step1Title")}</h3>
              <p
                className="max-w-[600px]"
                style={{ color: "var(--color-dim)", fontSize: 15 }}
              >
                {t("step1Desc")}
              </p>
              <div className="flex gap-2 mt-3.5 flex-wrap">
                {EXPERTISE_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--color-dim)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {/* Mini card - AI 추천 */}
            <div
              className="hidden lg:block flex-shrink-0"
              style={{
                width: 220,
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div className="text-[11px] mb-2.5" style={{ color: "var(--color-dim)" }}>
                {t("aiRecommended")}
              </div>
              <div className="flex flex-col gap-2">
                <EnablerPreview initials="SC" name="Sarah Chen" school="Stanford GSB · GTM" match={98} color="var(--color-blue)" />
                <EnablerPreview initials="DK" name="David Kim" school="MIT Sloan · AI" match={95} color="var(--color-accent)" />
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className="flex gap-8 items-start"
            style={{ padding: "36px 0", borderBottom: "1px solid var(--color-border)" }}
          >
            <StepNum>2</StepNum>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold mb-2">{t("step2Title")}</h3>
              <p
                className="max-w-[600px]"
                style={{ color: "var(--color-dim)", fontSize: 15 }}
              >
                {t("step2Desc")}
              </p>
              <div
                className="grid grid-cols-3 gap-3 mt-4 max-w-[500px]"
              >
                {SESSION_TYPES.map((s) => (
                  <div
                    key={s.name}
                    className="text-center"
                    style={{
                      padding: 14,
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: s.color }}>
                      {s.name}
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: "var(--color-dim)" }}>
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-8 items-start" style={{ padding: "36px 0" }}>
            <StepNum>3</StepNum>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold mb-2">{t("step3Title")}</h3>
              <p
                className="max-w-[600px]"
                style={{ color: "var(--color-dim)", fontSize: 15 }}
              >
                {t("step3Desc")}
              </p>
            </div>
          </div>
        </section>

        {/* ── Who is Enabler ── */}
        <section
          style={{
            background: "var(--color-dark)",
            padding: "64px 0",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="max-w-[1160px] mx-auto px-10">
            <Eyebrow>{t("enablerEyebrow")}</Eyebrow>
            <h2
              className="font-extrabold tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: 36 }}
            >
              {t("enablerTitlePrefix")}{" "}
              <span style={{ color: "var(--color-accent)" }}>{t("enablerTitleHighlight")}</span>
            </h2>
            <p
              className="max-w-[680px] mb-10"
              style={{ fontSize: 16, color: "var(--color-dim)" }}
            >
              {t("enablerDesc")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
              {ENABLER_QUALITIES.map((q) => (
                <div
                  key={q.title}
                  className="transition-colors"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: 28,
                  }}
                >
                  <div
                    className="flex items-center justify-center mb-4"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "var(--color-accent-dim)",
                      fontSize: 20,
                    }}
                  >
                    {q.icon}
                  </div>
                  <h4 className="font-bold mb-2" style={{ fontSize: 16 }}>
                    {q.title}
                  </h4>
                  <p style={{ fontSize: 14, color: "var(--color-dim)" }}>
                    {q.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="max-w-[1160px] mx-auto px-10" style={{ padding: "64px 0" }}>
          <div
            className="grid grid-cols-2 md:grid-cols-4 overflow-hidden"
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: 20,
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="text-center"
                style={{
                  padding: "32px 24px",
                  borderRight:
                    i < STATS.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                }}
              >
                <div
                  className="font-extrabold leading-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 48,
                    color: "var(--color-accent)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {s.num}
                </div>
                <div className="mt-2" style={{ fontSize: 14, color: "var(--color-dim)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

/* ── Sub Components ── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 mb-4 uppercase tracking-widest font-bold"
      style={{ fontSize: 11, color: "var(--color-accent)" }}
    >
      <span
        style={{
          width: 24,
          height: 2,
          background: "var(--color-accent)",
          display: "inline-block",
        }}
      />
      {children}
    </div>
  );
}

function StepNum({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-extrabold flex-shrink-0"
      style={{
        width: 36,
        height: 36,
        background: "var(--color-accent)",
        color: "#000",
        fontSize: 15,
      }}
    >
      {children}
    </div>
  );
}

function EnablerPreview({
  initials,
  name,
  school,
  match,
  color,
}: {
  initials: string;
  name: string;
  school: string;
  match: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-lg"
      style={{ padding: 8, background: "oklch(0.18 0.006 280 / 0.6)" }}
    >
      <div
        className="flex items-center justify-center rounded-full text-[11px] font-bold text-white flex-shrink-0"
        style={{ width: 32, height: 32, background: color }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold truncate">{name}</div>
        <div className="text-[11px] truncate" style={{ color: "var(--color-dim)" }}>
          {school}
        </div>
      </div>
      <div
        className="ml-auto text-[11px] font-bold flex-shrink-0"
        style={{ color: "var(--color-accent)" }}
      >
        {match}%
      </div>
    </div>
  );
}
