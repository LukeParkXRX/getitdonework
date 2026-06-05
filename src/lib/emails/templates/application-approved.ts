import { baseEmail, textStyles, infoCard, highlightBox, escapeHtml } from "./_layout";
import type { EmailPayload } from "./welcome";

export type ApplicationApprovedInput = {
  applicantName: string;
  applicantEmail: string;
  signupLink: string;
};

export function applicationApprovedEmail(
  input: ApplicationApprovedInput
): EmailPayload<ApplicationApprovedInput> {
  const subject = `[Get It Done] ${input.applicantName}님, Enabler 지원이 승인됐습니다!`;
  const safeApplicantName = escapeHtml(input.applicantName);

  const details = infoCard([
    { label: "지원자", value: input.applicantName },
    { label: "이메일", value: input.applicantEmail },
  ]);

  const children = `
    <h1 style="${textStyles.h1}">축하합니다! Enabler 지원이 승인됐습니다.</h1>
    <p style="${textStyles.body}">
      <strong>${safeApplicantName}</strong>님의 Get It Done at Work Enabler 지원이 검토를 거쳐 최종 승인됐습니다.
      지금 아래 링크를 통해 계정을 만들고 첫 세션을 시작해 보세요.
    </p>

    ${details}

    ${highlightBox(
      `아래 버튼을 눌러 Enabler 계정을 만들고 프로필을 완성하세요.<br>
       링크는 본인만 사용할 수 있습니다.`
    )}
  `;

  const html = baseEmail({
    preheader: `${input.applicantName}님의 Enabler 지원이 승인됐습니다. 지금 가입하세요.`,
    title: subject,
    children,
    ctaButton: {
      label: "Enabler 계정 만들기",
      href: input.signupLink,
    },
  });

  const text = `
[Get It Done at Work] Enabler 지원 승인

안녕하세요, ${input.applicantName}님.

Get It Done at Work Enabler 지원이 승인됐습니다.
아래 링크로 계정을 생성하고 프로필을 완성해 주세요.

가입 링크: ${input.signupLink}

감사합니다.
Get It Done at Work 운영팀
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
