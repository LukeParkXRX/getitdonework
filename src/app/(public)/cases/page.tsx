import Link from "next/link";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4 uppercase tracking-widest font-bold" style={{ fontSize: 11, color: "var(--color-accent)" }}>
      <span style={{ width: 24, height: 2, background: "var(--color-accent)", display: "inline-block" }} />
      {children}
    </div>
  );
}

const cases = [
  {
    id: 1,
    iconLetter: "N",
    iconBg: "var(--color-blue)",
    company: "넥스트페이",
    subtitle: "B2B 핀테크 · Series A",
    tag: "Fintech",
    tagColor: "var(--color-blue)",
    quote:
      "James Park(Wharton MBA)을 통해 미국 IR 자료를 완전히 재구성하고, 뉴욕 핀테크 VC 3곳과 미팅을 연결받았습니다.",
    metrics: [
      { value: "$2M", label: "투자 유치" },
      { value: "3개", label: "VC 미팅" },
      { value: "8", label: "세션 총 이용" },
    ],
    enablerInitials: "JP",
    enablerInitialsBg: "var(--color-amber)",
    enablerName: "James Park",
    enablerDesc: "Wharton · IR Strategy",
    rating: "5.0",
  },
  {
    id: 2,
    iconLetter: "A",
    iconBg: "var(--color-accent)",
    company: "AIFlow",
    subtitle: "AI SaaS · Seed",
    tag: "AI/Tech",
    tagColor: "var(--color-accent)",
    quote:
      "David Kim(MIT Sloan)이 미국 엔터프라이즈 고객용 데모 스크립트를 처음부터 다시 짜줬어요. 첫 미국 POC 고객을 확보했습니다.",
    metrics: [
      { value: "1개사", label: "첫 미국 고객" },
      { value: "$50K", label: "POC 계약" },
      { value: "5", label: "세션 총 이용" },
    ],
    enablerInitials: "DK",
    enablerInitialsBg: "var(--color-blue)",
    enablerName: "David Kim",
    enablerDesc: "MIT Sloan · AI Strategy",
    rating: "5.0",
  },
  {
    id: 3,
    iconLetter: "G",
    iconBg: "var(--color-green)",
    company: "그린테크",
    subtitle: "CleanTech · Pre-Series A",
    tag: "CleanTech",
    tagColor: "var(--color-green)",
    quote:
      "미국 시장 리서치부터 초기 파트너 리스트, 콜드 이메일 전략까지. Emily Rodriguez가 없었다면 혼자 6개월은 걸렸을 작업입니다.",
    metrics: [
      { value: "10개", label: "파트너 후보" },
      { value: "35%", label: "응답률" },
      { value: "4", label: "세션 총 이용" },
    ],
    enablerInitials: "ER",
    enablerInitialsBg: "var(--color-amber)",
    enablerName: "Emily Rodriguez",
    enablerDesc: "HBS · Market Research",
    rating: "4.7",
  },
];

const testimonials = [
  {
    text: "처음에는 반신반의했는데, 세션 하나로 미국 GTM 전략을 완전히 재정립했습니다.",
    author: "김태호 · 넥스트페이 CEO",
  },
  {
    text: "이력서 스펙이 아니라 실제로 일해본 사람이 주는 피드백이 달랐습니다.",
    author: "이수진 · AIFlow CTO",
  },
  {
    text: "화상으로 진행하는데도 굉장히 실행 중심적입니다. 말만 하고 끝나지 않아요.",
    author: "박준영 · 그린테크 COO",
  },
];

