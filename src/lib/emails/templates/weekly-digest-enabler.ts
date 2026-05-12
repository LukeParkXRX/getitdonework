import { baseEmail, textStyles, highlightBox } from "./_layout";
import type { EmailPayload } from "./welcome";

export type WeeklyDigestEnablerInput = {
  fullName: string;
  weekLabel: string; // "2026년 5월 1일 ~ 5월 7일"
  matchRequests: number;
  sessionsCompleted: number;
  earningsUsd: number;
  reviewsReceived: number;
  unsubscribeToken?: string;
};

export function weeklyDigestEnablerEmail(
  input: WeeklyDigestEnablerInput
): EmailPayload<WeeklyDigestEnablerInput> {
  const {
    fullName,
    weekLabel,
    matchRequests,
    sessionsCompleted,
    earningsUsd,
    reviewsReceived,
    unsubscribeToken,
  } = input;

  const subject = `[Get It Done] ${fullName}, your weekly summary — ${weekLabel}`;

  const children = `
    <h1 style="${textStyles.h1}">
      ${fullName}, here's your week at a glance.
    </h1>

    <p style="${textStyles.muted}">${weekLabel}</p>

    ${highlightBox(`
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align: center; padding: 0 12px 0 0; border-right: 1px solid #e5e7eb;">
            <div style="font-size: 28px; font-weight: 700; color: #c8ff00;">${matchRequests}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Match Requests</div>
          </td>
          <td style="text-align: center; padding: 0 12px; border-right: 1px solid #e5e7eb;">
            <div style="font-size: 28px; font-weight: 700; color: #1a1a20;">${sessionsCompleted}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Sessions Done</div>
          </td>
          <td style="text-align: center; padding: 0 0 0 12px;">
            <div style="font-size: 28px; font-weight: 700; color: #1a1a20;">$${earningsUsd.toFixed(2)}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Earned</div>
          </td>
        </tr>
      </table>
    `)}

    <h3 style="${textStyles.h2}">Reviews</h3>
    <p style="${textStyles.body}">
      ${
        reviewsReceived > 0
          ? `You received <strong>${reviewsReceived} new review${reviewsReceived > 1 ? "s" : ""}</strong> this week. Keep up the great work!`
          : `No new reviews this week. Complete more sessions to build your reputation.`
      }
    </p>

    <p style="${textStyles.body}">
      Check your dashboard to review pending requests and manage your availability.
    </p>
  `;

  return {
    subject,
    html: baseEmail({
      preheader: `${matchRequests} match requests · ${sessionsCompleted} sessions · $${earningsUsd.toFixed(2)} earned`,
      title: "Weekly Summary",
      children,
      ctaButton: { label: "View Dashboard", href: "https://getitdonework.com/enabler-dashboard" },
      footerExtra: `You're receiving this because you subscribed to weekly digest emails.${unsubscribeToken ? ` <a href="https://getitdonework.com/unsubscribe?token=${unsubscribeToken}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>` : " Unsubscribe anytime in your settings."}`,
    }),
    text: `${fullName} — Weekly Summary (${weekLabel})\n\nMatch Requests: ${matchRequests}\nSessions Completed: ${sessionsCompleted}\nEarned: $${earningsUsd.toFixed(2)}\nReviews: ${reviewsReceived}\n\nhttps://getitdonework.com/enabler-dashboard`,
    props: input,
  };
}
