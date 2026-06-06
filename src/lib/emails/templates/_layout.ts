// 이메일 공통 레이아웃 헬퍼
// 모든 스타일은 인라인. 테이블 기반 레이아웃 (Outlook·Gmail·Apple Mail 호환)

import { COMPANY_EMAILS } from "@/lib/constants/company";

export interface CtaButton {
  label: string;
  href: string;
}

export interface BaseEmailInput {
  preheader: string; // 받은편지함 미리보기 텍스트
  title: string;
  children: string; // 본문 HTML 조각
  ctaButton?: CtaButton;
  footerExtra?: string; // 푸터 위 추가 문구 (선택)
  /**
   * 마케팅 메일에서 토큰 1-클릭 unsubscribe 링크 활성화.
   * 트랜잭션 메일(OTP, booking confirm 등)에서는 생략 → footer 링크는 /settings로 폴백.
   */
  unsubscribeToken?: string;
}

// ─── 색상 상수 ──────────────────────────────────────────
const COLOR = {
  bg: "#fafafa",
  card: "#ffffff",
  border: "#e5e7eb",
  text: "#1a1a20",
  muted: "#6b7280",
  lime: "#c8ff00",
  limeText: "#0a0a0a",
  link: "#1a1a20",
} as const;

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── 헤더 ────────────────────────────────────────────────
function renderHeader(): string {
  return `
    <tr>
      <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid ${COLOR.border};">
        <div style="font-family: ${FONT}; font-size: 22px; font-weight: 700; color: ${COLOR.text}; letter-spacing: -0.5px;">
          Get It Done
        </div>
        <div style="font-family: ${FONT}; font-size: 12px; color: ${COLOR.muted}; margin-top: 4px; letter-spacing: 0.5px;">
          at Work
        </div>
      </td>
    </tr>
  `;
}

