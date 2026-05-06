import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "Get It Done at Work 서비스 이용자의 개인정보 수집, 이용, 보관, 제3자 제공에 관한 처리방침.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "개인정보처리방침 — Get It Done at Work",
    description: "Get It Done at Work 서비스 개인정보 처리방침.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
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
            본 방침은 초안이며 법무 검토 후 확정됩니다. 법적 효력 발생 전 변호사 검수 예정입니다.
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
            개인정보처리방침
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

          {/* 서문 */}
          <div
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
              fontSize: "15px",
              lineHeight: "1.8",
              marginBottom: "40px",
            }}
          >
            <p>
              Get It Done at Work(이하 "회사")은 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하며,
              이용자의 개인정보를 소중히 보호합니다. 본 방침은 회사가 수집·이용·보유·파기하는 개인정보의 처리에 관한 사항을 안내합니다.
            </p>
          </div>

          {/* 본문 */}
          <div
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
              fontSize: "15px",
              lineHeight: "1.8",
            }}
          >

            {/* 1. 수집 항목 */}
            <Section title="1. 수집하는 개인정보 항목">
              <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>

              <SubTitle>가. 공통 (모든 이용자)</SubTitle>
              <Table
                headers={["구분", "항목", "필수 여부"]}
                rows={[
                  ["필수", "이메일 주소, 이름(성명), 비밀번호(해시 저장)", "필수"],
                  ["선택", "프로필 사진, 링크드인(LinkedIn) URL, 자기소개", "선택"],
                ]}
              />

              <SubTitle>나. Startup(스타트업) 추가 수집</SubTitle>
              <Table
                headers={["구분", "항목", "필수 여부"]}
                rows={[
                  ["필수", "소속 기업명, 직책", "필수"],
                  ["선택", "사업 분야, 팀 규모, 웹사이트 URL", "선택"],
                ]}
              />

              <SubTitle>다. Enabler(멘토) 추가 수집</SubTitle>
              <Table
                headers={["구분", "항목", "필수 여부"]}
                rows={[
                  ["필수", "MBA 학교명, .edu 이메일 주소(인증용), 전공/졸업연도", "필수"],
                  ["선택", "경력 요약, 전문 분야, 가용 시간 설정", "선택"],
                  ["정산(필수)", "PayPal 이메일, W-9 또는 W-8BEN 세금 양식", "정산 시 필수"],
                ]}
              />

              <SubTitle>라. 자동 수집 정보</SubTitle>
              <ul>
                <li>IP 주소, 브라우저 유형 및 버전, 운영체제</li>
                <li>접속 일시, 서비스 이용 기록, 쿠키(Cookie) 및 세션 토큰</li>
                <li>결제 처리를 위한 거래 ID (카드 번호 등 민감 결제 정보는 토스페이먼츠·PayPal에서 직접 처리, 회사 서버 미저장)</li>
              </ul>
            </Section>

            {/* 2. 수집 목적 */}
            <Section title="2. 개인정보 수집 및 이용 목적">
              <Table
                headers={["목적", "이용 항목"]}
                rows={[
                  ["회원 가입 및 본인 확인", "이메일, 이름, 비밀번호"],
                  ["Enabler MBA 자격 인증", ".edu 이메일, 학교명, 졸업연도"],
                  ["세션 매칭 및 예약 관리", "프로필 정보, 가용 시간, 세션 이력"],
                  ["크레딧 구매 및 결제 처리", "결제 수단 정보(외부 처리), 거래 기록"],
                  ["Enabler 정산 (PayPal)", "PayPal 이메일, 세금 양식(W-9/W-8BEN)"],
                  ["고객 지원 및 분쟁 처리", "이메일, 세션 기록, 문의 내역"],
                  ["서비스 개선 및 분석", "이용 행태 데이터(익명화 처리)"],
                  ["법령 의무 이행", "거래 기록, 세금 관련 서류"],
                ]}
              />
            </Section>

            {/* 3. 보유 기간 */}
            <Section title="3. 개인정보 보유 및 이용 기간">
              <ol>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>원칙</strong>: 회원 탈퇴 시 또는 수집·이용 목적 달성 시 지체 없이 파기합니다.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>법령에 의한 보존</strong>:
                  <Table
                    headers={["항목", "보존 기간", "근거 법령"]}
                    rows={[
                      ["계약·청약 철회 기록", "5년", "전자상거래법"],
                      ["대금 결제 및 재화 공급 기록", "5년", "전자상거래법"],
                      ["소비자 불만·분쟁 처리 기록", "3년", "전자상거래법"],
                      ["세금계산서 등 세금 관련 기록", "5년", "국세기본법"],
                      ["접속 로그, IP 주소", "3개월", "통신비밀보호법"],
                    ]}
                  />
                </li>
                <li>Enabler 정산 관련 세금 양식(W-9/W-8BEN)은 미국 IRS 규정에 따라 최소 3년간 보관합니다.</li>
              </ol>
            </Section>

            {/* 4. 제3자 제공 */}
            <Section title="4. 개인정보의 제3자 제공">
              <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 아래의 경우 예외입니다.</p>
              <Table
                headers={["제공받는 자", "제공 항목", "제공 목적", "보유 기간"]}
                rows={[
                  ["토스페이먼츠", "결제 수단 정보", "국내 카드 결제 처리", "결제 완료 후 즉시 삭제"],
                  ["PayPal", "PayPal 이메일, 정산 금액", "해외 결제·Enabler 정산", "PayPal 정책에 따름"],
                  ["Daily.co / Zoom", "이름, 이메일(세션 링크 발송)", "화상 세션 서비스 연결", "세션 종료 후"],
                ]}
              />
              <p style={{ marginTop: "12px" }}>
                법령에 의한 요청(수사기관, 법원 명령 등)이 있을 경우, 관련 법령에 따라 개인정보를 제공할 수 있습니다.
              </p>
            </Section>

            {/* 5. 처리 위탁 */}
            <Section title="5. 개인정보 처리 위탁">
              <p>회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
              <Table
                headers={["수탁사", "위탁 업무", "위탁 기간"]}
                rows={[
                  ["AWS (Amazon Web Services)", "서버 인프라 운영, 데이터 저장", "서비스 제공 기간"],
                  ["Supabase Inc.", "데이터베이스 관리", "서비스 제공 기간"],
                  ["Vercel Inc.", "웹 서비스 배포 및 운영", "서비스 제공 기간"],
                  ["SendGrid / 이메일 서비스", "이메일 발송(인증, 알림)", "서비스 제공 기간"],
                ]}
              />
            </Section>

            {/* 6. 국외 이전 */}
            <Section title="6. 개인정보의 국외 이전">
              <p>
                회사는 미국 소재 Enabler와의 세션 연결 및 정산 처리를 위해 일부 개인정보가 미국 서버에 저장·처리될 수 있습니다.
                이용자는 서비스 가입 시 아래 국외 이전에 동의하는 것으로 간주됩니다.
              </p>
              <Table
                headers={["이전 국가", "이전 항목", "이전 목적", "수신자"]}
                rows={[
                  ["미국", "세션 기록, Enabler 매칭 데이터", "플랫폼 서비스 운영", "AWS (미국 리전)"],
                  ["미국", "PayPal 이메일, 정산 기록", "Enabler 정산 처리", "PayPal Inc."],
                  ["미국", "이름, 이메일(세션 링크)", "화상 세션 연결", "Daily.co / Zoom"],
                ]}
              />
              <p style={{ marginTop: "12px" }}>
                국외 이전에 동의하지 않을 경우 서비스 이용이 제한될 수 있습니다. 이전 대상 국가 및 수신자는 서비스 변경에 따라 갱신될 수 있으며, 변경 시 본 방침을 통해 고지합니다.
              </p>
            </Section>

            {/* 7. 쿠키 */}
            <Section title="7. 쿠키(Cookie) 사용">
              <ol>
                <li>회사는 서비스 운영을 위해 쿠키를 사용합니다. 쿠키는 이용자의 브라우저에 저장되는 소규모 텍스트 파일입니다.</li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>사용 목적</strong>: 로그인 상태 유지, 사용자 설정 기억, 서비스 이용 분석(익명화)
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>쿠키 거부</strong>: 브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 기능이 제한될 수 있습니다.
                </li>
                <li>제3자 분석 쿠키(Google Analytics 등)를 사용하는 경우 별도 고지합니다.</li>
              </ol>
            </Section>

            {/* 8. 이용자 권리 */}
            <Section title="8. 이용자의 권리 및 행사 방법">
              <ol>
                <li>이용자는 언제든지 다음 권리를 행사할 수 있습니다.
                  <ul style={{ marginTop: "8px" }}>
                    <li><strong style={{ color: "var(--color-text)" }}>열람권</strong>: 본인의 개인정보 처리 현황 확인</li>
                    <li><strong style={{ color: "var(--color-text)" }}>수정권</strong>: 부정확한 개인정보의 정정·보완 요청</li>
                    <li><strong style={{ color: "var(--color-text)" }}>삭제권</strong>: 법령에서 보존 의무가 없는 개인정보의 삭제 요청</li>
                    <li><strong style={{ color: "var(--color-text)" }}>처리정지권</strong>: 개인정보 처리의 일시 정지 요청</li>
                    <li><strong style={{ color: "var(--color-text)" }}>이의제기권</strong>: 자동화된 결정(알고리즘 매칭 등)에 대한 이의 제기</li>
                  </ul>
                </li>
                <li>권리 행사는 이메일(privacy@getitdonework.com) 또는 서비스 내 설정 메뉴를 통해 요청할 수 있으며, 회사는 10일 이내에 조치 결과를 통보합니다.</li>
                <li>법정 대리인은 만 14세 미만 아동의 개인정보에 대한 열람·수정·삭제를 요청할 수 있습니다. (현재 서비스는 만 19세 이상만 가입 가능)</li>
              </ol>
            </Section>

            {/* 9. 안전성 확보 조치 */}
            <Section title="9. 개인정보 안전성 확보 조치">
              <ol>
                <li><strong style={{ color: "var(--color-text)" }}>암호화</strong>: 비밀번호는 단방향 해시(bcrypt 등)로 저장. HTTPS/TLS 통신 적용.</li>
                <li><strong style={{ color: "var(--color-text)" }}>접근 통제</strong>: 개인정보 처리 시스템에 대한 접근 권한 최소화 및 정기 점검.</li>
                <li><strong style={{ color: "var(--color-text)" }}>접속 기록 관리</strong>: 개인정보 처리 시스템 접속 기록 보존 및 위변조 방지.</li>
                <li><strong style={{ color: "var(--color-text)" }}>보안 취약점 점검</strong>: 정기적인 취약점 분석 및 보안 패치 적용.</li>
                <li><strong style={{ color: "var(--color-text)" }}>내부 교육</strong>: 개인정보 취급자 대상 정기 보안 교육 실시.</li>
              </ol>
            </Section>

            {/* 10. 개인정보 보호책임자 */}
            <Section title="10. 개인정보 보호책임자">
              <p>회사는 개인정보 처리에 관한 업무를 총괄하고 이용자의 권리 보호를 위해 아래와 같이 개인정보 보호책임자를 지정합니다.</p>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "20px 24px",
                  marginTop: "12px",
                }}
              >
                <p><strong style={{ color: "var(--color-text)" }}>개인정보 보호책임자(CPO)</strong></p>
                <p>소속: Get It Done at Work 운영팀</p>
                <p>이메일: privacy@getitdonework.com</p>
                <p>문의 처리 기간: 영업일 기준 5일 이내 답변</p>
              </div>
              <p style={{ marginTop: "12px" }}>
                개인정보 침해 관련 신고·상담은 아래 기관에도 문의할 수 있습니다.
              </p>
              <ul>
                <li>개인정보분쟁조정위원회: www.kopico.go.kr / 1833-6972</li>
                <li>개인정보침해신고센터: privacy.kisa.or.kr / 118</li>
                <li>경찰청 사이버수사국: ecrm.cyber.go.kr / 182</li>
              </ul>
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
              <p>Get It Done at Work 운영팀 · privacy@getitdonework.com</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ─── Sub Components ───────────────────────────────────────────────────────────

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

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontWeight: 600,
        color: "var(--color-text)",
        marginTop: "16px",
        marginBottom: "8px",
        fontSize: "14px",
      }}
    >
      {children}
    </p>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div
      style={{
        overflowX: "auto",
        marginTop: "12px",
        marginBottom: "12px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13.5px",
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  color: "var(--color-text)",
                  fontWeight: 600,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 14px",
                    color: "var(--color-dim)",
                    borderBottom:
                      i < rows.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                    verticalAlign: "top",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
