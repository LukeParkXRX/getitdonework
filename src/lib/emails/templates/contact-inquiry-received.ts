import { baseEmail, textStyles, infoCard, highlightBox, escapeHtml } from "./_layout";
import type { EmailPayload } from "./welcome";

export type ContactInquiryReceivedInput = {
  name: string;
  company?: string;
  email: string;
  inquiryType: string;
  message: string;
  inquiryId: string;
};

export function contactInquiryReceivedEmail(
  input: ContactInquiryReceivedInput
): EmailPayload<ContactInquiryReceivedInput> {
  const { name, company, email, inquiryType, message, inquiryId } = input;
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  const subject = `[새 문의] ${name} - ${inquiryType}`;

  const infoRows = [
    { label: "이름", value: name },
    ...(company ? [{ label: "회사", value: company }] : []),
    { label: "이메일", value: email },
    { label: "문의 유형", value: inquiryType },
    { label: "문의 ID", value: inquiryId },
  ];

  const children = `
    <h1 style="${textStyles.h1}">새 문의가 도착했습니다.</h1>

    <p style="${textStyles.body}">
      웹사이트 문의 폼을 통해 새 메시지가 접수되었습니다.
    </p>

    ${infoCard(infoRows)}

    <h2 style="${textStyles.h2}">문의 내용</h2>
    <p style="${textStyles.body}; background-color: #f9fafb; border-radius: 8px; padding: 14px 18px; font-size: 14px; color: #374151; white-space: pre-wrap;">
      ${safeMessage}
    </p>

    ${highlightBox(
      `답장은 <strong>${safeEmail}</strong> 주소로 직접 회신해 주세요.`
    )}
  `;

  const html = baseEmail({
    preheader: `${name}님이 "${inquiryType}" 관련 문의를 남겼습니다.`,
    title: subject,
    children,
  });

  const text = `
[새 문의] ${name} - ${inquiryType}

새 문의가 도착했습니다.

이름: ${name}
${company ? `회사: ${company}\n` : ""}이메일: ${email}
문의 유형: ${inquiryType}
문의 ID: ${inquiryId}

문의 내용:
${message}

답장: ${email} 로 직접 회신

---
Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
