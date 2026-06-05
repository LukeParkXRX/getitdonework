import { baseEmail, textStyles, highlightBox } from "./_layout";
import type { EmailPayload } from "./welcome";
import { COMPANY_EMAILS } from "@/lib/constants/company";

export type ApplicationRejectedInput = {
  applicantName: string;
  applicantEmail: string;
  notes?: string;
};

export function applicationRejectedEmail(
  input: ApplicationRejectedInput
): EmailPayload<ApplicationRejectedInput> {
  const subject = `[Get It Done] ${input.applicantName}님, Enabler 지원 결과를 안내드립니다`;

  const notesSection =
    input.notes && input.notes.trim()
      ? `
    <h2 style="${textStyles.h2}">검토 의견</h2>
    <p style="${textStyles.body}; background-color: #f9fafb; border-radius: 8px; padding: 14px 18px; font-size: 14px; white-space: pre-wrap;">
      ${input.notes}
    </p>
  `
      : "";

  const children = `
    <h1 style="${textStyles.h1}">Enabler 지원 결과 안내</h1>
    <p style="${textStyles.body}">
      안녕하세요, <strong>${input.applicantName}</strong>님.<br>
      Get It Done at Work Enabler 지원에 관심을 가져 주셔서 감사합니다.
    </p>
    <p style="${textStyles.body}">
      아쉽게도 이번 지원은 현재 저희 기준에 부합하지 않아 채택이 어렵게 됐습니다.
      귀하의 소중한 시간과 노력에 진심으로 감사드립니다.
    </p>

    ${notesSection}

    ${highlightBox(
      `향후 요건이 변경되거나 새로운 모집 기회가 생기면 다시 연락드릴 수 있습니다.<br>
       궁금한 점은 <a href="mailto:${COMPANY_EMAILS.support}" style="color: #1a1a20; font-weight: 600;">${COMPANY_EMAILS.support}</a>으로 문의해 주세요.`
    )}
  `;

  const html = baseEmail({
    preheader: `${input.applicantName}님의 Enabler 지원 결과를 안내드립니다.`,
    title: subject,
    children,
  });

  const text = `
[Get It Done at Work] Enabler 지원 결과 안내

안녕하세요, ${input.applicantName}님.

Get It Done at Work Enabler 지원에 관심을 가져 주셔서 감사합니다.

아쉽게도 이번 지원은 현재 저희 기준에 부합하지 않아 채택이 어렵게 됐습니다.

${input.notes ? `검토 의견:\n${input.notes}\n` : ""}
궁금한 점은 ${COMPANY_EMAILS.support} 으로 문의해 주세요.

감사합니다.
Get It Done at Work 운영팀
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
