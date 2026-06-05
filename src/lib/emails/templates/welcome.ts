import { baseEmail, textStyles, highlightBox } from "./_layout";
import { COMPANY_EMAILS } from "@/lib/constants/company";

export type WelcomeEmailInput = {
  fullName: string;
  role: "startup" | "enabler" | "org_admin";
  unsubscribeToken?: string;
};

export type EmailPayload<T> = {
  subject: string;
  html: string;
  text: string;
  props: T;
};

const ROLE_CONFIG = {
  startup: {
    badge: "Startup",
    description: "실행 파트너를 찾고 계시는군요. 당신의 다음 움직임, 함께 실행으로 바꿉니다.",
    ctaLabel: "Enabler 찾기",
    ctaHref: "https://getitdonework.com/enablers",
    tip: "Chemistry Session(무료)으로 시작하세요. 비용 없이 Enabler와 30분 대화로 궁합을 확인할 수 있습니다.",
  },
  enabler: {
    badge: "Enabler",
    description: "당신의 전문성이 한국 스타트업의 실행력이 됩니다. 프로필을 완성해야 매칭이 시작됩니다.",
    ctaLabel: "프로필 완성하기",
    ctaHref: "https://getitdonework.com/my",
    tip: "이메일 인증이 완료되어야 프로필이 공개됩니다. 받은편지함을 확인해주세요.",
  },
  org_admin: {
    badge: "Org Admin",
    description: "조직 전체의 실행력을 높이세요. 크레딧으로 팀원들이 자유롭게 Enabler와 매칭됩니다.",
    ctaLabel: "크레딧 대시보드 보기",
    ctaHref: "https://getitdonework.com/org/dashboard",
    tip: "팀원을 초대하고 크레딧을 배분하면 각자 필요한 Enabler와 매칭할 수 있습니다.",
  },
} as const;

export function welcomeEmail(
  input: WelcomeEmailInput
): EmailPayload<WelcomeEmailInput> {
  const { fullName, role, unsubscribeToken } = input;
  const cfg = ROLE_CONFIG[role];

  const subject = `환영합니다, ${fullName}님 — Get It Done at Work에 오셨습니다`;

  const children = `
    <p style="${textStyles.muted}">
      <span style="display: inline-block; background-color: #f0ffd0; color: #5c7a00; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.3px;">${cfg.badge}</span>
    </p>

    <h1 style="${textStyles.h1}">
      ${fullName}님, 환영합니다.
    </h1>

    <p style="${textStyles.body}">
      Get It Done at Work에 오신 걸 환영합니다.<br />
      당신의 다음 움직임을 실행으로 바꿉니다.
    </p>

    <p style="${textStyles.body}">
      ${cfg.description}
    </p>

    ${highlightBox(`<strong>시작 팁</strong><br />${cfg.tip}`)}

    <p style="${textStyles.muted}; margin-top: 24px;">
      궁금한 점이 있으시면 언제든지
      <a href="mailto:${COMPANY_EMAILS.support}" style="${textStyles.link}">${COMPANY_EMAILS.support}</a>으로
      연락주세요. 빠르게 도와드립니다.
    </p>
  `;

  const html = baseEmail({
    preheader: `Get It Done at Work에 오신 걸 환영합니다. 당신의 다음 움직임을 실행으로 바꿉니다.`,
    title: subject,
    children,
    ctaButton: { label: cfg.ctaLabel, href: cfg.ctaHref },
    unsubscribeToken,
  });

  const unsubLine = unsubscribeToken
    ? `수신 거부: https://getitdonework.com/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : `알림 설정: https://getitdonework.com/settings/notifications`;

  const text = `
환영합니다, ${fullName}님 — Get It Done at Work

Get It Done at Work에 오신 걸 환영합니다.
당신의 다음 움직임을 실행으로 바꿉니다.

역할: ${cfg.badge}
${cfg.description}

${cfg.ctaLabel}: ${cfg.ctaHref}

시작 팁: ${cfg.tip}

궁금한 점은 ${COMPANY_EMAILS.support}으로 연락주세요.

---
Get It Done at Work
https://getitdonework.com
${unsubLine}
  `.trim();

  return { subject, html, text, props: input };
}
