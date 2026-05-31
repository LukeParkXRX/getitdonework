import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "이용약관",
  description: "Get It Done at Work 서비스 이용약관 및 회원·Enabler·기관의 권리/의무.",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "이용약관 — Get It Done at Work",
    description: "Get It Done at Work 서비스 이용약관.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <>
      <main
        style={{
          backgroundColor: "var(--color-black)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            padding: "120px 24px 80px",
          }}
        >
          {/* 타이틀 */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 48px)",
              color: "var(--color-text)",
              fontWeight: 700,
              marginBottom: "12px",
              lineHeight: 1.15,
            }}
          >
            이용약관
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
              fontSize: "14px",
              marginBottom: "56px",
            }}
          >
            시행일: 2026년 4월 20일 &nbsp;·&nbsp; 최종 업데이트: 2026년 4월 20일
          </p>

          {/* 본문 */}
          <div
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
              fontSize: "15px",
              lineHeight: "1.8",
            }}
          >

            {/* 제1조 */}
            <Section title="제1조 (목적)">
              <p>
                본 약관은 Get It Done at Work(이하 "회사")이 운영하는 크레딧 기반 실행 컨설팅 플랫폼
                Get It Done at Work(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자 간의 권리·의무 및
                책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </Section>

            {/* 제2조 */}
            <Section title="제2조 (정의)">
              <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
              <ol>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>"서비스"</strong>란 회사가 제공하는 Get It Done at Work 플랫폼 전반(웹사이트, API, 화상 세션 연결 등)을 의미합니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>"이용자"</strong>란 본 약관에 동의하고 서비스를 이용하는 모든 자를 말하며, Startup(스타트업) 사용자와 Enabler(멘토) 사용자를 포함합니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>"Startup(스타트업)"</strong>이란 서비스를 통해 Enabler와 세션을 진행하는 한국 소재 스타트업 및 그 임직원을 말합니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>"Enabler(이네이블러, 멘토)"</strong>란 미국 MBA(Stanford, Wharton, HBS 등) 과정 재학 중이거나 졸업한 자로서 .edu 이메일 인증을 완료하고, 서비스를 통해 스타트업에 실행 컨설팅 세션을 제공하는 자를 말합니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>"Organization(기관)"</strong>이란 크레딧을 대량 구매하여 소속 스타트업에 배분하는 정부 기관, 액셀러레이터(accelerator), 벤처캐피탈(VC) 등을 말합니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>"크레딧(Credit)"</strong>이란 서비스 내에서 세션 예약 등에 사용되는 가상 단위로, 1 크레딧은 미화 100달러(USD $100)에 해당합니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>"세션(Session)"</strong>이란 Startup과 Enabler가 화상 플랫폼(LiveKit Cloud)을 통해 진행하는 실행 컨설팅 미팅을 말합니다. 세션 유형은 다음과 같습니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>Chemistry Call: 무료, 약 15분, 상호 탐색 목적</li>
                    <li>Standard Session: 2 크레딧, 약 60분, 실행 중심 컨설팅</li>
                    <li>Project Session: 크레딧 수량 협의, 장기·심화 프로젝트</li>
                  </ul>
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>"계정"</strong>이란 이용자가 서비스 이용을 위해 생성한 고유 아이디 및 비밀번호의 결합을 말합니다.
                </li>
              </ol>
            </Section>

            {/* 제3조 */}
            <Section title="제3조 (약관의 명시·효력 및 변경)">
              <ol>
                <li>회사는 본 약관의 내용을 이용자가 알 수 있도록 서비스 초기 화면 또는 연결 화면에 게시합니다.</li>
                <li>본 약관은 이용자가 동의한 시점부터 효력이 발생합니다.</li>
                <li>
                  회사는 관련 법령을 위반하지 않는 범위 내에서 약관을 개정할 수 있습니다. 약관 변경 시 최소 7일 전(중요 사항은 30일 전) 서비스 내 공지 또는 가입 이메일로 고지하며, 고지 후 이용자가 이의를 제기하지 않으면 변경된 약관에 동의한 것으로 간주합니다.
                </li>
                <li>이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
              </ol>
            </Section>

            {/* 제4조 */}
            <Section title="제4조 (서비스 내용)">
              <ol>
                <li>회사는 다음 서비스를 제공합니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>Enabler 프로필 검색 및 매칭 서비스</li>
                    <li>세션 예약·진행·정산 서비스</li>
                    <li>크레딧 구매·배분·관리 서비스</li>
                    <li>기관(Organization) 대시보드 및 크레딧 배분 관리</li>
                    <li>화상 세션 연결(LiveKit Cloud 외부 플랫폼 활용)</li>
                    <li>세션 기록 및 인사이트 제공</li>
                  </ul>
                </li>
                <li>서비스는 연중무휴 제공을 원칙으로 하나, 시스템 점검·장애·외부 서비스 중단 등 불가피한 사유로 일시 중단될 수 있습니다.</li>
                <li>회사는 서비스의 내용을 변경·추가·폐지할 수 있으며, 중요 변경 사항은 사전 공지합니다.</li>
              </ol>
            </Section>

            {/* 제5조 */}
            <Section title="제5조 (회원가입)">
              <ol>
                <li>회원가입은 이용자가 본 약관에 동의하고 회사가 요구하는 정보를 제공하는 방식으로 이루어집니다.</li>
                <li>
                  Enabler로 가입 시, 미국 MBA 재학 또는 졸업을 증명하는 유효한 .edu 이메일 주소를 통해 인증 절차를 완료해야 합니다. 허위 인증 시 계정 즉시 정지 및 서비스 이용 제한이 가능합니다.
                </li>
                <li>만 19세 미만 또는 법정 제한 대상자는 회원가입이 제한될 수 있습니다.</li>
                <li>이용자는 본인 명의의 정확한 정보를 제공해야 하며, 허위 정보 제공으로 인한 불이익은 이용자 본인이 부담합니다.</li>
                <li>회사는 다음에 해당하는 경우 회원가입 신청을 거부할 수 있습니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>이미 탈퇴 처리되거나 이용 제한 중인 계정으로 재가입 시도</li>
                    <li>타인의 정보를 도용하거나 허위 정보를 기재한 경우</li>
                    <li>기타 본 약관 또는 관련 법령을 위반한 경우</li>
                  </ul>
                </li>
              </ol>
            </Section>

            {/* 제6조 */}
            <Section title="제6조 (회원 탈퇴 및 계정 삭제)">
              <ol>
                <li>이용자는 언제든지 서비스 내 설정 메뉴 또는 이메일(support@getitdonework.com)을 통해 탈퇴를 요청할 수 있습니다.</li>
                <li>탈퇴 처리 시 잔여 크레딧은 즉시 소멸하며, 환불되지 않습니다. 단, 관련 법령이 정한 환불 사유에 해당하는 경우 예외로 합니다.</li>
                <li>탈퇴 후에도 전자상거래법 등 관련 법령에 따라 일정 기간 거래 기록이 보존됩니다(개인정보처리방침 참조).</li>
                <li>회사는 다음 사유에 해당하는 이용자의 계정을 사전 고지 후(긴급 시 사후 고지) 강제 탈퇴 또는 이용 정지할 수 있습니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>타인의 개인정보 도용·허위 정보 등록</li>
                    <li>제10조(금지행위) 위반</li>
                    <li>서비스의 운영을 방해하거나 회사의 명예를 훼손하는 행위</li>
                    <li>기타 관련 법령 위반</li>
                  </ul>
                </li>
              </ol>
            </Section>

            {/* 제7조 */}
            <Section title="제7조 (크레딧 구매·사용·소멸)">
              <ol>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>구매 방법</strong>: 개인 Startup은 카드(Stripe Checkout)를 통해, 기관(Organization)은 대량 구매 계약 후 인보이스 결제 방식으로 크레딧을 구매할 수 있습니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>크레딧 배분</strong>: 기관이 구매한 크레딧은 기관 관리자(Organization Admin)가 소속 스타트업 계정에 배분할 수 있습니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>크레딧 사용</strong>: 크레딧은 Standard Session, Project Session 예약에 사용됩니다. Chemistry Call(무료)에는 크레딧이 차감되지 않습니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>유효 기간 및 소멸</strong>:
                  <ul style={{ marginTop: "8px" }}>
                    <li>기관 구매 크레딧: 구매 확정일로부터 12개월 후 자동 소멸 (미사용 시)</li>
                    <li>스타트업 배분 크레딧: 배분된 프로그램의 종료일까지만 사용 가능하며, 프로그램 종료 즉시 소멸</li>
                  </ul>
                </li>
                <li>소멸 예정 크레딧이 있는 경우 회사는 소멸 30일 전 이메일로 사전 고지합니다.</li>
                <li>소멸된 크레딧은 복구되지 않으며, 환불 또는 이월되지 않습니다.</li>
                <li>크레딧은 타 계정으로 양도하거나 현금으로 교환할 수 없습니다. 단, 기관 관리자의 배분 기능은 본 조의 예외로 허용됩니다.</li>
              </ol>
            </Section>

            {/* 제8조 */}
            <Section title="제8조 (세션 예약·취소·환불)">
              <ol>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>세션 예약</strong>: Startup은 Enabler의 가용 시간을 확인하고 서비스 내 예약 시스템을 통해 세션을 신청합니다. 예약 확정 시 해당 크레딧이 선(先)차감됩니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>취소 및 크레딧 반환 기준</strong>:
                  <ul style={{ marginTop: "8px" }}>
                    <li>세션 시작 24시간 초과 전 취소: 차감 크레딧 100% 반환</li>
                    <li>세션 시작 12시간 초과~24시간 이내 취소: 차감 크레딧의 50% 반환</li>
                    <li>세션 시작 12시간 이내 취소 또는 No-show(무단 불참): 크레딧 반환 없음</li>
                    <li>Enabler 귀책으로 인한 세션 취소: 차감 크레딧 100% 반환 및 재매칭 지원</li>
                  </ul>
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>기술적 문제</strong>: 세션 진행 중 회사 또는 플랫폼(LiveKit Cloud) 귀책의 기술적 문제로 세션이 정상 진행되지 못한 경우, 차감 크레딧 전액을 반환하고 재매칭을 지원합니다.
                </li>
                <li>Chemistry Call은 무료이므로 취소에 따른 크레딧 변동이 없습니다.</li>
                <li>세션 취소 및 환불 관련 상세 기준은 별도의 환불 정책에서 정합니다.</li>
              </ol>
            </Section>

            {/* 제9조 */}
            <Section title="제9조 (Enabler 의무 및 딜리버리 책임)">
              <ol>
                <li>Enabler는 서비스 가입 시 유효한 .edu 이메일로 MBA 재학·졸업을 인증해야 하며, 졸업·제적 등으로 자격이 변동된 경우 즉시 회사에 고지해야 합니다.</li>
                <li>Enabler는 예약이 확정된 세션에 성실히 참석하고, 약속된 내용을 성실하게 제공해야 합니다.</li>
                <li>Enabler는 세션 내에서 취득한 Startup의 기밀 정보를 세션 목적 외에 활용하거나 제3자에게 제공해서는 안 됩니다.</li>
                <li>Enabler는 회사가 정한 행동 강령(Code of Conduct)을 준수해야 하며, 위반 시 계정 정지 및 플랫폼 이용 영구 제한이 가능합니다.</li>
                <li>Enabler의 정산(Payment)은 Stripe Connect를 통해 이루어지며, 정산을 받기 위해서는 Stripe Connect 계정 등록(은행 계좌, 세무 신고 정보 포함)을 완료해야 합니다. 미완료 시 정산이 보류될 수 있습니다.</li>
                <li>Enabler는 독립 계약자(Independent Contractor) 신분으로, 회사와의 고용 관계를 주장할 수 없습니다.</li>
              </ol>
            </Section>

            {/* 제10조 */}
            <Section title="제10조 (금지행위)">
              <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
              <ol>
                <li>타인의 개인정보 도용, 허위 인증, 계정 공유·매매</li>
                <li>서비스를 통해 알게 된 상대방과 플랫폼 외부에서 직접 거래하여 회사를 우회하는 행위</li>
                <li>서비스의 정상적인 운영을 방해하는 해킹, DDoS, 크롤링(무단) 등 기술적 공격</li>
                <li>회사 및 타 이용자의 지식재산권 침해</li>
                <li>세션 중 녹화·녹음을 상대방 동의 없이 수행하는 행위</li>
                <li>불법 다단계·스팸·광고 행위</li>
                <li>허위 후기 작성, 악의적 신고 남용</li>
                <li>기타 관련 법령 또는 본 약관 위반</li>
              </ol>
            </Section>

            {/* 제11조 */}
            <Section title="제11조 (지식재산권)">
              <ol>
                <li>서비스 내 회사가 제작한 콘텐츠(텍스트, 로고, UI 디자인, 소프트웨어 등)에 대한 지식재산권은 회사에 귀속됩니다.</li>
                <li>이용자가 세션을 통해 생성한 결과물의 저작권은 Startup과 Enabler 간 합의에 따르며, 별도 합의가 없는 경우 각자가 기여한 부분에 대한 권리를 보유합니다.</li>
                <li>이용자는 회사의 사전 동의 없이 서비스 내 콘텐츠를 상업적으로 복제·배포·가공할 수 없습니다.</li>
              </ol>
            </Section>

            {/* 제12조 */}
            <Section title="제12조 (면책조항)">
              <ol>
                <li>회사는 Enabler가 세션에서 제공하는 조언·정보의 정확성·완전성·적합성에 대해 보증하지 않으며, 이로 인한 Startup의 경영 결과에 대해 책임을 지지 않습니다.</li>
                <li>회사는 천재지변, 전쟁, 테러, 정전, 통신 장애, 외부 플랫폼(LiveKit Cloud, Stripe 등) 장애 등 불가항력(Force Majeure) 사유로 서비스를 제공하지 못한 경우 책임을 부담하지 않습니다.</li>
                <li>이용자 간(Startup ↔ Enabler) 분쟁은 당사자 간 해결을 원칙으로 하며, 회사는 분쟁 중재를 지원하되 법적 책임을 부담하지 않습니다.</li>
                <li>회사의 고의 또는 중과실로 인한 손해에 대해서는 본 조의 면책이 적용되지 않습니다.</li>
              </ol>
            </Section>

            {/* 제13조 */}
            <Section title="제13조 (준거법 및 분쟁 해결)">
              <ol>
                <li>본 약관의 해석 및 이와 관련된 분쟁은 대한민국 법률을 우선 준거법으로 합니다. 단, 미국 소재 Enabler와 관련된 사안에서 미국 연방법 또는 주법이 적용되어야 하는 경우, 해당 법률을 병용하여 적용할 수 있습니다.</li>
                <li>서비스 이용과 관련한 분쟁이 발생한 경우 회사와 이용자는 성실한 협의를 통해 해결하는 것을 우선으로 합니다.</li>
                <li>협의로 해결되지 않을 경우 서울중앙지방법원을 제1심 전속 관할 법원으로 합니다. 단, 당사자 합의 하에 대한상사중재원 또는 적절한 국제 중재 기관을 통한 중재로 갈음할 수 있습니다.</li>
                <li>한국 소비자보호법 등 소비자 보호 관련 강행 규정은 본 조와 무관하게 우선 적용됩니다.</li>
              </ol>
            </Section>

            {/* 시행일 */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                marginTop: "48px",
                paddingTop: "24px",
                color: "rgba(255,255,255,0.3)",
                fontSize: "13px",
              }}
            >
              <p>시행일: 2026년 4월 20일</p>
              <p>Get It Done at Work 운영팀 · support@getitdonework.com</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ─── Section Component ────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "17px",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: "14px",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          paddingLeft: "0",
        }}
      >
        {children}
      </div>
    </section>
  );
}
