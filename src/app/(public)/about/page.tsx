import { getTranslations } from "next-intl/server";
import Link from "next/link";
import React from "react";

export const revalidate = 3600;

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
              아무도 예상 못 한{" "}
              <span style={{ color: "var(--color-accent)" }}>그 한 수.</span>
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
                미국 시장은 정보가 아니라{" "}
                <span style={{ color: "var(--color-accent)" }}>실행</span>
                이 막는다
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
                  검증된 인재
                </div>
                <p style={{ fontSize: 15, color: "var(--color-dim)", lineHeight: 1.7 }}>
                  심사 통과 + 지속적인 리뷰 시스템으로 품질을 보장합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ marginBottom: 48 }}>
              <Eyebrow>핵심 가치</Eyebrow>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)", marginBottom: 16 }}>
                우리가 믿는 4가지
              </h2>
              <p style={{ fontSize: 16, color: "var(--color-dim)", lineHeight: 1.7, maxWidth: 560 }}>
                Get It Done at Work의 모든 결정은 이 네 가지 원칙에서 출발합니다.
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
                  title: "실행 우선",
                  desc: "완벽한 계획보다 빠른 첫 발. 미국 시장은 분석이 아니라 실행이 답을 알려줍니다. 우리는 고객이 최단 시간 안에 첫 번째 실제 결과를 만들도록 돕습니다.",
                  color: "var(--color-accent)",
                },
                {
                  number: "02",
                  title: "현장 밀착",
                  desc: "모든 Enabler는 미국 현장에 있습니다. 이론이 아닌 오늘의 시장 실황을 전합니다. 현장 감각 없는 조언은 우리 플랫폼에 없습니다.",
                  color: "var(--color-blue)",
                },
                {
                  number: "03",
                  title: "권리 안전",
                  desc: "한국 스타트업의 기밀과 IP는 철저히 보호됩니다. 세션 계약서·NDA·플랫폼 정책으로 3중 보호. 정보 유출 걱정 없이 가장 예민한 전략을 공유할 수 있습니다.",
                  color: "var(--color-green)",
                },
                {
                  number: "04",
                  title: "측정 가능",
                  desc: "모든 세션은 구체적인 결과물로 끝납니다. 미팅 수, 응답률, 계약 금액, 투자 유치액. 우리는 막연한 조언 대신 측정 가능한 성과를 약속합니다.",
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
                  <div style={{ fontSize: 12, color: "var(--color-dim)", marginTop: 6, lineHeight: 1.5, maxWidth: 200 }}>
                    한국 스타트업 창업·운영 경험 + 미국 시장 진출 프로젝트 다수.
                    한국과 미국 사이의 실행 격차를 없애는 데 집중합니다.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                <div style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.6 }}>
                  함께 판을 바꿀 팀원을 찾고 있습니다.
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
                  채용 공고 보기 →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