// ─── CTA 버튼 ────────────────────────────────────────────
function renderCtaButton(btn: CtaButton): string {
  const href = escapeHtml(btn.href);
  const label = escapeHtml(btn.label);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px auto 0;">
      <tr>
        <td style="border-radius: 10px; background-color: ${COLOR.lime};">
          <a href="${href}"
             style="display: inline-block; padding: 14px 28px; font-family: ${FONT}; font-size: 15px; font-weight: 700; color: ${COLOR.limeText}; text-decoration: none; border-radius: 10px; letter-spacing: -0.2px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ─── 푸터 ────────────────────────────────────────────────
function renderFooter(extra: string | undefined, unsubscribeToken?: string): string {
  // 토큰 있으면 1-클릭 unsubscribe, 없으면 /settings 안내
  const unsubHref = unsubscribeToken
    ? `https://getitdonework.com/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : "https://getitdonework.com/settings/notifications";
  const unsubLabel = unsubscribeToken ? "수신 거부" : "알림 설정";

  return `
    <tr>
      <td style="padding: 32px 40px; border-top: 1px solid ${COLOR.border}; text-align: center;">
        ${extra ? `<p style="font-family: ${FONT}; font-size: 13px; color: ${COLOR.muted}; margin: 0 0 20px;">${extra}</p>` : ""}
        <p style="font-family: ${FONT}; font-size: 13px; font-weight: 600; color: ${COLOR.text}; margin: 0 0 6px;">
          Get It Done at Work
        </p>
        <p style="font-family: ${FONT}; font-size: 12px; color: ${COLOR.muted}; margin: 0 0 12px; line-height: 1.6;">
          한국 스타트업과 미국 MBA를 실행으로 연결합니다.
        </p>
        <p style="font-family: ${FONT}; font-size: 12px; color: ${COLOR.muted}; margin: 0 0 16px;">
          <a href="mailto:${COMPANY_EMAILS.support}" style="color: ${COLOR.muted}; text-decoration: none;">${COMPANY_EMAILS.support}</a>
          &nbsp;·&nbsp;
          <a href="https://getitdonework.com" style="color: ${COLOR.muted}; text-decoration: none;">getitdonework.com</a>
        </p>
        <p style="font-family: ${FONT}; font-size: 11px; color: ${COLOR.muted}; margin: 0;">
          <a href="https://getitdonework.com/legal" style="color: ${COLOR.muted}; text-decoration: underline;">Legal Center</a>
          &nbsp;·&nbsp;
          <a href="${unsubHref}" style="color: ${COLOR.muted}; text-decoration: underline;">${unsubLabel}</a>
        </p>
      </td>
    </tr>
  `;
}

// ─── 메인 레이아웃 조합 ──────────────────────────────────
export function baseEmail(input: BaseEmailInput): string {
  const { preheader, title, children, ctaButton, footerExtra, unsubscribeToken } = input;
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${COLOR.bg}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- 프리헤더 숨김 텍스트 -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; color: ${COLOR.bg};">
    ${safePreheader}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${COLOR.bg};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- 메인 카드 -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
               width="600" style="max-width: 600px; width: 100%; background-color: ${COLOR.card}; border: 1px solid ${COLOR.border}; border-radius: 16px; overflow: hidden;">

          ${renderHeader()}

          <!-- 본문 -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              ${children}
              ${ctaButton ? renderCtaButton(ctaButton) : ""}
            </td>
          </tr>

          ${renderFooter(footerExtra, unsubscribeToken)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 유틸: 텍스트 분리자 ─────────────────────────────────
export function divider(): string {
  return `<tr><td style="padding: 0 40px;"><hr style="border: none; border-top: 1px solid ${COLOR.border}; margin: 24px 0;" /></td></tr>`;
}

// ─── 유틸: 정보 카드 (key-value 쌍) ─────────────────────
export function infoCard(rows: Array<{ label: string; value: string }>): string {
  const rowsHtml = rows
    .map((r) => {
      const label = escapeHtml(r.label);
      const value = escapeHtml(r.value);
      return `
    <tr>
      <td style="font-family: ${FONT}; font-size: 13px; color: ${COLOR.muted}; padding: 8px 16px; width: 40%; vertical-align: top;">${label}</td>
      <td style="font-family: ${FONT}; font-size: 13px; color: ${COLOR.text}; font-weight: 600; padding: 8px 16px; vertical-align: top; white-space: pre-wrap;">${value}</td>
    </tr>
  `;
    })
    .join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
           style="background-color: #f9fafb; border: 1px solid ${COLOR.border}; border-radius: 10px; margin-top: 20px;">
      ${rowsHtml}
    </table>
  `;
}

// ─── 유틸: 강조 텍스트 박스 ──────────────────────────────
export function highlightBox(content: string): string {
  return `
    <div style="background-color: #f0ffd0; border-left: 4px solid ${COLOR.lime}; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-top: 20px; font-family: ${FONT}; font-size: 14px; color: ${COLOR.text}; line-height: 1.6;">
      ${content}
    </div>
  `;
}

// ─── 공통 텍스트 스타일 헬퍼 ─────────────────────────────
export const textStyles = {
  h1: `font-family: ${FONT}; font-size: 24px; font-weight: 700; color: ${COLOR.text}; margin: 0 0 12px; letter-spacing: -0.5px; line-height: 1.3;`,
  h2: `font-family: ${FONT}; font-size: 18px; font-weight: 600; color: ${COLOR.text}; margin: 24px 0 8px; letter-spacing: -0.3px;`,
  body: `font-family: ${FONT}; font-size: 15px; color: ${COLOR.text}; line-height: 1.7; margin: 0 0 16px;`,
  muted: `font-family: ${FONT}; font-size: 13px; color: ${COLOR.muted}; line-height: 1.6; margin: 0 0 12px;`,
  link: `color: ${COLOR.text}; text-decoration: underline;`,
  lime: `color: #5c7a00; font-weight: 600;`,
} as const;
