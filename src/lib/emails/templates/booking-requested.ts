import { baseEmail, textStyles, infoCard, highlightBox, escapeHtml } from "./_layout";
import type { EmailPayload } from "./welcome";

export type BookingRequestedInput = {
  enablerName: string;
  startupName: string;
  sessionType: string;
  sessionDatetime: string; // "2025년 5월 15일 (목) 오후 3:00"
  brief: string;
  bookingId: string;
  dashboardUrl: string;
};

export function bookingRequestedEmail(
  input: BookingRequestedInput
): EmailPayload<BookingRequestedInput> {
  const {
    enablerName,
    startupName,
    sessionType,
    sessionDatetime,
    brief,
    bookingId,
    dashboardUrl,
  } = input;

  const subject = `새 예약 신청이 도착했습니다 — ${startupName}`;
  const safeEnablerName = escapeHtml(enablerName);
  const safeStartupName = escapeHtml(startupName);
  const safeBrief = escapeHtml(brief);

  const children = `
    <h1 style="${textStyles.h1}">새 예약 신청이 도착했습니다.</h1>

    <p style="${textStyles.body}">
      ${safeEnablerName}님, <strong>${safeStartupName}</strong> 스타트업에서 세션을 신청했습니다.
      아래 내용을 확인하고 수락 또는 거절해 주세요.
    </p>

    ${infoCard([
      { label: "신청 스타트업", value: startupName },
      { label: "세션 유형", value: sessionType },
      { label: "희망 일시", value: sessionDatetime },
      { label: "예약 ID", value: bookingId },
    ])}

    ${brief
      ? `<h2 style="${textStyles.h2}">사전 브리프</h2>
         <p style="${textStyles.body}; background-color: #f9fafb; border-radius: 8px; padding: 14px 18px; font-size: 14px; color: #374151; white-space: pre-wrap;">
           ${safeBrief}
         </p>`
      : ""}

    ${highlightBox(
      "신청은 <strong>48시간 이내</strong>에 수락 또는 거절해 주세요. 기한 내 응답이 없으면 자동으로 만료됩니다."
    )}

    <p style="${textStyles.muted}; margin-top: 24px;">
      대시보드에서 예약 내역 전체를 확인하고 관리할 수 있습니다.
    </p>
  `;

  const html = baseEmail({
    preheader: `${startupName}이(가) ${sessionType} 세션을 신청했습니다 — ${sessionDatetime}`,
    title: subject,
    children,
    ctaButton: {
      label: "요청 확인하기",
      href: dashboardUrl,
    },
  });

  const text = `
새 예약 신청이 도착했습니다 — ${startupName}

${enablerName}님, ${startupName} 스타트업에서 세션을 신청했습니다.

신청 스타트업: ${startupName}
세션 유형: ${sessionType}
희망 일시: ${sessionDatetime}
예약 ID: ${bookingId}

${brief ? `사전 브리프:\n${brief}\n\n` : ""}신청은 48시간 이내에 수락 또는 거절해 주세요.
대시보드에서 확인: ${dashboardUrl}

---
Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
