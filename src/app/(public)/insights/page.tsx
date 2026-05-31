import { getTranslations } from "next-intl/server";
import InsightsListClient from "./InsightsListClient";


// ─── Page (Server Component) ───────────────────────────────────────────────────

export default async function InsightsPage() {
  const t = await getTranslations("Insights");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-black)" }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-0 lg:pt-36 overflow-hidden"
        style={{ backgroundColor: "var(--color-black)" }}
      >
        {/* Background: diagonal accent glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 15% 0%, oklch(0.91 0.2 110 / 0.05) 0%, transparent 65%)",
          }}
        />
        {/* Fine grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.24 0.008 280 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.24 0.008 280 / 0.3) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.3,
          }}
        />

        <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ maxWidth: "700px" }}>
            {/* Label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: "var(--color-accent)",
                  animation: "pulse-dot 2s ease-in-out infinite",
                }}
              />
              <span
                className="text-[11px] font-bold uppercase"
                style={{
                  color: "var(--color-accent)",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.16em",
                }}
              >
                Insights
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(40px, 5vw, 56px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--color-text)",
                wordBreak: "keep-all",
                width: "100%",
              }}
            >
              {t("heroHeadlineLine1")}
              <br />
              <span style={{ color: "var(--color-accent)" }}>{t("heroHeadlineLine2")}</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "17px",
                lineHeight: 1.7,
                color: "var(--color-dim)",
                maxWidth: "500px",
                width: "100%",
                marginTop: "20px",
                wordBreak: "keep-all",
              }}
            >
              {t("heroSubtitleLine1")}
              <br className="hidden sm:block" />
              {t("heroSubtitleLine2")}
            </p>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE: Filter + Cards ───────────────────────────────────── */}
      <InsightsListClient />

      {/* ── ENABLER CTA BANNER ────────────────────────────────────────────── */}
      <section
        className="relative py-20 overflow-hidden"
        style={{
          backgroundColor: "var(--color-dark)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 80% at 90% 50%, oklch(0.91 0.2 110 / 0.05) 0%, transparent 60%)",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >
          <div style={{ maxWidth: "520px", width: "100%" }}>
            <span
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "var(--color-accent)",
                fontFamily: "var(--font-display)",
                marginBottom: "12px",
              }}
            >
              {t("ctaLabel")}
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "28px",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "var(--color-text)",
                wordBreak: "keep-all",
                width: "100%",
              }}
            >
              {t("ctaHeadlineLine1")}
              <br />
              {t("ctaHeadlineLine2")}
            </h2>
            <p
              style={{
                marginTop: "12px",
                fontSize: "16px",
                lineHeight: 1.6,
                color: "var(--color-dim)",
                maxWidth: "400px",
                wordBreak: "keep-all",
                width: "100%",
              }}
            >
              {t("ctaDescription")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <a
              href="/enablers"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
                backgroundColor: "var(--color-accent)",
                color: "oklch(0.1 0 0)",
                fontFamily: "var(--font-display)",
                boxShadow: "var(--shadow-accent)",
                textDecoration: "none",
              }}
            >
              {t("ctaApplyButton")}
            </a>
            <a
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 600,
                border: "1px solid var(--color-border)",
                color: "var(--color-dim)",
                backgroundColor: "transparent",
                textDecoration: "none",
              }}
            >
              {t("ctaContactButton")}
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
