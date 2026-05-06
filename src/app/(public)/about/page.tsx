"use client";

import { useTranslations } from "next-intl";

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

export default function AboutPage() {
  const t = useTranslations("AboutPage");

  return (
    <>
      <main style={{ paddingTop: 56 }}>
        {/* Hero */}
        <section className="pt-14 pb-12 px-6 md:pt-24 md:pb-20" style={{ position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: "var(--color-accent)",
              filter: "blur(120px)",
              opacity: 0.12,
              pointerEvents: "none",
            }}
          />
          <div style={{ maxWidth: 780, margin: "0 auto", position: "relative" }}>
            <Eyebrow>{t("heroEyebrow")}</Eyebrow>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 700,
                lineHeight: 1.15,
                color: "var(--color-text)",
                marginBottom: 28,
              }}
            >
              {t("heroTitle").replace(t("heroTitleAccent"), "")}{" "}
              <span style={{ color: "var(--color-accent)" }}>{t("heroTitleAccent")}</span>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: "var(--color-dim)",
                lineHeight: 1.8,
                whiteSpace: "pre-line",
              }}
            >
              {t("heroDesc")}
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section
          style={{
            background: "var(--color-dark)",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
            padding: "64px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 48,
              alignItems: "center",
            }}
          >
            {/* Left */}
            <div>
              <Eyebrow>{t("missionEyebrow")}</Eyebrow>
              <h2
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: "var(--color-text)",
                  marginBottom: 20,
                }}
              >
                {t("missionTitle").replace(t("missionTitleAccent"), "")}{" "}
                <span style={{ color: "var(--color-accent)" }}>{t("missionTitleAccent")}</span>
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: "var(--color-dim)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                }}
              >
                {t("missionDesc")}
              </p>
            </div>

            {/* Right: stacked cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 20,
                  padding: 28,
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-accent)", marginBottom: 8 }}>
                  {t("card1Title")}
                </div>
                <p style={{ fontSize: 15, color: "var(--color-dim)", lineHeight: 1.7 }}>
                  {t("card1Desc")}
                </p>
              </div>

              <div
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 20,
                  padding: 28,
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-blue)", marginBottom: 8 }}>
                  {t("card2Title")}
                </div>
                <p style={{ fontSize: 15, color: "var(--color-dim)", lineHeight: 1.7 }}>
                  {t("card2Desc")}
                </p>
              </div>

              <div
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 20,
                  padding: 28,
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-green)", marginBottom: 8 }}>
                  검증된 인재
                </div>
                <p style={{ fontSize: 15, color: "var(--color-dim)", lineHeight: 1.7 }}>
                  심사 통과 + 지속적인 리뷰 시스템으로 품질을 보장합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ marginBottom: 48 }}>
              <Eyebrow>팀</Eyebrow>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)" }}>
                Get It Done at Work 팀
              </h2>
            </div>

            <div
              style={{
                maxWidth: 800,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 32,
              }}
            >
              {/* Luke Park */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "var(--color-accent-dim)",
                    border: "2px solid var(--color-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                  }}
                >
                  L
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>Luke Park</div>
                  <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 4 }}>CEO · (주)엑스알엑스</div>
                </div>
              </div>

              {[1, 2].map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: 0.4 }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      border: "2px dashed var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      color: "var(--color-dim)",
                    }}
                  >
                    +
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, color: "var(--color-dim)" }}>채용 중</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
