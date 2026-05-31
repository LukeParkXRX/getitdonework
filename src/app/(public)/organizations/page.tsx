import Link from "next/link";
import { getTranslations } from "next-intl/server";


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

const PARTNERS: { label?: string; labelKey?: string }[] = [
  { label: "KOTRA" },
  { labelKey: "partnerKisedKey" },
  { labelKey: "partnerTipsOperator" },
  { labelKey: "partnerBusanCce" },
  { label: "K-Startup" },
];

const FEATURES = [
  { icon: "📊", titleKey: "feature1Title", descKey: "feature1Desc" },
  { icon: "👥", titleKey: "feature2Title", descKey: "feature2Desc" },
  { icon: "📈", titleKey: "feature3Title", descKey: "feature3Desc" },
  { icon: "🔔", titleKey: "feature4Title", descKey: "feature4Desc" },
];

const STEPS = [
  { step: "STEP 01", titleKey: "step1Title", descKey: "step1Desc", last: false },
  { step: "STEP 02", titleKey: "step2Title", descKey: "step2Desc", last: false },
  { step: "STEP 03", titleKey: "step3Title", descKey: "step3Desc", last: false },
  { step: "STEP 04", titleKey: "step4Title", descKey: "step4Desc", last: true },
];

export default async function OrganizationsPage() {
  const t = await getTranslations("Organizations");
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)" }}>

      <main>
        {/* ── HERO ── */}
        <section style={{ position: "relative", overflow: "hidden", padding: "64px 0 48px" }}>
          {/* bg blob */}
          <div
            style={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 500,
              height: 500,
              background: "var(--color-blue)",
              borderRadius: "50%",
              filter: "blur(120px)",
              opacity: 0.12,
              pointerEvents: "none",
            }}
          />

          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>{t("heroEyebrow")}</Eyebrow>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "clamp(36px, 4vw, 56px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "var(--color-text)",
                wordBreak: "keep-all",
                marginBottom: 20,
                maxWidth: 680,
              }}
            >
              {t("heroTitleLine1")}
              <br />
              {t("heroTitleLine2")}{" "}
              <span style={{ color: "var(--color-accent)" }}>{t("heroTitleHighlight")}</span>
            </h1>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.75,
                color: "var(--color-dim)",
                maxWidth: 600,
                marginBottom: 36,
                wordBreak: "keep-all",
              }}
            >
              {t("heroDescription")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href="/contact" className="landing-btn-primary">
                {t("heroCtaPrimary")}
              </Link>
              <Link href="/contact" className="landing-btn-ghost">{t("heroCtaDemo")}</Link>
            </div>
          </div>
        </section>

        {/* ── PARTNER LOGOS ── */}
        <section
          style={{
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
            padding: "32px 0",
          }}
        >
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              {t("partnersLabel")}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 40,
              }}
            >
              {PARTNERS.map((p) => {
                const name = p.labelKey ? t(p.labelKey) : p.label!;
                return (
                  <div
                    key={name}
                    style={{
                      padding: "10px 24px",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--color-dim)",
                    }}
                  >
                    {name}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── ORGADMIN DASHBOARD FEATURES ── */}
        <section style={{ padding: "80px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>{t("featuresEyebrow")}</Eyebrow>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(24px, 3vw, 36px)",
                color: "var(--color-text)",
                marginBottom: 32,
                wordBreak: "keep-all",
              }}
            >
              {t("featuresHeading")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.titleKey}
                  style={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: 28,
                    display: "flex",
                    gap: 20,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: "var(--color-accent-dim)",
                      fontSize: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 17,
                        color: "var(--color-text)",
                        marginBottom: 8,
                      }}
                    >
                      {t(f.titleKey)}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "var(--color-dim)",
                        wordBreak: "keep-all",
                      }}
                    >
                      {t(f.descKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section
          style={{
            backgroundColor: "var(--color-dark)",
            borderTop: "1px solid var(--color-border)",
            padding: "64px 0",
          }}
        >
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>{t("timelineEyebrow")}</Eyebrow>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(24px, 3vw, 36px)",
                color: "var(--color-text)",
                wordBreak: "keep-all",
              }}
            >
              {t("timelineHeading")}
            </h2>

            <div style={{ maxWidth: 700, marginTop: 32 }}>
              {STEPS.map((s) => (
                <div
                  key={s.step}
                  style={{
                    display: "flex",
                    gap: 24,
                    borderBottom: s.last ? "none" : "1px solid var(--color-border)",
                  }}
                >
                  {/* Left: dot + line */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "var(--color-accent)",
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    {!s.last && (
                      <div
                        style={{
                          width: 1,
                          flex: 1,
                          minHeight: 40,
                          backgroundColor: "var(--color-border)",
                        }}
                      />
                    )}
                  </div>

                  {/* Right: content */}
                  <div style={{ paddingBottom: 24 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--color-accent)",
                        marginBottom: 6,
                        letterSpacing: "0.08em",
                      }}
                    >
                      {s.step}
                    </p>
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: "var(--color-text)",
                        marginBottom: 6,
                        wordBreak: "keep-all",
                      }}
                    >
                      {t(s.titleKey)}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--color-dim)",
                        lineHeight: 1.7,
                        wordBreak: "keep-all",
                      }}
                    >
                      {t(s.descKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
