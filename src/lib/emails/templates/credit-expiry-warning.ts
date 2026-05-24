import { baseEmail, textStyles, infoCard, highlightBox } from "./_layout";
import type { EmailPayload } from "./welcome";

export type ExpiryTiming = 30 | 7 | 1;
export type CreditRecipientType = "org" | "startup";

export type CreditExpiryWarningInput = {
  recipientName: string;
  recipientType: CreditRecipientType;
  orgName?: string; // org일 때만
  expiringCredits: number;
  expiryDate: string; // "2025년 6월 1일 (일)"
  daysLeft: ExpiryTiming;
  unsubscribeToken?: string;
};

const TIMING_CONFIG: Record<
  ExpiryTiming,
  { urgency: string; badge: string; badgeColor: string; badgeBg: string }
> = {
  30: {
    urgency: "30일 후 만료됩니다. 지금 활용 계획을 세우세요.",
    badge: "D-30",
    badgeColor: "#5c7a00",
    badgeBg: "#f0ffd0",
  },
  7: {
    urgency: "7일 남았습니다. 지금 바로 Enabler와 매칭하세요.",
    badge: "D-7",
    badgeColor: "#92400e",
    badgeBg: "#fef3c7",
  },
  1: {
    urgency: "내일 만료됩니다! 오늘 안에 세션을 예약하세요.",
    badge: "D-1",
    badgeColor: "#991b1b",
    badgeBg: "#fee2e2",
  },
};

export function creditExpiryWarningEmail(
  input: CreditExpiryWarningInput
): EmailPayload<CreditExpiryWarningInput> {
  const {
    recipientName,
    recipientType,
    orgName,
    expiringCredits,
    expiryDate,
    daysLeft,
    unsubscribeToken,
  } = input;

  const cfg = TIMING_CONFIG[daysLeft];
  const isOrg = recipientType === "org";
  const entityName = isOrg && orgName ? orgName : recipientName;

  const subject =
    daysLeft === 1
      ? `[긴급] 내일 ${expiringCredits} 크레딧이 만료됩니다 — 오늘 사용하세요`
      : `[D-${daysLeft}] ${expiringCredits} 크레딧 만료 예정 — 놓치기 아까운 실행 기회`;

  const children = `
    <p style="margin: 0 0 16px;">
      <span style="display: inline-block; background-color: ${cfg.badgeBg}; color: ${cfg.badgeColor}; font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${cfg.badge} 만료 임박
      </span>
    </p>

    <h1 style="${textStyles.h1}">
      놓치기 아까운 실행 기회
    </h1>

    <p style="${textStyles.body}">
      ${isOrg ? `<strong>${entityName}</strong> 조직의` : `${recipientName}님의`}
      크레딧 <strong>${expiringCredits}개</strong>가 곧 만료됩니다.
      ${cfg.urgency}
    </p>

    ${infoCard([
      { label: "만료 예정 크레딧", value: `${expiringCredits} 크레딧` },
      { label: "만료일", value: expiryDate },
      { label: "남은 기간", value: `${daysLeft}일` },
      ...(isOrg && orgName ? [{ label: "조직", value: orgName }] : []),
    ])}

    ${highlightBox(
      daysLeft === 1
        ? `<strong>오늘이 마지막입니다.</strong><br />
           Chemistry Session(30분)은 바로 예약 가능합니다. 지금 Enabler를 찾아 오늘 안에 세션을 시작하세요.`
        : `<strong>크레딧 활용 방법</strong><br />
           • Chemistry Session (무료) — Enabler와 30분 무료 대화로 궁합 확인<br />
           • Standard Session — 전략·실행 분야 집중 1:1 세션<br />
           • Project Session — 멀티 세션 프로젝트 단위 협업`
    )}

    <p style="${textStyles.body}; margin-top: 24px;">
      만료된 크레딧은 복구되지 않습니다.
      ${isOrg
        ? "팀원들에게 크레딧 활용을 독려하거나, 직접 Enabler와 매칭을 시작해보세요."
        : "지금 바로 Enabler와 매칭하고 실행력을 높이세요."}
    </p>

    <p style="${textStyles.muted}">
      크레딧 만료 정책 또는 연장 문의:
      <a href="mailto:hello@getitdonework.com" style="color: #6b7280; text-decoration: underline;">hello@getitdonework.com</a>
    </p>
  `;

  const html = baseEmail({
    preheader: `${expiringCredits} 크레딧이 ${expiryDate}에 만료됩니다. 지금 Enabler와 매칭하세요.`,
    title: subject,
    children,
    ctaButton: {
      label: "지금 Enabler와 매칭하세요",
      href: "https://getitdonework.com/enablers",
    },
    unsubscribeToken,
  });

  const unsubLine = unsubscribeToken
    ? `수신 거부: https://getitdonework.com/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : `알림 설정: https://getitdonework.com/settings/notifications`;

  const text = `
[D-${daysLeft}] 크레딧 만료 경고

${isOrg ? `${entityName} 조직의` : `${recipientName}님의`} 크레딧 ${expiringCredits}개가 ${expiryDate}에 만료됩니다.
${cfg.urgency}

만료 예정 크레딧: ${expiringCredits} 크레딧
만료일: ${expiryDate}
남은 기간: ${daysLeft}일

만료된 크레딧은 복구되지 않습니다.

지금 Enabler와 매칭하세요: https://getitdonework.com/enablers

크레딧 만료 정책 문의: hello@getitdonework.com

---
Get It Done at Work
https://getitdonework.com
${unsubLine}
  `.trim();

  return { subject, html, text, props: input };
}
