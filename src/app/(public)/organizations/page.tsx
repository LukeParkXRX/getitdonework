import Link from "next/link";

export const dynamic = "force-static";

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

const PARTNERS = ["KOTRA", "창업진흥원", "TIPS 운영사", "부산창조경제", "K-Startup"];

const FEATURES = [
  {
    icon: "📊",
    title: "통합 크레딧 관리",
    desc: "구매한 크레딧을 소속 스타트업에 자유롭게 배분. 잔액 현황과 소진 속도를 실시간 모니터링합니다.",
  },
  {
    icon: "👥",
    title: "스타트업 초대 관리",
    desc: "고유 초대 코드로 소속 스타트업을 플랫폼에 초대. 가입 현황과 활동 상태를 한눈에 파악합니다.",
  },
  {
    icon: "📈",
    title: "성과 리포트",
    desc: "세션 수, 만족도, Enabler별 평점, 주요 논의 주제를 자동 집계한 프로그램 성과 리포트를 제공합니다.",
  },
  {
    icon: "🔔",
    title: "알림 & 모니터링",
    desc: "크레딧 소진 임박, 미활용 스타트업, 만족도 이슈를 자동 감지해 담당자에게 알립니다.",
  },
];

const STEPS = [
  {
    step: "STEP 01",
    title: "도입 문의 & 미팅",
    desc: "프로그램 규모, 참여 스타트업 수, 기간 등을 논의합니다.",
    last: false,
  },
  {
    step: "STEP 02",
    title: "기관 계정 & 크레딧 구매",
    desc: "OrgAdmin 계정을 개설하고 필요 크레딧을 구매합니다.",
    last: false,
  },
  {
    step: "STEP 03",
    title: "스타트업 초대 & 배분",
    desc: "초대 코드를 소속 스타트업에 발송하고 크레딧을 배분합니다.",
    last: false,
  },
  {
    step: "STEP 04",
    title: "프로그램 운영 & 성과 관리",
    desc: "스타트업이 자율적으로 Enabler를 선택해 세션을 진행. 기관 담당자는 대시보드에서 전체 현황을 모니터링합니다.",
    last: true,
  },
];

export default function OrganizationsPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)" }}>

      <main style={{ paddingTop: 56 }}>
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
              background: "#5b8def",
              borderRadius: "50%",
              filter: "blur(120px)",
              opacity: 0.12,
              pointerEvents: "none",
            }}
          />

          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>기업 / 기관 서비스</Eyebrow>
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
              한국 스타트업의
              <br />
              미국 진출을{" "}
              <span style={{ color: "var(--color-accent)" }}>프로그램으로</span>
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
              KOTRA, 창업진흥원, 민간 액셀러레이터 등 기관이 운영하는 미국 진출 지원
              프로그램을 Get It Done at Work로 관리하세요. 크레딧 배분부터 세션 관리, 성과 리포트까지
              한 곳에서.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href="/contact" className="landing-btn-primary">
                기관 도입 문의 →
              </Link>
              <button className="landing-btn-ghost">데모 보기</button>
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
              도입 기관
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
              {PARTNERS.map((name) => (
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
              ))}
            </div>
          </div>
        </section>

        {/* ── ORGADMIN DASHBOARD FEATURES ── */}
        <section style={{ padding: "80px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>기관용 기능</Eyebrow>
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
              OrgAdmin 대시보드
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
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
                      {f.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "var(--color-dim)",
                        wordBreak: "keep-all",
                      }}
                    >
                      {f.desc}
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
            <Eyebrow>도입 방식</Eyebrow>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(24px, 3vw, 36px)",
                color: "var(--color-text)",
                wordBreak: "keep-all",
              }}
            >
              프로그램 도입 절차
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
                      {s.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--color-dim)",
                        lineHeight: 1.7,
                        wordBreak: "keep-all",
                      }}
                    >
                      {s.desc}
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
