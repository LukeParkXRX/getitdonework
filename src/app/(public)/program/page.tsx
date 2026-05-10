import Link from "next/link";

export const dynamic = "force-static";

const EXPERTISE_TAGS = [
  "B2B SaaS",
  "Fintech",
  "E-commerce",
  "Healthcare",
  "AI / DeepTech",
  "+12개 분야",
];

const SESSION_TYPES = [
  { name: "Chemistry", color: "var(--color-accent)", sub: "20분 · 무료" },
  { name: "Standard", color: "var(--color-blue)", sub: "60분 · 2 크레딧" },
  { name: "Project", color: "var(--color-amber)", sub: "장기 · 협의" },
];

const ENABLER_QUALITIES = [
  {
    icon: "🎓",
    title: "Top MBA 검증",
    desc: "Stanford, Wharton, HBS, MIT Sloan, Columbia 등 검증된 학교 출신만 등록 가능. 이력서 + 인터뷰 심사 통과자만 활동합니다.",
  },
  {
    icon: "💼",
    title: "실전 경험 보유",
    desc: "Google, Goldman Sachs, Amazon, Salesforce 등 글로벌 기업 인턴십·정규직 경험으로 현장 지식을 보유합니다.",
  },
  {
    icon: "🇺🇸",
    title: "현지 네트워크",
    desc: "미국 현지 투자자, 파트너사, 고객사와의 실제 연결 가능. 단순 소개를 넘어 미팅 세팅까지 지원합니다.",
  },
];

const STATS = [
  { num: "87+", label: "누적 세션" },
  { num: "4.9", label: "평균 평점" },
  { num: "78%", label: "재요청률" },
  { num: "12+", label: "전문 분야" },
];

export default function ProgramPage() {
  return (
    <>
      <main className="min-h-screen" style={{ paddingTop: 56 }}>
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
            <Eyebrow>프로그램 소개</Eyebrow>
            <h1
              className="font-extrabold tracking-tighter leading-[1.1] mb-5"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 5vw, 56px)",
              }}
            >
              한국 스타트업과 미국 MBA를
              <br />
              <span style={{ color: "var(--color-accent)" }}>실전으로</span>{" "}
              연결합니다
            </h1>
            <p
              className="max-w-[560px]"
              style={{ fontSize: 18, color: "var(--color-dim)", lineHeight: 1.7 }}
            >
              Get It Done at Work은 단순 멘토링이 아닙니다. 검증된 MBA Enabler가 직접 실행에
              참여해 미국 시장 진출을 돕는 실행 중심 플랫폼입니다.
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
                지금 매칭 시작하기 →
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
                Enabler 찾아보기
              </Link>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="max-w-[1160px] mx-auto px-10" style={{ padding: "80px 0" }}>
          <div className="mb-12">
            <Eyebrow>어떻게 작동하나요</Eyebrow>
            <h2
              className="font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontSize: 36 }}
            >
              3단계로 완성되는 미국 진출
            </h2>
          </div>

          {/* Step 1 */}
          <div
            className="flex gap-8 items-start"
            style={{ padding: "36px 0", borderBottom: "1px solid var(--color-border)" }}
          >
            <StepNum>1</StepNum>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold mb-2">Enabler 매칭</h3>
              <p
                className="max-w-[600px]"
                style={{ color: "var(--color-dim)", fontSize: 15 }}
              >
                Stanford GSB, Wharton, HBS, MIT Sloan 등 Top MBA 출신 Enabler들
                중 우리 스타트업의 산업·목표에 맞는 전문가를 AI 매칭 + 직접
                필터링으로 선택합니다.
              </p>
              <div className="flex gap-2 mt-3.5 flex-wrap">
                {EXPERTISE_TAGS.map((t) => (
                  <span
                    key={t}
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--color-dim)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {t}
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
                AI 추천 Enabler
              </div>
              <div className="flex flex-col gap-2">
                <EnablerPreview initials="SC" name="Sarah Chen" school="Stanford GSB · GTM" match={98} color="#3b82f6" />
                <EnablerPreview initials="DK" name="David Kim" school="MIT Sloan · AI" match={95} color="#8b5cf6" />
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
              <h3 className="text-xl font-bold mb-2">세션 예약 & 브리프 제출</h3>
              <p
                className="max-w-[600px]"
                style={{ color: "var(--color-dim)", fontSize: 15 }}
              >
                Chemistry 세션(무료 20분)으로 케미를 먼저 확인하고, 본격적인
                Standard 또는 Project 세션을 크레딧으로 예약합니다. 사전에 브리프를
                제출해 세션을 최대한 효율적으로 활용합니다.
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
              <h3 className="text-xl font-bold mb-2">실행 & 팔로우업</h3>
              <p
                className="max-w-[600px]"
                style={{ color: "var(--color-dim)", fontSize: 15 }}
              >
                플랫폼 내 화상 미팅으로 세션 진행. AI가 미팅 노트를 자동 요약하고
                액션 아이템을 정리합니다. 세션 후 재요청률 78% — 한 번 만나고 끝나는
                게 아닙니다.
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
            <Eyebrow>Enabler란?</Eyebrow>
            <h2
              className="font-extrabold tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: 36 }}
            >
              단순 조언자가 아닌{" "}
              <span style={{ color: "var(--color-accent)" }}>실행 파트너</span>
            </h2>
            <p
              className="max-w-[680px] mb-10"
              style={{ fontSize: 16, color: "var(--color-dim)" }}
            >
              Get It Done at Work의 Enabler는 미국 Top MBA 재학·졸업생 중 실제 업무 경험을
              보유한 전문가들입니다. 현지 네트워크와 실전 경험을 바탕으로 스타트업의
              미국 진출을 직접 실행합니다.
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
