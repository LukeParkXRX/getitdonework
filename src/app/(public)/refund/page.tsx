import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "환불정책",
  description: "Get It Done at Work 환불·취소 정책. 세션 시작 전후 환불 가능 범위 안내.",
  alternates: { canonical: "/refund" },
  openGraph: {
    title: "환불정책 — Get It Done at Work",
    description: "Get It Done at Work 환불 및 취소 정책.",
    url: "/refund",
  },
};

export default function RefundPage() {
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
          {/* 초안 경고 배너 */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "6px",
              padding: "10px 16px",
              marginBottom: "48px",
              color: "rgba(255,255,255,0.35)",
              fontSize: "12px",
              lineHeight: "1.5",
            }}
          >
            본 정책은 초안이며 법무 검토 후 확정됩니다. 법적 효력 발생 전 변호사 검수 예정입니다.
          </div>

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
            환불정책
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

            {/* 1. 크레딧 구매 환불 */}
            <Section title="1. 크레딧 구매 환불">
              <ol>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>원칙</strong>: 크레딧은 구매 확정 즉시 비환불을 원칙으로 합니다. 단, 아래 조건을 동시에 충족하는 경우 예외적으로 환불이 가능합니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>구매일로부터 7일(영업일 기준) 이내 환불 신청</li>
                    <li>구매한 크레딧이 단 1 크레딧도 사용되지 않은 경우</li>
                  </ul>
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>부분 사용 시</strong>: 크레딧 일부라도 세션 예약 또는 차감에 사용된 경우 전액 환불 불가. 미사용 크레딧 일부 환불도 불가합니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>기관(Organization) 일괄 구매 크레딧</strong>: 기관이 대량 구매한 크레딧 중 소속 스타트업에 배분되지 않은 미배분 크레딧에 한하여, 구매일로부터 7일 이내 서면 요청 시 환불 검토합니다. 일부라도 배분된 크레딧은 환불 불가합니다.
                </li>
                <li>
                  크레딧 소멸(유효기간 만료)로 인한 환불은 불가합니다. 회사는 소멸 30일 전 이메일로 사전 고지합니다.
                </li>
              </ol>
            </Section>

            {/* 2. 세션 취소 환불 기준표 */}
            <Section title="2. 세션 취소 및 크레딧 반환 기준">
              <p style={{ marginBottom: "16px" }}>
                세션 예약 시 해당 크레딧이 선(先)차감됩니다. 취소 시점에 따라 아래 기준으로 크레딧이 반환됩니다.
              </p>

              {/* 기준표 */}
              <div
                style={{
                  overflowX: "auto",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: "20px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>취소 시점</th>
                      <th style={thStyle}>크레딧 반환율</th>
                      <th style={thStyle}>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={tdStyle}>세션 시작 24시간 초과 전 취소</td>
                      <td style={{ ...tdStyle, color: "#4ade80", fontWeight: 600 }}>100% 반환</td>
                      <td style={tdStyle}>차감 크레딧 전액 즉시 복원</td>
                    </tr>
                    <tr>
                      <td style={tdStyle}>세션 시작 12시간 초과~24시간 이내 취소</td>
                      <td style={{ ...tdStyle, color: "#facc15", fontWeight: 600 }}>50% 반환</td>
                      <td style={tdStyle}>차감 크레딧의 절반 반환 (소수점 반올림)</td>
                    </tr>
                    <tr>
                      <td style={tdStyle}>세션 시작 12시간 이내 취소</td>
                      <td style={{ ...tdStyle, color: "#f87171", fontWeight: 600 }}>반환 없음</td>
                      <td style={tdStyle}>—</td>
                    </tr>
                    <tr>
                      <td style={{ ...tdStyle, borderBottom: "none" }}>No-show (무단 불참)</td>
                      <td style={{ ...tdStyle, borderBottom: "none", color: "#f87171", fontWeight: 600 }}>반환 없음</td>
                      <td style={{ ...tdStyle, borderBottom: "none" }}>Startup·Enabler 양측 모두 적용</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ol>
                <li>취소 기준 시각은 서버 기준 UTC+9(한국 표준시, KST)를 따릅니다.</li>
                <li>Chemistry Call(무료)은 크레딧 차감이 없으므로 취소에 따른 크레딧 변동이 없습니다.</li>
                <li>Project Session은 크레딧 수량이 협의에 따라 결정되므로 취소 환불 조건은 개별 계약서를 우선합니다.</li>
              </ol>
            </Section>

            {/* 3. 기술적 문제로 인한 환불 */}
            <Section title="3. 기술적 문제로 인한 환불">
              <ol>
                <li>
                  세션 진행 중 아래 사유로 세션이 정상 완료되지 못한 경우, 회사는 차감 크레딧 전액을 반환하고 재매칭을 지원합니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>회사 서버 또는 API 장애</li>
                    <li>화상 플랫폼(Daily.co, Zoom 등) 서비스 장애 — 단, 개인 네트워크 문제는 제외</li>
                    <li>결제 시스템 오류로 크레딧 이중 차감</li>
                  </ul>
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>신청 방법</strong>: 세션 종료 후 24시간 이내에 support@getitdonework.com로 아래 정보를 포함하여 신청합니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>세션 ID 및 예약 일시</li>
                    <li>발생한 문제 내용 및 스크린샷(가능한 경우)</li>
                    <li>오류 발생 시각</li>
                  </ul>
                </li>
                <li>회사는 접수 후 영업일 기준 3일 이내에 검토하여 결과를 통보합니다.</li>
                <li>이용자 본인의 네트워크·기기 문제로 인한 세션 중단은 회사 귀책으로 인정되지 않으며, 크레딧 반환 대상이 아닙니다.</li>
              </ol>
            </Section>

            {/* 4. Enabler 귀책 사유 환불 */}
            <Section title="4. Enabler 귀책 사유로 인한 환불">
              <ol>
                <li>
                  다음에 해당하는 Enabler 귀책 사유가 확인된 경우, 운영팀 검토 후 크레딧 전액 반환 또는 재매칭을 지원합니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>Enabler의 무단 불참(No-show)</li>
                    <li>Enabler의 일방적 취소(세션 시작 24시간 이내 취소)</li>
                    <li>세션 내 명백한 딜리버리(deliverable) 실패: 약속된 주제·형식을 현저히 이탈하거나 성실 의무를 위반한 경우</li>
                    <li>Enabler의 부적절한 언행, 행동 강령(Code of Conduct) 중대 위반</li>
                  </ul>
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>신고 절차</strong>:
                  <ol style={{ marginTop: "8px" }}>
                    <li>세션 종료 후 48시간 이내에 support@getitdonework.com로 신고</li>
                    <li>신고 내용: 세션 ID, 문제 상황 설명, 증빙 자료(채팅 캡처, 세션 메모 등)</li>
                    <li>운영팀이 영업일 기준 5일 이내 양측 의견 청취 및 검토</li>
                    <li>귀책 인정 시 크레딧 전액 반환 + Enabler 계정 경고 또는 정지 조치</li>
                  </ol>
                </li>
                <li>단순 기대 불일치(세션 내용이 기대보다 아쉬웠던 경우 등)는 Enabler 귀책 사유로 인정되지 않습니다.</li>
              </ol>
            </Section>

            {/* 5. 환불 신청 방법 및 처리 기간 */}
            <Section title="5. 환불 신청 방법 및 처리 기간">
              <ol>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>신청 방법</strong>: 아래 방법 중 하나로 환불을 신청합니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>이메일: support@getitdonework.com (제목: [환불신청] 계정 이메일 + 사유)</li>
                    <li>서비스 내 고객 지원 채팅 (예정)</li>
                  </ul>
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>처리 기간</strong>:
                  <ul style={{ marginTop: "8px" }}>
                    <li>환불 요청 검토 및 승인: 영업일 기준 1~3일</li>
                    <li>크레딧 반환: 승인 즉시 계정 크레딧에 반영</li>
                    <li>현금 환불(구매 취소): 영업일 기준 5~7일 (결제 수단에 따라 상이)</li>
                  </ul>
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>환불 수단</strong>: 원칙적으로 결제에 사용한 수단과 동일한 방법으로 환불됩니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>법인카드(토스페이먼츠): 카드 취소 처리 → 카드사 영업일 기준 3~5일 소요</li>
                    <li>PayPal: PayPal 환불 처리 → 계정 잔액 즉시 반영 또는 카드 환급 3~7 영업일 소요</li>
                  </ul>
                </li>
              </ol>
            </Section>

            {/* 6. 해외 결제(PayPal) 환불 */}
            <Section title="6. 해외 결제(PayPal) 환불 안내">
              <ol>
                <li>PayPal을 통한 결제 환불은 PayPal 정책에 따라 처리되며, 환율 변동으로 인한 차액은 회사가 책임지지 않습니다.</li>
                <li>PayPal 환불은 USD 기준으로 처리되며, 원화 환산 금액은 환불 시점의 환율에 따라 달라질 수 있습니다.</li>
                <li>PayPal 계정 미보유 또는 계정 문제로 인한 환불 지연은 이용자 본인이 PayPal에 직접 문의해야 하며, 회사는 이에 대한 책임을 부담하지 않습니다.</li>
                <li>PayPal 환불 수수료(있는 경우)는 이용자 부담으로 적용될 수 있습니다.</li>
              </ol>
            </Section>

            {/* 7. 기관 일괄 환불 */}
            <Section title="7. 기관(Organization) 일괄 환불">
              <ol>
                <li>
                  기관이 대량 구매한 크레딧의 환불은 아래 조건에 한하여 가능합니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li>소속 스타트업에 <strong style={{ color: "var(--color-text)" }}>배분되지 않은 미배분 크레딧</strong>에 한하여 환불 가능</li>
                    <li>구매일로부터 7일(영업일) 이내 서면(이메일) 요청</li>
                    <li>배분된 크레딧 또는 이미 세션에 사용된 크레딧은 환불 불가</li>
                  </ul>
                </li>
                <li>기관 환불 신청은 기관 관리자(Organization Admin) 명의로만 접수 가능합니다.</li>
                <li>기관 계약에 별도 환불 조항이 있는 경우 해당 계약 조항이 우선 적용됩니다.</li>
                <li>기관 환불 신청: enterprise@getitdonework.com (제목: [기관환불신청] 기관명 + 구매 일자)</li>
              </ol>
            </Section>

            {/* 8. 공통 유의사항 */}
            <Section title="8. 공통 유의사항">
              <ol>
                <li>환불은 이용약관 및 본 환불정책에 정한 사유에 해당하는 경우에만 가능합니다.</li>
                <li>환불 결정에 이의가 있는 경우, 결과 통보 후 14일 이내에 이의를 제기할 수 있습니다.</li>
                <li>소비자분쟁해결기준(공정거래위원회 고시) 등 소비자 보호 관련 강행 규정은 본 정책과 무관하게 우선 적용됩니다.</li>
                <li>크레딧은 현금 또는 다른 결제 수단으로 교환할 수 없으며, 미사용 크레딧에 대한 이자는 발생하지 않습니다.</li>
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

// ─── Shared Styles ────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  color: "var(--color-text)",
  fontWeight: 600,
  backgroundColor: "rgba(255,255,255,0.05)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  whiteSpace: "nowrap",
  fontSize: "13.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  color: "var(--color-dim)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  verticalAlign: "top",
  fontSize: "13.5px",
};

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
      {children}
    </section>
  );
}
