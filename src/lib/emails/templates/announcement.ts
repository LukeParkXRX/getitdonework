import { baseEmail, textStyles } from "./_layout";
import type { EmailPayload } from "./welcome";

export type AnnouncementEmailInput = {
  title: string;
  body: string;
  link?: string;
  recipientName?: string;
};

export function announcementEmail(
  input: AnnouncementEmailInput
): EmailPayload<AnnouncementEmailInput> {
  const { title, body, link, recipientName } = input;

  const subject = `[Get It Done at Work] ${title}`;

  const greeting = recipientName
    ? `<p style="${textStyles.body}">${recipientName}님,</p>`
    : "";

  const bodyLines = body
    .split("\n")
    .map((line) => `<p style="${textStyles.body}">${line}</p>`)
    .join("");

  const linkButton = link
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px auto 0;">
      <tr>
        <td style="border-radius: 10px; background-color: #c8ff00;">
          <a href="${link}"
             style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; color: #0a0a0a; text-decoration: none; border-radius: 10px; letter-spacing: -0.2px;">
            자세히 보기
          </a>
        </td>
      </tr>
    </table>
  `
    : "";

  const children = `
    <h1 style="${textStyles.h1}">${title}</h1>
    ${greeting}
    ${bodyLines}
    ${linkButton}
  `;

  const html = baseEmail({
    preheader: body.slice(0, 100),
    title: subject,
    children,
    footerExtra: "이 메일은 Get It Done at Work 운영팀이 발송한 공지 메일입니다.",
  });

  const text = `
[Get It Done at Work] ${title}
${recipientName ? `\n${recipientName}님,\n` : ""}
${body}
${link ? `\n자세히 보기: ${link}` : ""}

---
Get It Done at Work
https://getitdonework.com
수신 거부: https://getitdonework.com/unsubscribe
  `.trim();

  return { subject, html, text, props: input };
}
