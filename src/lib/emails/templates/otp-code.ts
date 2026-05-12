import { baseEmail, textStyles } from "./_layout";
import type { EmailPayload } from "./welcome";

export type OtpCodeEmailInput = {
  recipientName: string;
  code: string;
};

export function otpCodeEmail(input: OtpCodeEmailInput): EmailPayload<OtpCodeEmailInput> {
  const { recipientName, code } = input;

  const children = `
    <p style="${textStyles.h1}">인증 코드 확인</p>
    <p style="${textStyles.body}">안녕하세요, ${recipientName}님.</p>
    <p style="${textStyles.body}">
      로그인 2단계 인증을 위한 코드입니다. 아래 코드를 5분 내에 입력해 주세요.
    </p>

    <!-- OTP 코드 강조 박스 -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin: 28px 0;">
      <tr>
        <td style="text-align: center; background-color: #f0ffd0; border: 2px solid #c8ff00;
                   border-radius: 12px; padding: 28px 20px;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px;
                      font-weight: 700; color: #0a0a0a; letter-spacing: 12px;
                      line-height: 1;">
            ${code}
          </div>
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      font-size: 13px; color: #6b7280; margin-top: 12px;">
            5분 후 만료됩니다
          </div>
        </td>
      </tr>
    </table>

    <p style="${textStyles.muted}">
      이 요청을 본인이 하지 않으셨다면, 이 이메일을 무시하세요. 코드를 입력하지 않는 한 계정은 안전합니다.
    </p>
    <p style="${textStyles.muted}">
      보안이 걱정되신다면
      <a href="https://getitdonework.com/settings/security"
         style="color: #1a1a20; text-decoration: underline;">보안 설정</a>에서 비밀번호를 변경하세요.
    </p>
  `;

  const html = baseEmail({
    preheader: `인증 코드: ${code} — 5분 내 입력`,
    title: `[Get It Done at Work] 인증 코드 ${code}`,
    children,
  });

  const text = `
[Get It Done at Work] 인증 코드

안녕하세요, ${recipientName}님.

로그인 2단계 인증 코드: ${code}

5분 내에 입력해 주세요.
이 요청을 본인이 하지 않으셨다면, 이 이메일을 무시하세요.
  `.trim();

  return {
    subject: `[Get It Done at Work] 인증 코드 ${code}`,
    html,
    text,
    props: input,
  };
}
