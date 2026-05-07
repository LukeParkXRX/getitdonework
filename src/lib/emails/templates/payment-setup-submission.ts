import { baseEmail, textStyles, infoCard, highlightBox } from "./_layout";
import type { EmailPayload } from "./welcome";

export type PaymentSetupPackage = {
  name: string;
  tokens: number | string;
  priceKrw: number | string;
};

export type PaymentSetupSubmissionInput = {
  submittedAt: string;

  submitterName: string;
  submitterEmail: string;

  bizRegNumber: string;
  bizName: string;
  representativeName: string;
  representativeBirth: string;
  bizAddress: string;
  bizPhone: string;
  bizEmail: string;
  isCorporation: boolean;
  corporationDetails: string;

  bankName: string;
  accountNumber: string;
  accountHolder: string;
  swiftCode: string;

  serviceDescription: string;
  customerSupportEmail: string;

  paymentMethods: string[];

  autoApprovalThresholdKrw: string;
  approvalExpirationDays: string;

  refundDays: string;
  partialRefund: string;
  cancelWithin24hPercent: string;
  refundProcessingDays: string;

  packages: PaymentSetupPackage[];

  taxpayerType: string;
  vatDisplay: string;
  useStripeTax: string;

  invoiceLanguage: string;

  tokenUsdRate: string;
  platformFeePct: string;
  hasEnablerTiers: string;
  enablerTierDetails: string;
  minPayoutUsd: string;

  taxAdvisorNotes: string;
  additionalNotes: string;
};

const yesNo = (v: boolean | string) =>
  typeof v === "boolean" ? (v ? "예" : "아니오") : v || "(미입력)";
const safe = (v: string) => (v && v.trim() ? v : "(미입력)");

