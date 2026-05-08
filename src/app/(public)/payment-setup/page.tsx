import type { Metadata } from "next";
import PaymentSetupForm from "./PaymentSetupForm";

export const metadata: Metadata = {
  title: "결제 셋업 정보 입력",
  description: "Get It Done at Work 결제·정산 시스템 도입을 위한 정보 입력 폼",
  robots: { index: false, follow: false, nocache: true },
};

const cardCls =
  "rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5 sm:p-6";
const cardTitleCls = "mb-1 text-base font-semibold text-neutral-50";
const cardHintCls = "mb-4 text-sm text-neutral-400";
const tableTh =
  "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800";
const tableTd =
  "px-3 py-2 text-sm text-neutral-200 border-b border-neutral-800/60";
const codeChip =
  "rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[12px] text-neutral-200";

export default function PaymentSetupPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <header className="mb-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--color-accent)]">
          Internal · Payment Setup
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">
          결제 셋업 정보 입력
        </h1>
        <p className="text-base leading-relaxed text-neutral-300">
          Get It Done at Work에 결제(Stripe)와 정산(Stripe Connect)을
          붙이려면 미국 회사 측이 Stripe 계정을 만들고 우리(개발팀)에게
          몇 가지 정보를 전달해주셔야 합니다. 아래 가이드를 따라
          진행하시고 마지막 폼을 제출해주세요.
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          예상 소요 시간 — Stripe 가입 1~2주 / 폼 작성 5분 / 키 전달 별도.
        </p>
      </header>

      {/* ───────────── 가이드 영역 ───────────── */}
      <section className="mb-12 space-y-6">
        <div className="rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold text-neutral-50">
            📋 미국 회사가 진행할 일 (요약)
          </h2>
          <ol className="ml-5 list-decimal space-y-2 text-sm text-neutral-200">
            <li>
              <strong>Stripe 가맹</strong> 신청 (Standard 계정) —
              미국 EIN·은행·주소 필요
            </li>
            <li>
              <strong>Stripe Connect</strong> 활성화 신청 — Enabler 정산용
            </li>
            <li>
              <strong>Webhook 엔드포인트</strong> 등록 — 우리 사이트에
              결제 결과 알림
            </li>
            <li>
              <strong>도메인 인증</strong> — Apple Pay 등 결제수단 활성화
            </li>
            <li>
              <strong>결제수단·정산·세금 양식</strong> 설정 — Connect 화면
            </li>
            <li>
              <strong>API 키와 Account ID</strong> 를 안전 채널로
              개발자(Luke)에게 전달
            </li>
            <li>
              <strong>아래 폼 제출</strong> — 사업적 결정사항(USD 단가,
              수수료, 환불 정책) 정리해 보냄
            </li>
          </ol>
        </div>

        {/* 1. API 키 & ID */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>1. API 키 &amp; ID — 개발팀에게 줘야 할 것</h2>
          <p className={cardHintCls}>
            가장 중요한 부분. 결제 코드 통합에 필수. 보안상 이 폼이 아닌
            <strong> 별도 안전 채널</strong>로 전달하세요 (가장 권장:
            1Password Shared Vault 또는 Vercel collaborator 권한).
          </p>
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-900/60">
                  <th className={tableTh}>항목</th>
                  <th className={tableTh}>형식</th>
                  <th className={tableTh}>위치</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tableTd}>Live Secret Key</td>
                  <td className={tableTd}>
                    <code className={codeChip}>sk_live_…</code>
                  </td>
                  <td className={tableTd}>Developers › API keys</td>
                </tr>
                <tr>
                  <td className={tableTd}>Live Publishable Key</td>
                  <td className={tableTd}>
                    <code className={codeChip}>pk_live_…</code>
                  </td>
                  <td className={tableTd}>같은 위치</td>
                </tr>
                <tr>
                  <td className={tableTd}>Test Secret Key</td>
                  <td className={tableTd}>
                    <code className={codeChip}>sk_test_…</code>
                  </td>
                  <td className={tableTd}>같은 위치 (개발용 필수)</td>
                </tr>
                <tr>
                  <td className={tableTd}>Test Publishable Key</td>
                  <td className={tableTd}>
                    <code className={codeChip}>pk_test_…</code>
                  </td>
                  <td className={tableTd}>같은 위치</td>
                </tr>
                <tr>
                  <td className={tableTd}>Webhook Signing Secret</td>
                  <td className={tableTd}>
                    <code className={codeChip}>whsec_…</code>
                  </td>
                  <td className={tableTd}>Webhook 엔드포인트 추가 후</td>
                </tr>
                <tr>
                  <td className={tableTd}>Connect Platform Account ID</td>
                  <td className={tableTd}>
                    <code className={codeChip}>acct_…</code>
                  </td>
                  <td className={tableTd}>Connect 활성화 후 자동 발급</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Webhook 등록 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>2. Webhook 엔드포인트 등록</h2>
          <p className={cardHintCls}>
            Stripe 대시보드 → Developers → Webhooks → Add endpoint
          </p>
          <p className="mb-2 text-sm text-neutral-300">
            <strong>URL</strong>:{" "}
            <code className={codeChip}>
              https://getitdonework.com/api/webhooks/stripe
            </code>
          </p>
          <p className="mb-2 text-sm text-neutral-300">
            <strong>구독할 이벤트 (필수)</strong>:
          </p>
          <ul className="ml-5 list-disc space-y-1 text-sm text-neutral-200">
            <li>
              <code className={codeChip}>checkout.session.completed</code>
            </li>
            <li>
              <code className={codeChip}>payment_intent.succeeded</code>
            </li>
            <li>
              <code className={codeChip}>payment_intent.payment_failed</code>
            </li>
            <li>
              <code className={codeChip}>charge.refunded</code>
            </li>
            <li>
              <code className={codeChip}>account.updated</code> (Connect)
            </li>
            <li>
              <code className={codeChip}>transfer.created</code> /{" "}
              <code className={codeChip}>transfer.failed</code>
            </li>
          </ul>
          <p className="mt-3 text-sm text-neutral-400">
            등록 후 <strong>Signing Secret</strong> 이 발급됩니다 — 위
            1번 표의 <code className={codeChip}>whsec_…</code> 항목.
          </p>
        </div>

        {/* 3. 도메인 + 결제수단 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>3. 도메인 인증 &amp; 결제수단 활성화</h2>
          <p className={cardHintCls}>
            Stripe 대시보드 → Settings → Payment methods
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-neutral-200">
            <li>
              도메인 등록:{" "}
              <code className={codeChip}>getitdonework.com</code>
            </li>
            <li>
              <strong>카드</strong>는 자동 활성. Visa/Master/AMEX 모두 OK
            </li>
            <li>
              <strong>한국 카드 결제는 자동 지원</strong> — Stripe US가
              글로벌 처리. KRW/USD 자동 환전
            </li>
            <li>
              <strong>Apple Pay / Google Pay</strong> 활성화 권장 — 도메인
              인증만 하면 즉시 가능
            </li>
            <li>
              KakaoPay/Toss는 미국 Stripe에서 미지원 (한국 Stripe 가맹
              별도 필요 — 일단 보류)
            </li>
          </ul>
        </div>

        {/* 4. Stripe Connect 셋업 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>4. Stripe Connect Platform 설정</h2>
          <p className={cardHintCls}>
            Stripe 대시보드 → Connect → Platform Settings
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-neutral-200">
            <li>
              <strong>Branding</strong>: 로고, 색상 (Enabler가 보는 onboarding 화면)
            </li>
            <li>
              <strong>Capability 활성화</strong>:{" "}
              <code className={codeChip}>transfers</code>,{" "}
              <code className={codeChip}>card_payments</code>
            </li>
            <li>
              <strong>세금 양식 자동 수집</strong>: W-9 (US person) /
              W-8BEN (외국인) — Connect가 자동 처리
            </li>
            <li>
              <strong>1099-NEC 자동 발행</strong>: 미국 Enabler 연 $600
              초과 시 IRS에 자동 보고
            </li>
          </ul>
        </div>

        {/* 5. 발신 이메일 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>5. 발신 이메일 인증 (선택)</h2>
          <p className={cardHintCls}>
            Stripe가 보내는 영수증·환불 알림 메일 발신 도메인
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-neutral-200">
            <li>
              From 주소 설정 (예:{" "}
              <code className={codeChip}>noreply@getitdonework.com</code>)
            </li>
            <li>
              Stripe가 발급한 DKIM/SPF DNS 레코드를 우리에게 전달 → 우리가
              도메인 DNS에 추가
            </li>
          </ul>
        </div>

        {/* 6. 개발팀 권한 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>6. 개발팀 접근 권한 (둘 중 하나)</h2>
          <div className="space-y-3 text-sm text-neutral-200">
            <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-3">
              <p className="font-semibold text-emerald-300">
                옵션 A. Team Member 추가 (권장 ⭐)
              </p>
              <p className="mt-1 text-neutral-300">
                개발자 이메일을 Team에 초대 (권한:{" "}
                <code className={codeChip}>Developer</code>). 디버깅과
                webhook 로그 확인이 훨씬 빠릅니다.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-3">
              <p className="font-semibold text-neutral-200">
                옵션 B. Restricted API Key 별도 발급
              </p>
              <p className="mt-1 text-neutral-300">
                보안 우선 시. 환불·refund 등 제한된 권한만 가진 키 발급해
                전달. 단점: Stripe 대시보드 직접 접근 불가.
              </p>
            </div>
          </div>
        </div>

        {/* 7. 보안 전달 채널 */}
        <div className="rounded-2xl border border-amber-700/40 bg-amber-950/20 p-5 sm:p-6">
          <h2 className="mb-2 text-base font-semibold text-amber-300">
            🔐 키 전달 — 안전 채널 사용 필수
          </h2>
          <p className="mb-3 text-sm text-neutral-200">
            API Key는 결제 권한 그 자체입니다. 평문 이메일·슬랙·노션
            절대 금지. 아래 셋 중 하나로 전달:
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-neutral-200">
            <li>
              <strong>1Password Shared Vault</strong> — 가장 권장
            </li>
            <li>
              <strong>Vercel Collaborator 추가</strong> — 미국 파트너가
              우리 Vercel 프로젝트에 collaborator로 들어와서 환경변수에
              직접 입력 (개발자가 평문으로 보지 않음)
            </li>
            <li>
              <strong>Bitwarden Send</strong> 또는{" "}
              <strong>Signal</strong> — 일회성 암호화 메시지
            </li>
          </ul>
        </div>

        {/* 8. 우선순위 타임라인 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>📅 진행 타임라인</h2>
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-900/60">
                  <th className={tableTh}>주차</th>
                  <th className={tableTh}>미국 회사</th>
                  <th className={tableTh}>개발팀 (Luke)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tableTd}>1주차</td>
                  <td className={tableTd}>Stripe 가맹 신청 + 심사 통과</td>
                  <td className={tableTd}>코드 베이스 작성 (테스트 키로)</td>
                </tr>
                <tr>
                  <td className={tableTd}>1~2주차</td>
                  <td className={tableTd}>
                    Connect 활성화 + Webhook 등록 + 도메인 인증
                  </td>
                  <td className={tableTd}>DB 스키마 + API route</td>
                </tr>
                <tr>
                  <td className={tableTd}>2주차</td>
                  <td className={tableTd}>
                    Test Keys + Webhook Secret 전달 (안전 채널)
                  </td>
                  <td className={tableTd}>통합 테스트</td>
                </tr>
                <tr>
                  <td className={tableTd}>3주차</td>
                  <td className={tableTd}>Live Keys 전달</td>
                  <td className={tableTd}>라이브 전환 + 모니터링</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───────────── 폼 영역 ───────────── */}
      <div className="mb-6 border-t border-neutral-800 pt-10">
        <h2 className="mb-2 text-2xl font-bold text-neutral-50">
          📝 사업 결정사항 입력
        </h2>
        <p className="text-sm text-neutral-400">
          위 가이드와 별개로, 아래 5가지는 폼으로 보내주세요.
          (API 키나 신분증 같은 민감 정보는 절대 여기 입력하지 마세요)
        </p>
      </div>
      <PaymentSetupForm />
    </main>
  );
}
