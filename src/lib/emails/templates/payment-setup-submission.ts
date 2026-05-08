import { baseEmail, textStyles, infoCard, highlightBox } from "./_layout";
import type { EmailPayload } from "./welcome";

export type PaymentSetupSubmissionInput = {
  submittedAt: string;

  submitterName: string;
  submitterEmail: string;
  companyName: string;
  representativeName: string;
  companyAddress: string;
  contactEmail: string;

  taxFormType: string;
  hasUsBankAccount: string;
  bankInfo: string;
  stripeConnectStatus: string;

  tokenUsdRate: string;
  platformFeePct: string;

  refundDays: string;

  additionalNotes: string;
};

// kept for back-compat with older imports — no longer used in current form
export type PaymentSetupPackage = {
  name: string;
  tokens: number | string;
  priceKrw: number | string;
};

const safe = (v: string) => (v && v.trim() ? v : "(미입력)");

export function paymentSetupSubmissionEmail(
  input: PaymentSetupSubmissionInput
): EmailPayload<PaymentSetupSubmissionInput> {
  const subject = `[결제 셋업 정보 도착] ${input.companyName || input.submitterName} - ${input.submittedAt}`;

  const section1 = infoCard([
    { label: "제출자", value: `${safe(input.submitterName)} (${safe(input.submitterEmail)})` },
    { label: "회사명 (US)", value: safe(input.companyName) },
    { label: "대표자", value: safe(input.representativeName) },
    { label: "회사 대표 이메일", value: safe(input.contactEmail) },
    { label: "회사 주소", value: safe(input.companyAddress) },
  ]);

  const section2 = infoCard([
    { label: "Stripe Connect 진행 상황", value: safe(input.stripeConnectStatus) },
    { label: "제출할 세금 양식", value: safe(input.taxFormType) },
    { label: "미국 은행 계좌 보유", value: safe(input.hasUsBankAccount) },
    { label: "은행 정보 메모", value: safe(input.bankInfo) },
  ]);

  const section3 = infoCard([
    {
      label: "토큰당 USD 단가",
      value: input.tokenUsdRate ? `$${input.tokenUsdRate}` : "(미입력)",
    },
    {
      label: "플랫폼 수수료율",
      value: input.platformFeePct ? `${input.platformFeePct}%` : "(미입력)",
    },
  ]);

  const section4 = infoCard([
    {
      label: "미사용 토큰 환불 가능 기간",
      value: input.refundDays ? `${input.refundDays}일` : "(미입력)",
    },
  ]);

  const additional = input.additionalNotes && input.additionalNotes.trim()
    ? `
    <h2 style="${textStyles.h2}">5. 추가 메모</h2>
    <p style="${textStyles.body}; background-color: #f9fafb; border-radius: 8px; padding: 14px 18px; font-size: 14px; color: #374151; white-space: pre-wrap;">
      ${input.additionalNotes}
    </p>
  `
    : "";

  const children = `
    <h1 style="${textStyles.h1}">결제 셋업 정보가 도착했습니다.</h1>
    <p style="${textStyles.body}">
      <strong>${safe(input.submitterName)}</strong>님이
      <strong>/payment-setup</strong> 페이지에 정보를 제출했습니다.
    </p>

    <h2 style="${textStyles.h2}">1. 본인·연락 정보</h2>
    ${section1}

    <h2 style="${textStyles.h2}">2. USD 정산 받을 방법</h2>
    ${section2}

    <h2 style="${textStyles.h2}">3. 정산 단가 정책 (USD)</h2>
    ${section3}

    <h2 style="${textStyles.h2}">4. 환불 정책</h2>
    ${section4}

    ${additional}

    ${highlightBox(
      `회신: <strong>${safe(input.submitterEmail)}</strong> 로 직접 회신`
    )}
  `;

  const html = baseEmail({
    preheader: `${safe(input.companyName) || safe(input.submitterName)}님이 결제 셋업 정보를 제출했습니다.`,
    title: subject,
    children,
  });

  const text = `
[결제 셋업 정보 도착]
제출 시각: ${input.submittedAt}
제출자: ${safe(input.submitterName)} (${safe(input.submitterEmail)})

▼ 본인·연락 정보
- 회사명 (US): ${safe(input.companyName)}
- 대표자: ${safe(input.representativeName)}
- 회사 이메일: ${safe(input.contactEmail)}
- 회사 주소: ${safe(input.companyAddress)}

▼ USD 정산 받을 방법
- Stripe Connect 진행: ${safe(input.stripeConnectStatus)}
- 세금 양식: ${safe(input.taxFormType)}
- 미국 은행 계좌: ${safe(input.hasUsBankAccount)}
- 은행 정보 메모: ${safe(input.bankInfo)}

▼ 정산 단가 정책
- 토큰당 USD: $${input.tokenUsdRate || "(미입력)"}
- 플랫폼 수수료: ${input.platformFeePct || "(미입력)"}%

▼ 환불 정책
- 미사용 환불 기간: ${input.refundDays || "(미입력)"}일

▼ 추가 메모
${safe(input.additionalNotes)}

회신: ${safe(input.submitterEmail)}

---
Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