export function paymentSetupSubmissionEmail(
  input: PaymentSetupSubmissionInput
): EmailPayload<PaymentSetupSubmissionInput> {
  const subject = `[결제 셋업 정보 도착] ${input.bizName || input.submitterName} - ${input.submittedAt}`;

  const section1 = infoCard([
    { label: "제출자", value: `${safe(input.submitterName)} (${safe(input.submitterEmail)})` },
    { label: "사업자등록번호", value: safe(input.bizRegNumber) },
    { label: "사업자명", value: safe(input.bizName) },
    { label: "대표자", value: safe(input.representativeName) },
    { label: "대표자 생년월일", value: safe(input.representativeBirth) },
    { label: "사업장 주소", value: safe(input.bizAddress) },
    { label: "전화", value: safe(input.bizPhone) },
    { label: "이메일", value: safe(input.bizEmail) },
    { label: "법인 여부", value: yesNo(input.isCorporation) },
    ...(input.isCorporation && input.corporationDetails
      ? [{ label: "법인 상세", value: input.corporationDetails }]
      : []),
  ]);

  const section2 = infoCard([
    { label: "은행명", value: safe(input.bankName) },
    { label: "계좌번호", value: safe(input.accountNumber) },
    { label: "예금주명", value: safe(input.accountHolder) },
    { label: "SWIFT 코드", value: safe(input.swiftCode) },
  ]);

  const section3 = infoCard([
    { label: "서비스 한 줄 설명", value: safe(input.serviceDescription) },
    { label: "고객센터 이메일", value: safe(input.customerSupportEmail) },
  ]);

  const methodLabels: Record<string, string> = {
    card: "신용/체크카드",
    virtual_account: "가상계좌",
    kakaopay: "KakaoPay",
    tosspay: "Toss Pay",
  };
  const methodsText =
    input.paymentMethods && input.paymentMethods.length > 0
      ? input.paymentMethods.map((m) => methodLabels[m] || m).join(", ")
      : "(미선택)";

  const section4_5 = infoCard([
    { label: "활성화 결제수단", value: methodsText },
    {
      label: "자동승인 임계 금액",
      value: input.autoApprovalThresholdKrw
        ? `${input.autoApprovalThresholdKrw} KRW`
        : "(미입력)",
    },
    {
      label: "승인 만료 시간",
      value: input.approvalExpirationDays ? `${input.approvalExpirationDays}일` : "(미입력)",
    },
  ]);

  const section6 = infoCard([
    { label: "미사용 토큰 환불 기간", value: input.refundDays ? `${input.refundDays}일` : "(미입력)" },
    {
      label: "부분 환불 정책",
      value:
        input.partialRefund === "proportional"
          ? "사용 안 한 토큰만큼 비례 환불"
          : input.partialRefund === "no_refund"
            ? "환불 불가"
            : "(미선택)",
    },
    {
      label: "24시간 이내 취소 환불률",
      value: input.cancelWithin24hPercent ? `${input.cancelWithin24hPercent}%` : "(미입력)",
    },
    {
      label: "환불 처리 영업일",
      value: input.refundProcessingDays ? `${input.refundProcessingDays}일` : "(미입력)",
    },
  ]);

  const packagesHtml =
    input.packages && input.packages.length > 0
      ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin: 12px 0;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px 12px; text-align: left; font-size: 13px; border: 1px solid #e5e7eb;">패키지명</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 13px; border: 1px solid #e5e7eb;">토큰</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 13px; border: 1px solid #e5e7eb;">KRW 가격</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 13px; border: 1px solid #e5e7eb;">1토큰당</th>
        </tr>
      </thead>
      <tbody>
        ${input.packages
          .map((p) => {
            const tokens = Number(p.tokens);
            const price = Number(p.priceKrw);
            const perToken =
              tokens > 0 && price > 0 ? Math.round(price / tokens).toLocaleString() : "-";
            return `<tr>
              <td style="padding: 8px 12px; font-size: 13px; border: 1px solid #e5e7eb;">${safe(p.name as string)}</td>
              <td style="padding: 8px 12px; text-align: right; font-size: 13px; border: 1px solid #e5e7eb;">${p.tokens || "-"}</td>
              <td style="padding: 8px 12px; text-align: right; font-size: 13px; border: 1px solid #e5e7eb;">${p.priceKrw ? Number(p.priceKrw).toLocaleString() : "-"}</td>
              <td style="padding: 8px 12px; text-align: right; font-size: 13px; border: 1px solid #e5e7eb;">${perToken}</td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `
      : `<p style="${textStyles.body}">(패키지 미입력)</p>`;

  const section8 = infoCard([
    {
      label: "사업자 형태",
      value:
        input.taxpayerType === "general"
          ? "일반과세자"
          : input.taxpayerType === "simplified"
            ? "간이과세자"
            : input.taxpayerType === "taxFree"
              ? "면세사업자"
              : "(미선택)",
    },
    {
      label: "부가세 표기",
      value:
        input.vatDisplay === "included"
          ? "가격에 부가세 포함"
          : input.vatDisplay === "separate"
            ? "결제 시 별도 추가"
            : "(미선택)",
    },
    { label: "Stripe Tax 사용", value: input.useStripeTax || "(미선택)" },
  ]);

  const section9 = infoCard([
    {
      label: "인보이스 언어",
      value:
        input.invoiceLanguage === "korean"
          ? "한국어"
          : input.invoiceLanguage === "english"
            ? "영문"
            : input.invoiceLanguage === "both"
              ? "한국어 + 영문"
              : "(미선택)",
    },
  ]);

  const section10 = infoCard([
    { label: "토큰당 USD 단가", value: input.tokenUsdRate ? `$${input.tokenUsdRate}` : "(미입력)" },
    {
      label: "플랫폼 수수료율",
      value: input.platformFeePct ? `${input.platformFeePct}%` : "(미입력)",
    },
    { label: "Enabler 등급별 차등", value: input.hasEnablerTiers || "(미선택)" },
    ...(input.hasEnablerTiers === "예" && input.enablerTierDetails
      ? [{ label: "등급별 상세", value: input.enablerTierDetails }]
      : []),
    {
      label: "최저 정산 금액",
      value: input.minPayoutUsd ? `$${input.minPayoutUsd}` : "(미입력)",
    },
  ]);

  const freeTextBlock = (label: string, value: string) => `
    <h2 style="${textStyles.h2}">${label}</h2>
    <p style="${textStyles.body}; background-color: #f9fafb; border-radius: 8px; padding: 14px 18px; font-size: 14px; color: #374151; white-space: pre-wrap;">
      ${safe(value)}
    </p>
  `;

  const children = `
    <h1 style="${textStyles.h1}">결제 셋업 정보가 도착했습니다.</h1>
    <p style="${textStyles.body}">
      운영자가 <strong>/payment-setup</strong> 페이지를 통해 정보를 제출했습니다.
      아래 내용을 검토하고 개발에 반영하세요.
    </p>

    <h2 style="${textStyles.h2}">1. 사업자 정보</h2>
    ${section1}

    <h2 style="${textStyles.h2}">2. 정산 받을 계좌 (KRW)</h2>
    ${section2}

    <h2 style="${textStyles.h2}">3. 사이트·서비스 정보</h2>
    ${section3}

    <h2 style="${textStyles.h2}">4-5. 결제 수단 및 임계</h2>
    ${section4_5}

    <h2 style="${textStyles.h2}">6. 환불 정책</h2>
    ${section6}

    <h2 style="${textStyles.h2}">7. 토큰 패키지 가격</h2>
    ${packagesHtml}

    <h2 style="${textStyles.h2}">8. 부가세</h2>
    ${section8}

    <h2 style="${textStyles.h2}">9. 영수증·인보이스</h2>
    ${section9}

    <h2 style="${textStyles.h2}">10. Enabler 정산 단가</h2>
    ${section10}

    ${freeTextBlock("11. 세무 상담 결과", input.taxAdvisorNotes)}
    ${freeTextBlock("12. 추가 메모", input.additionalNotes)}

    ${highlightBox(
      `회신: <strong>${safe(input.submitterEmail)}</strong> 로 직접 회신하면 됩니다.`
    )}
  `;

  const html = baseEmail({
    preheader: `${input.bizName || input.submitterName}님이 결제 셋업 정보를 제출했습니다.`,
    title: subject,
    children,
  });

  const text = `
[결제 셋업 정보 도착]
제출 시각: ${input.submittedAt}
제출자: ${safe(input.submitterName)} (${safe(input.submitterEmail)})

▼ 사업자 정보
- 등록번호: ${safe(input.bizRegNumber)}
- 사업자명: ${safe(input.bizName)}
- 대표자: ${safe(input.representativeName)} (생년월일: ${safe(input.representativeBirth)})
- 주소: ${safe(input.bizAddress)}
- 연락처: ${safe(input.bizPhone)} / ${safe(input.bizEmail)}
- 법인 여부: ${yesNo(input.isCorporation)}
${input.isCorporation && input.corporationDetails ? `- 법인 상세: ${input.corporationDetails}` : ""}

▼ 정산 계좌
- 은행: ${safe(input.bankName)} / 계좌: ${safe(input.accountNumber)} / 예금주: ${safe(input.accountHolder)} / SWIFT: ${safe(input.swiftCode)}

▼ 서비스
- ${safe(input.serviceDescription)}
- 고객센터: ${safe(input.customerSupportEmail)}

▼ 결제 수단·임계
- 활성화: ${methodsText}
- 자동승인 임계: ${input.autoApprovalThresholdKrw || "(미입력)"} KRW
- 승인 만료: ${input.approvalExpirationDays || "(미입력)"}일

▼ 환불 정책
- 미사용 환불 기간: ${input.refundDays || "(미입력)"}일
- 부분 환불: ${input.partialRefund || "(미선택)"}
- 24h 이내 취소 환불률: ${input.cancelWithin24hPercent || "(미입력)"}%
- 환불 처리 영업일: ${input.refundProcessingDays || "(미입력)"}일

▼ 토큰 패키지
${
  input.packages && input.packages.length > 0
    ? input.packages
        .map(
          (p) =>
            `- ${p.name || "(이름 없음)"}: ${p.tokens || "-"} 토큰 / ${p.priceKrw ? Number(p.priceKrw).toLocaleString() : "-"} KRW`
        )
        .join("\n")
    : "(미입력)"
}

▼ 부가세
- 사업자 형태: ${input.taxpayerType || "(미선택)"}
- 부가세 표기: ${input.vatDisplay || "(미선택)"}
- Stripe Tax: ${input.useStripeTax || "(미선택)"}

▼ 영수증
- 인보이스 언어: ${input.invoiceLanguage || "(미선택)"}

▼ Enabler 정산
- 토큰당 USD: $${input.tokenUsdRate || "?"}
- 플랫폼 수수료: ${input.platformFeePct || "?"}%
- 등급 차등: ${input.hasEnablerTiers || "(미선택)"}
${input.hasEnablerTiers === "예" && input.enablerTierDetails ? `  ${input.enablerTierDetails}` : ""}
- 최저 정산: $${input.minPayoutUsd || "?"}

▼ 세무 상담 결과
${safe(input.taxAdvisorNotes)}

▼ 추가 메모
${safe(input.additionalNotes)}

회신: ${safe(input.submitterEmail)}

---
Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
