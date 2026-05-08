import { baseEmail, textStyles, infoCard } from "./_layout";
import type { EmailPayload } from "./welcome";

export type PayoutCompletedInput = {
  enablerName: string;
  invoiceNumber: string;
  periodStart: string;   // "2025-04-01"
  periodEnd: string;     // "2025-04-30"
  amountUsd: number;
  transferId: string;    // tr_...
};

export function payoutCompletedEmail(
  input: PayoutCompletedInput
): EmailPayload<PayoutCompletedInput> {
  const { enablerName, invoiceNumber, periodStart, periodEnd, amountUsd, transferId } = input;

  const subject = `정산 완료 — ${invoiceNumber} ($${amountUsd})`;

  const children = `
    <h1 style="${textStyles.h1}">정산이 완료되었습니다.</h1>

    <p style="${textStyles.body}">
      ${enablerName}님, 아래 인보이스에 대한 정산 송금이 완료되었습니다.
    </p>

    ${infoCard([
      { label: "인보이스 번호", value: invoiceNumber },
      { label: "정산 기간", value: `${periodStart} ~ ${periodEnd}` },
      { label: "정산 금액", value: `$${amountUsd} USD` },
      { label: "Transfer ID", value: transferId },
    ])}

    <p style="${textStyles.body}">
      미국 은행 계좌로의 입금은 일반적으로 <strong>1~2 영업일</strong> 내에 처리됩니다.
      입금이 확인되지 않으면 Transfer ID를 참고하여 문의해주세요.
    </p>

    <p style="${textStyles.body}">
      정산 내역은 Enabler 대시보드에서도 확인하실 수 있습니다.
    </p>
  `;

  const html = baseEmail({
    preheader: `${invoiceNumber} — $${amountUsd} 정산이 완료되었습니다.`,
    title: subject,
    children,
    ctaButton: {
      label: "정산 내역 확인",
      href: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://getitdonework.com"}/enabler-dashboard/earnings`,
    },
  });

  const text = `
정산 완료 — ${invoiceNumber}

${enablerName}님, 정산 송금이 완료되었습니다.

인보이스 번호: ${invoiceNumber}
정산 기간: ${periodStart} ~ ${periodEnd}
정산 금액: $${amountUsd} USD
Transfer ID: ${transferId}

미국 은행 계좌 입금은 1~2 영업일 내에 처리됩니다.

정산 내역 확인: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://getitdonework.com"}/enabler-dashboard/earnings

---
Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
