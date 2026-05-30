import { getTranslations } from "next-intl/server";
import Link from "next/link";
import React from "react";

export const revalidate = 86400;

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

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");

  return (
    <>
      <main>
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
              {t("heroTitlePrefix")}{" "}
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
                {t("missionTitlePrefix")}{" "}
                <span style={{ color: "var(--color-accent)" }}>{t("missionTitleAccent")}</span>
                {t("missionTitleSuffix")}
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
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
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
                  {t("card3Title")}
                </div>
                <p style={{ fontSize: 15, color: "var(--color-dim)", lineHeight: 1.7 }}>
                  {t("card3Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ marginBottom: 48 }}>
              <Eyebrow>{t("valuesEyebrow")}</Eyebrow>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)", marginBottom: 16 }}>
                {t("valuesTitle")}
              </h2>
              <p style={{ fontSize: 16, color: "var(--color-dim)", lineHeight: 1.7, maxWidth: 560 }}>
                {t("valuesDesc")}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 20,
              }}
            >
              {[
                {
                  number: "01",
                  title: t("value1Title"),
                  desc: t("value1Desc"),
                  color: "var(--color-accent)",
                },
                {
                  number: "02",
                  title: t("value2Title"),
                  desc: t("value2Desc"),
                  color: "var(--color-blue)",
                },
                {
                  number: "03",
                  title: t("value3Title"),
                  desc: t("value3Desc"),
                  color: "var(--color-green)",
                },
                {
                  number: "04",
                  title: t("value4Title"),
                  desc: t("value4Desc"),
                  color: "var(--color-amber)",
                },
              ].map((v) => (
                <div
                  key={v.number}
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: 28,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: v.color,
                      fontFamily: "var(--font-display)",
                      letterSpacing: "0.1em",
                      marginBottom: 12,
                    }}
                  >
                    {v.number}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 10 }}>
                    {v.title}
                  </div>
                  <p style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.7 }}>
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section
          style={{
            background: "var(--color-dark)",
            borderTop: "1px solid var(--color-border)",
            padding: "80px 24px",
          }}
        >
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ marginBottom: 48 }}>
              <Eyebrow>{t("teamEyebrow")}</Eyebrow>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)" }}>
                {t("teamTitle")}
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
                  <div style={{ fontSize: 12, color: "var(--color-dim)", marginTop: 6, lineHeight: 1.5, maxWidth: 200 }}>
                    {t("lukeBio")}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                <div style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.6 }}>
                  {t("hiringNote")}
                </div>
                <Link
                  href="/careers"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    textDecoration: "none",
                  }}
                >
                  {t("viewCareers")} →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