export default function CasesPage() {
  return (
    <>
      <main style={{ paddingTop: 56 }}>
        {/* Hero */}
        <section
          className="text-center"
          style={{ padding: "80px 24px 60px", background: "var(--color-dark)" }}
        >
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <Eyebrow>성공 사례</Eyebrow>
            <h1
              className="font-bold leading-tight"
              style={{ fontSize: "clamp(32px, 5vw, 48px)", color: "var(--color-text)", marginBottom: 20 }}
            >
              실제로{" "}
              <span style={{ color: "var(--color-accent)" }}>움직인</span>{" "}
              스타트업들
            </h1>
            <p style={{ fontSize: 17, color: "var(--color-dim)", lineHeight: 1.7 }}>
              Get It Done at Work를 통해 미국 시장에서 실질적인 성과를 만들어낸 스타트업들의 이야기입니다.
            </p>
          </div>
        </section>

        {/* Case Cards */}
        <section style={{ padding: "60px 24px", background: "var(--color-dark)" }}>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            style={{ maxWidth: 1080, margin: "0 auto" }}
          >
            {cases.map((c) => (
              <article
                key={c.id}
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                {/* Card Header */}
                <div style={{ padding: "28px 28px 0" }}>
                  {/* Icon + Company + Tag row */}
                  <div
                    className="flex items-start justify-between"
                    style={{ marginBottom: 20 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center font-bold"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: c.iconBg,
                          color: "#fff",
                          fontSize: 18,
                          fontFamily: "var(--font-display)",
                          flexShrink: 0,
                        }}
                      >
                        {c.iconLetter}
                      </div>
                      <div>
                        <div
                          className="font-bold"
                          style={{ fontSize: 15, color: "var(--color-text)" }}
                        >
                          {c.company}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-dim)", marginTop: 2 }}>
                          {c.subtitle}
                        </div>
                      </div>
                    </div>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 99,
                        background: `color-mix(in srgb, ${c.tagColor} 15%, transparent)`,
                        color: c.tagColor,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {c.tag}
                    </span>
                  </div>

                  {/* Quote */}
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-dim)",
                      lineHeight: 1.7,
                      paddingBottom: 20,
                    }}
                  >
                    &ldquo;{c.quote}&rdquo;
                  </p>
                </div>

                {/* Card Body */}
                <div style={{ padding: "20px 28px 28px" }}>
                  {/* Metrics row */}
                  <div
                    className="flex"
                    style={{
                      borderTop: "1px solid var(--color-border)",
                      borderBottom: "1px solid var(--color-border)",
                      padding: "16px 0",
                      marginBottom: 20,
                      gap: 0,
                    }}
                  >
                    {c.metrics.map((m, i) => (
                      <div
                        key={i}
                        className="flex-1 text-center"
                        style={{
                          borderRight: i < c.metrics.length - 1 ? "1px solid var(--color-border)" : "none",
                        }}
                      >
                        <div
                          className="font-bold"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 28,
                            color: "var(--color-accent)",
                            lineHeight: 1,
                          }}
                        >
                          {m.value}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-dim)", marginTop: 4 }}>
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Enabler row */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center font-bold"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 99,
                        background: c.enablerInitialsBg,
                        color: "#fff",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {c.enablerInitials}
                    </div>
                    <div className="flex-1">
                      <div
                        className="font-bold"
                        style={{ fontSize: 13, color: "var(--color-text)" }}
                      >
                        {c.enablerName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-dim)", marginTop: 1 }}>
                        {c.enablerDesc}
                      </div>
                    </div>
                    <div
                      className="font-bold"
                      style={{ fontSize: 13, color: "var(--color-amber)" }}
                    >
                      ★ {c.rating}
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {/* Placeholder CTA card */}
            <article
              className="flex flex-col items-center justify-center text-center"
              style={{
                border: "2px dashed var(--color-border)",
                borderRadius: 20,
                padding: "60px 40px",
                gap: 20,
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 99,
                  border: "2px dashed var(--color-border)",
                  color: "var(--color-dim)",
                  fontSize: 28,
                  lineHeight: 1,
                }}
              >
                +
              </div>
              <p
                className="font-bold"
                style={{ fontSize: 15, color: "var(--color-dim)", lineHeight: 1.6 }}
              >
                다음 성공 사례는<br />여러분이 될 수 있습니다
              </p>
              <Link
                href="/matching"
                className="font-bold"
                style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  borderRadius: 99,
                  background: "var(--color-accent)",
                  color: "#fff",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                지금 시작하기
              </Link>
            </article>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: "60px 24px 80px", background: "var(--color-dark)" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 20,
                padding: 40,
              }}
            >
              <div
                className="uppercase font-bold tracking-widest"
                style={{ fontSize: 11, color: "var(--color-dim)", marginBottom: 32 }}
              >
                스타트업 후기
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((t, i) => (
                  <div key={i}>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--color-text)",
                        lineHeight: 1.75,
                        marginBottom: 16,
                      }}
                    >
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <p
                      className="font-bold"
                      style={{ fontSize: 12, color: "var(--color-dim)" }}
                    >
                      — {t.author}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
