import { baseEmail, textStyles, infoCard } from "./_layout";
import type { EmailPayload } from "./welcome";

export type PayoutCompletedInput = {
  enablerName: string;
  invoiceNumber: string;
  invoiceId: string;     // UUID (used to link to the invoice page)
  periodStart: string;   // "2025-04-01"
  periodEnd: string;     // "2025-04-30"
  amountUsd: number;
  transferId: string;    // tr_...
};

export function payoutCompletedEmail(
  input: PayoutCompletedInput
): EmailPayload<PayoutCompletedInput> {
  const { enablerName, invoiceNumber, invoiceId, periodStart, periodEnd, amountUsd, transferId } = input;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getitdonework.com";
  const invoiceUrl = `${appUrl}/admin/payouts/${invoiceId}/invoice`;

  const subject = `Payout Sent — ${invoiceNumber} ($${amountUsd})`;

  const children = `
    <h1 style="${textStyles.h1}">Your payout has been sent.</h1>

    <p style="${textStyles.body}">
      Hi ${enablerName}, the payout for the invoice below has been transferred to your account.
    </p>

    ${infoCard([
      { label: "Invoice number", value: invoiceNumber },
      { label: "Payout period", value: `${periodStart} ~ ${periodEnd}` },
      { label: "Payout amount", value: `$${amountUsd} USD` },
      { label: "Transfer ID", value: transferId },
      { label: "View invoice", value: `<a href="${invoiceUrl}" style="color:#6366f1;">${invoiceUrl}</a>` },
    ])}

    <p style="${textStyles.body}">
      Deposits to your U.S. bank account typically arrive within <strong>1-2 business days</strong>.
      If you don't see the deposit, reach out with the Transfer ID above.
    </p>

    <p style="${textStyles.body}">
      You can also review your earnings anytime in your Enabler dashboard.
    </p>
  `;

  const html = baseEmail({
    preheader: `${invoiceNumber} — $${amountUsd} payout has been sent.`,
    title: subject,
    children,
    ctaButton: {
      label: "View Earnings",
      href: `${appUrl}/enabler-dashboard/earnings`,
    },
  });

  const text = `
Payout Sent — ${invoiceNumber}

Hi ${enablerName}, your payout has been sent.

Invoice number: ${invoiceNumber}
Payout period: ${periodStart} ~ ${periodEnd}
Payout amount: $${amountUsd} USD
Transfer ID: ${transferId}
View invoice: ${invoiceUrl}

Deposits to your U.S. bank account typically arrive within 1-2 business days.

View Earnings: ${appUrl}/enabler-dashboard/earnings

---
Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
