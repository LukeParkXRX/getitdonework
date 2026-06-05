import { baseEmail, textStyles, infoCard, highlightBox } from "./_layout";
import type { EmailPayload } from "./welcome";
import { COMPANY_EMAILS } from "@/lib/constants/company";

export type CancelledBy = "startup" | "enabler" | "system";
export type RefundPolicy = "full" | "partial" | "none";

export type BookingCancelledInput = {
  recipientName: string;
  counterpartName: string;
  sessionType: string;
  sessionDatetime: string;
  cancelledBy: CancelledBy;
  cancelReason?: string;
  refundPolicy: RefundPolicy;
  refundedCredits: number;
  originalCredits: number;
  bookingId: string;
};

const CANCELLED_BY_LABEL: Record<CancelledBy, string> = {
  startup: "스타트업",
  enabler: "Enabler",
  system: "시스템",
};

const REFUND_LABEL: Record<RefundPolicy, string> = {
  full: "전액 환불 (100%)",
  partial: "부분 환불 (50%)",
  none: "환불 없음 (세션 12시간 이내 취소)",
};

const REFUND_DESC: Record<RefundPolicy, string> = {
  full: "세션 24시간 이전 취소로 크레딧이 전액 반환됩니다.",
  partial: "세션 12~24시간 사이 취소로 크레딧의 50%가 반환됩니다.",
  none: "세션 12시간 이내 취소로 환불이 적용되지 않습니다.",
};

export function bookingCancelledEmail(
  input: BookingCancelledInput
): EmailPayload<BookingCancelledInput> {
  const {
    recipientName,
    counterpartName,
    sessionType,
    sessionDatetime,
    cancelledBy,
    cancelReason,
    refundPolicy,
    refundedCredits,
    originalCredits,
    bookingId,
  } = input;

  const cancellerLabel = CANCELLED_BY_LABEL[cancelledBy];
  const subject = `예약이 취소되었습니다 — ${counterpartName}와의 ${sessionType}`;

  const isSystemCancel = cancelledBy === "system";

  const children = `
    <h1 style="${textStyles.h1}">예약 취소 안내</h1>

    <p style="${textStyles.body}">
      ${recipientName}님, ${isSystemCancel ? "시스템 사정으로 인해" : `<strong>${counterpartName}</strong> (${cancellerLabel}) 측에서`}
      세션 예약을 취소하였습니다.
      불편을 드려 죄송합니다.
    </p>

    ${infoCard([
      { label: "취소된 세션", value: sessionType },
      { label: "예약 일시", value: sessionDatetime },
      { label: "취소한 쪽", value: cancellerLabel },
      ...(cancelReason ? [{ label: "취소 사유", value: cancelReason }] : []),
      { label: "예약 ID", value: bookingId },
    ])}

    <h2 style="${textStyles.h2}">크레딧 환불 내역</h2>

    ${infoCard([
      { label: "환불 정책", value: REFUND_LABEL[refundPolicy] },
      { label: "원래 차감", value: `${originalCredits} 크레딧` },
      { label: "환불 크레딧", value: refundPolicy === "none" ? "0 크레딧" : `${refundedCredits} 크레딧` },
    ])}

    <p style="${textStyles.muted}; margin-top: 12px;">
      ${REFUND_DESC[refundPolicy]}
      환불된 크레딧은 즉시 계정에 반영됩니다.
      <a href="https://getitdonework.com/refund" style="color: #6b7280; text-decoration: underline;">환불 정책 전문 보기</a>
    </p>

    ${isSystemCancel
      ? highlightBox(
          "시스템 취소의 경우 크레딧은 전액 환불되며, 우선 매칭 지원을 제공합니다. 불편을 드려 대단히 죄송합니다."
        )
      : ""}

    <p style="${textStyles.body}; margin-top: 24px;">
      다른 Enabler와 새로운 세션을 바로 예약할 수 있습니다.
    </p>
  `;

  const html = baseEmail({
    preheader: `${counterpartName}와의 ${sessionType} 예약이 취소되었습니다. 크레딧 환불: ${REFUND_LABEL[refundPolicy]}`,
    title: subject,
    children,
    ctaButton: {
      label: "다른 Enabler 찾기",
      href: "https://getitdonework.com/enablers",
    },
    footerExtra: `재예약 관련 문의: ${COMPANY_EMAILS.support}`,
  });

  const text = `
예약 취소 안내

${recipientName}님, ${isSystemCancel ? "시스템 사정으로 인해" : `${counterpartName} (${cancellerLabel}) 측에서`} 세션을 취소하였습니다.

취소된 세션: ${sessionType}
예약 일시: ${sessionDatetime}
취소한 쪽: ${cancellerLabel}
${cancelReason ? `취소 사유: ${cancelReason}\n` : ""}예약 ID: ${bookingId}

환불 정책: ${REFUND_LABEL[refundPolicy]}
원래 차감: ${originalCredits} 크레딧
환불 크레딧: ${refundPolicy === "none" ? "0 크레딧" : `${refundedCredits} 크레딧`}

${REFUND_DESC[refundPolicy]}
환불 정책: https://getitdonework.com/refund

다른 Enabler 찾기: https://getitdonework.com/enablers

---
Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
