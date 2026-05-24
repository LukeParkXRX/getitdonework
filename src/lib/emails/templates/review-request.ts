import { baseEmail, textStyles, infoCard } from "./_layout";
import type { EmailPayload } from "./welcome";

export type ReviewRequestInput = {
  recipientName: string;
  counterpartName: string;
  sessionType: string;
  sessionDate: string; // "2025년 5월 15일 (목)"
  bookingId: string;
  unsubscribeToken?: string;
};

export function reviewRequestEmail(
  input: ReviewRequestInput
): EmailPayload<ReviewRequestInput> {
  const { recipientName, counterpartName, sessionType, sessionDate, bookingId, unsubscribeToken } = input;

  const subject = `${counterpartName}님과의 세션은 어떠셨나요? 리뷰를 남겨주세요`;
  const reviewUrl = `https://getitdonework.com/my?review=${bookingId}`;

  const children = `
    <h1 style="${textStyles.h1}">세션 후기를 들려주세요.</h1>

    <p style="${textStyles.body}">
      ${recipientName}님, <strong>${counterpartName}</strong>님과의 세션이 잘 마무리되었기를 바랍니다.
      5분이면 충분합니다. 당신의 리뷰가 다음 스타트업의 결정을 돕습니다.
    </p>

    ${infoCard([
      { label: "세션", value: sessionType },
      { label: "상대방", value: counterpartName },
      { label: "세션 날짜", value: sessionDate },
    ])}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 28px;">
      <tr>
        <td style="text-align: center;">
          <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #6b7280; margin: 0 0 12px;">
            아래 별점을 선택하면 리뷰 페이지로 이동합니다
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              ${[1, 2, 3, 4, 5]
                .map(
                  (n) => `
              <td style="padding: 0 4px;">
                <a href="${reviewUrl}&rating=${n}"
                   style="display: inline-block; font-size: 28px; text-decoration: none; line-height: 1;">
                  ★
                </a>
              </td>`
                )
                .join("")}
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="${textStyles.body}; margin-top: 28px; text-align: center; font-size: 14px; color: #6b7280;">
      별점 선택이 어려우시면 아래 버튼으로 리뷰 페이지를 직접 방문해주세요.
    </p>

    <p style="${textStyles.muted}; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      이 이메일은 세션 종료 1시간 후 자동 발송됩니다.
      리뷰를 남기지 않으시면 3일 후 한 번 더 안내드립니다.
      <br />
      도움이 필요하시면
      <a href="mailto:hello@getitdonework.com" style="color: #6b7280; text-decoration: underline;">hello@getitdonework.com</a>으로
      연락주세요.
    </p>
  `;

  const html = baseEmail({
    preheader: `${counterpartName}님과의 ${sessionType} — 5분이면 충분합니다. 당신의 리뷰가 다음 스타트업의 결정을 돕습니다.`,
    title: subject,
    children,
    ctaButton: {
      label: "리뷰 작성하기",
      href: reviewUrl,
    },
    unsubscribeToken,
  });

  const unsubLine = unsubscribeToken
    ? `수신 거부: https://getitdonework.com/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : `알림 설정: https://getitdonework.com/settings/notifications`;

  const text = `
${counterpartName}님과의 세션은 어떠셨나요? 리뷰를 남겨주세요

${recipientName}님, 세션이 잘 마무리되었기를 바랍니다.
5분이면 충분합니다. 당신의 리뷰가 다음 스타트업의 결정을 돕습니다.

세션: ${sessionType}
상대방: ${counterpartName}
세션 날짜: ${sessionDate}

리뷰 작성하기: ${reviewUrl}

이 이메일은 세션 종료 1시간 후 자동 발송됩니다.
리뷰를 남기지 않으시면 3일 후 한 번 더 안내드립니다.

---
Get It Done at Work
https://getitdonework.com
${unsubLine}
  `.trim();

  return { subject, html, text, props: input };
}
