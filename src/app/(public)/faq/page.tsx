import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-static";

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
    label: "서비스 일반",
    marginTop: 0,
    items: [
      {
        q: "Get It Done at Work이 무엇인가요?",
        a: "Get It Done at Work은 미국 진출을 목표로 하는 한국 스타트업과, 미국 Top MBA 재학·졸업생(Enabler)을 연결하는 실행 중심 플랫폼입니다. 단순 조언이 아닌, 실제 업무를 함께 수행하는 전문가와의 협업이 가능합니다. GTM 전략 수립, IR 자료 작성, 현지 파트너십 발굴 등 다양한 실행 영역을 지원합니다.",
      },
      {
        q: "Enabler는 누구인가요?",
        a: "Enabler는 Stanford, Wharton, HBS, MIT Sloan 등 미국 Top MBA 재학 중이거나 졸업한 검증된 전문가입니다. 단순한 조언자가 아니라 스타트업의 미국 시장 업무를 직접 실행하는 파트너 역할을 합니다. 지원서 제출 후 이력서 검토와 인터뷰를 통해 엄격히 선발됩니다.",
      },
      {
        q: "기존 멘토링 서비스와 무엇이 다른가요?",
        a: "대부분의 멘토링 서비스는 경험을 공유하는 수준에 그칩니다. Get It Done at Work의 Enabler는 미국 현지에서 직접 실행합니다. 파트너 미팅 세팅, 이메일 작성, IR 자료 수정 등 실제 결과물을 만들어내며, 계약 기반으로 책임감 있게 진행됩니다.",
      },
      {
        q: "한국 스타트업만 이용할 수 있나요?",
        a: "현재는 미국 시장 진출을 준비하는 한국 스타트업을 주요 대상으로 운영하고 있습니다. 향후 아시아 스타트업 전반으로 서비스를 확대할 예정입니다. 한국어·영어 모두 지원됩니다.",
      },
    ],
  },
  {
    label: "매칭 & 세션",
    marginTop: 40,
    items: [
      {
        q: "Chemistry Call이 무엇인가요?",
        a: "Chemistry Call은 Enabler와 처음 만나는 무료 15~20분 세션입니다. 크레딧 차감 없이 진행되며, 서로의 방향성과 케미스트리를 먼저 확인하는 용도입니다. Chemistry Call 이후 Standard 또는 Project 세션을 예약할 수 있습니다.",
      },
      {
        q: "어떤 단계의 스타트업이 이용할 수 있나요?",
        a: "Seed부터 Series B까지 다양한 단계의 스타트업이 활용합니다. 미국 시장 리서치, GTM 전략, IR, 파트너십, 법인 설립 컨설팅 등 어느 단계에서든 필요에 맞는 전문가를 매칭할 수 있습니다.",
      },
      {
        q: "매칭 신청 후 응답은 언제 받나요?",
        a: "Enabler는 보통 24시간 이내에 요청을 수락하거나 거절합니다. 수락 시 Enabler가 일정을 확정하고 세션이 진행됩니다. 응답이 없거나 거절되는 경우 알림으로 안내드립니다.",
      },
      {
        q: "Enabler가 요청을 거절하면 크레딧은 어떻게 되나요?",
        a: "Enabler가 거절하거나 72시간 내 응답이 없으면 보류된 크레딧이 자동으로 전액 반환됩니다. 별도 신청 없이 자동으로 처리됩니다.",
      },
      {
        q: "세션은 어디서 진행되나요?",
        a: "별도 앱 설치 없이 Get It Done at Work 플랫폼 내 화상 미팅 기능(LiveKit 기반)으로 진행됩니다. 세션 중 메모 작성, 파일 공유가 가능하며, 세션 종료 후 자동 요약을 제공합니다.",
      },
    ],
  },
  {
    label: "결제 & 환불",
    marginTop: 40,
    items: [
      {
        q: "크레딧은 어디서 구매하나요?",
        a: "현재 크레딧 직접 구매 기능을 준비 중입니다. 기관 파트너(KOTRA, 창업진흥원 등)를 통해 크레딧을 배분받는 경우가 많으며, 개인 구매도 곧 활성화될 예정입니다. 1 크레딧 = $100입니다.",
      },
      {
        q: "환불 정책이 어떻게 되나요?",
        a: "Enabler가 세션을 확정하기 전(pending 상태)에는 전액 환불됩니다. 세션 확정 후 24시간 이전 취소 시 100% 환불, 24시간 이내 취소 시 부분 환불이 적용될 수 있습니다. 상세 내용은 환불 정책 페이지를 참고해 주세요.",
      },
      {
        q: "부가세(VAT)는 별도인가요?",
        a: "크레딧 가격은 부가세 별도 기준입니다. 한국 내 결제 시 부가세 10%가 추가될 수 있으며, 세금계산서 발행이 필요하신 경우 문의하기를 통해 요청해 주세요.",
      },
    ],
  },
  {
    label: "Enabler 지원",
    marginTop: 40,
    items: [
      {
        q: "Enabler가 되려면 어떻게 하나요?",
        a: "Enabler 지원 페이지(/enabler-apply)에서 지원서를 제출하시면 됩니다. 이력서 검토와 화상 인터뷰를 거쳐 승인 여부를 결정합니다. 승인 후 프로필을 작성하고 가용 시간을 설정하면 바로 매칭 요청을 받을 수 있습니다.",
      },
      {
        q: "Enabler 자격 요건이 어떻게 되나요?",
        a: "미국 Top MBA(Stanford, Wharton, HBS, MIT Sloan, Columbia, Chicago Booth 등) 재학 중이거나 졸업 후 3년 이내인 분을 대상으로 합니다. MBA 과정이 없더라도 동등한 실무 경험(스타트업 창업, VC, 컨설팅 등)이 있으면 지원 가능합니다.",
      },
      {
        q: "수익 정산은 어떻게 받나요?",
        a: "세션 금액의 80%가 Enabler에게 지급됩니다. 정산은 Stripe Connect를 통해 미국 은행 계좌로 직접 입금됩니다. 정산 주기는 월 1회이며, 대시보드에서 실시간으로 수익 현황을 확인할 수 있습니다.",
      },
    ],
  },
  {
    label: "계정 & 기술",
    marginTop: 40,
    items: [
      {
        q: "비밀번호를 잊어버렸습니다.",
        a: "로그인 페이지에서 '비밀번호를 잊으셨나요?' 링크를 클릭하거나 /forgot-password 페이지에서 이메일을 입력하시면 재설정 링크를 보내드립니다. Google 계정으로 가입하셨다면 Google 로그인을 이용해 주세요.",
      },
      {
        q: "계정을 삭제할 수 있나요?",
        a: "설정 페이지에서 계정 삭제를 요청할 수 있습니다. 삭제 요청 후 운영팀 검토를 거쳐 처리됩니다. 단, 진행 중인 세션이나 미정산 크레딧이 있는 경우 먼저 처리한 후 삭제가 진행됩니다.",
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqCategories.flatMap(({ items }) =>
    items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    }))
  ),
};

export default function FAQPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <main>
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
