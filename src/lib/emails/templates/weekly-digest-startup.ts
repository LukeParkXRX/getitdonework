import { baseEmail, textStyles, highlightBox } from "./_layout";
import type { EmailPayload } from "./welcome";

export type WeeklyDigestStartupInput = {
  fullName: string;
  weekLabel: string; // "2026년 5월 1일 ~ 5월 7일"
  tokenUsed: number;
  tokenBalance: number;
  bookingsPending: number;
  bookingsConfirmed: number;
  bookingsCompleted: number;
  newEnablers: { name: string; expertise: string }[]; // 최대 3명
  unsubscribeToken?: string;
};

export function weeklyDigestStartupEmail(
  input: WeeklyDigestStartupInput
): EmailPayload<WeeklyDigestStartupInput> {
  const {
    fullName,
    weekLabel,
    tokenUsed,
    tokenBalance,
    bookingsPending,
    bookingsConfirmed,
    bookingsCompleted,
    newEnablers,
    unsubscribeToken,
  } = input;

  const subject = `[Get It Done] ${fullName}님의 주간 활동 요약 — ${weekLabel}`;

  const enablerRows =
    newEnablers.length > 0
      ? newEnablers
          .map(
            (e) => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 600; color: #1a1a20;">${e.name}</span>
              <span style="color: #6b7280; font-size: 13px; margin-left: 8px;">${e.expertise}</span>
            </td>
          </tr>`
          )
          .join("")
      : `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">이번 주 새로운 Enabler가 없습니다.</td></tr>`;

  const children = `
    <h1 style="${textStyles.h1}">
      ${fullName}님, 지난주 활동 요약입니다.
    </h1>

    <p style="${textStyles.muted}">${weekLabel}</p>

    ${highlightBox(`
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align: center; padding: 0 16px 0 0; border-right: 1px solid #e5e7eb;">
            <div style="font-size: 28px; font-weight: 700; color: #c8ff00;">${tokenUsed}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">이번 주 사용 토큰</div>
          </td>
          <td style="text-align: center; padding: 0 0 0 16px;">
            <div style="font-size: 28px; font-weight: 700; color: #1a1a20;">${tokenBalance}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">현재 잔여 토큰</div>
          </td>
        </tr>
      </table>
    `)}

    <h3 style="${textStyles.h2}">세션 현황</h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 10px; background: #f9fafb; border-radius: 8px; text-align: center; width: 33%;">
          <div style="font-size: 22px; font-weight: 700; color: #1a1a20;">${bookingsPending}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">대기중</div>
        </td>
        <td style="width: 8px;"></td>
        <td style="padding: 10px; background: #f9fafb; border-radius: 8px; text-align: center; width: 33%;">
          <div style="font-size: 22px; font-weight: 700; color: #1a1a20;">${bookingsConfirmed}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">확정</div>
        </td>
        <td style="width: 8px;"></td>
        <td style="padding: 10px; background: #f9fafb; border-radius: 8px; text-align: center; width: 33%;">
          <div style="font-size: 22px; font-weight: 700; color: #1a1a20;">${bookingsCompleted}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">완료</div>
        </td>
      </tr>
    </table>

    <h3 style="${textStyles.h2}">새로 합류한 Enabler</h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      ${enablerRows}
    </table>

    <p style="${textStyles.body}">
      지금 바로 새로운 Enabler를 만나보세요.
    </p>
  `;

  return {
    subject,
    html: baseEmail({
      preheader: `이번 주 토큰 ${tokenUsed}개 사용 · 잔여 ${tokenBalance}개`,
      title: "주간 활동 요약",
      children,
      ctaButton: { label: "Enabler 둘러보기", href: "https://getitdonework.com/enablers" },
      footerExtra: `이 이메일은 주간 활동 요약 구독자에게 발송됩니다.${unsubscribeToken ? ` <a href="https://getitdonework.com/unsubscribe?token=${unsubscribeToken}" style="color:#6b7280;text-decoration:underline;">수신 거부</a>` : " 수신을 원하지 않으시면 설정에서 마케팅 수신을 해제하세요."}`,
    }),
    text: `${fullName}님의 주간 요약 (${weekLabel})\n\n토큰 사용: ${tokenUsed}개 / 잔여: ${tokenBalance}개\n세션: 대기 ${bookingsPending} / 확정 ${bookingsConfirmed} / 완료 ${bookingsCompleted}\n\nhttps://getitdonework.com/enablers`,
    props: input,
  };
}
