"use client";

import Link from "next/link";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4 uppercase tracking-widest font-bold" style={{ fontSize: 11, color: "var(--color-accent)" }}>
      <span style={{ width: 24, height: 2, background: "var(--color-accent)", display: "inline-block" }} />
      {children}
    </div>
  );
}

const faqCategories = [
  {
    label: "일반",
    marginTop: 0,
    items: [
      {
        q: "Get It Done at Work이 무엇인가요?",
        a: "Get It Done at Work은 미국 진출을 목표로 하는 한국 스타트업과, 미국 Top MBA 재학·졸업생(Enabler)을 연결하는 실행 중심 플랫폼입니다. 단순 조언이 아닌, 실제 실행에 함께 참여하는 전문가와의 협업이 가능합니다.",
      },
      {
        q: "기존 멘토링 서비스와 무엇이 다른가요?",
        a: "대부분의 멘토링 서비스는 경험을 공유하는 수준에 그칩니다. Get It Done at Work의 Enabler는 미국 현지에서 직접 실행합니다. 파트너 미팅 세팅, 이메일 작성, IR 자료 수정 등 실제 결과물을 만들어냅니다.",
      },
    ],
  },
  {
    label: "스타트업",
    marginTop: 40,
    items: [
      {
        q: "어떤 단계의 스타트업이 이용할 수 있나요?",
        a: "Seed부터 Series B까지 다양한 단계의 스타트업이 활용합니다. 미국 시장 리서치, GTM 전략, IR, 파트너십, 법인 설립 컨설팅 등 어느 단계에서든 필요에 맞는 전문가를 매칭할 수 있습니다.",
      },
      {
        q: "크레딧은 어떻게 구매하나요?",
        a: "소속 기관(KOTRA, 창업진흥원 등)으로부터 크레딧을 배분받는 경우가 많습니다. 개인 구매도 가능하며, 국내 신용카드로 결제할 수 있습니다. 1 크레딧 = $100입니다.",
      },
      {
        q: "Chemistry 세션은 정말 무료인가요?",
        a: "네, Chemistry 세션(20분)은 크레딧 차감 없이 진행됩니다. Enabler와 간단히 만나 방향성과 케미를 확인하는 용도이며, 이후 Standard 또는 Project 세션 예약 시 크레딧이 사용됩니다.",
      },
      {
        q: "세션은 어디서 진행되나요?",
        a: "별도 앱 설치 없이 Get It Done at Work 플랫폼 내 화상 미팅 기능으로 진행됩니다. 세션 중 메모 작성, 파일 공유가 가능하며, 종료 후 AI가 세션 내용을 자동으로 요약해 제공합니다.",
      },
      {
        q: "세션 후 환불이 가능한가요?",
        a: "Enabler가 세션을 확정하기 전(pending 상태)에는 전액 환불됩니다. 세션 취소의 경우 정책에 따라 부분 환불이 가능합니다. 상세 환불 정책은 이용약관을 참고해 주세요.",
      },
    ],
  },
  {
    label: "Enabler (MBA생)",
    marginTop: 40,
    items: [
      {
        q: "Enabler로 등록하려면 어떤 조건이 필요한가요?",
        a: "미국 Top MBA(Stanford, Wharton, HBS, MIT Sloan, Columbia, Chicago Booth 등) 재학 중이거나 졸업 후 3년 이내인 분을 대상으로 합니다. 지원서 제출 후 이력서 검토 및 인터뷰를 통해 심사합니다.",
      },
      {
        q: "Enabler는 수익의 몇 퍼센트를 받나요?",
        a: "세션 금액의 80%가 Enabler에게 지급됩니다. 1 크레딧($100) 세션의 경우 $80을 받습니다. 정산은 Stripe Connect를 통해 미국 계좌로 직접 입금됩니다.",
      },
      {
        q: "수업이나 학업과 병행할 수 있나요?",
        a: "Enabler가 직접 가용 시간을 설정하므로 완전히 자율적입니다. 주 2~3시간만 활용해도 의미있는 수익을 만들 수 있으며, 많은 Enabler가 학업 중에도 활동합니다.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      <main style={{ paddingTop: 56 }}>
        {/* Hero */}
        <section style={{ padding: "80px 24px 48px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <Eyebrow>자주 묻는 질문</Eyebrow>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 6vw, 56px)",
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: 20,
                color: "var(--color-text)",
              }}
            >
              FAQ
            </h1>
            <p style={{ fontSize: 17, color: "var(--color-dim)", lineHeight: 1.7 }}>
              Get It Done at Work에 대해 궁금한 점들을 모았습니다.
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section style={{ padding: "0 24px 80px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            {faqCategories.map((category) => (
              <div key={category.label} style={{ marginTop: category.marginTop }}>
                {/* Category Header */}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    borderBottom: "1px solid rgba(200,255,0,0.2)",
                    paddingBottom: 8,
                    marginBottom: 16,
                  }}
                >
                  {category.label}
                </div>

                {/* FAQ Items */}
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      padding: "24px 0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--color-text)",
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ color: "var(--color-accent)", fontWeight: 700, flexShrink: 0 }}>Q.</span>
                      <span>{item.q}</span>
                    </div>
                    <p
                      className="pl-4 md:pl-8"
                      style={{
                        fontSize: 15,
                        color: "var(--color-dim)",
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            ))}

            {/* CTA Card */}
            <div
              style={{
                marginTop: 48,
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 20,
                textAlign: "center",
                padding: 32,
              }}
            >
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>
                원하는 답을 찾지 못하셨나요?
              </p>
              <p style={{ fontSize: 14, color: "var(--color-dim)", margin: "0 0 24px" }}>
                팀에 직접 문의해 주세요. 24시간 내에 답변드립니다.
              </p>
              <Link href="/contact" className="landing-btn-primary">
                문의하기 →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
