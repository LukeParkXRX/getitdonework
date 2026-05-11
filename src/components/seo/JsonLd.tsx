/**
 * JSON-LD structured data component.
 * data는 서버에서 정적으로 구성된 객체만 전달할 것.
 */

// XSS-safe: JSON.stringify + 특수문자 유니코드 이스케이프
function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

type Props = { data: Record<string, unknown> };

// React does not expose a safe alternative for inline scripts.
// Content is server-controlled static data — no user input involved.
export default function JsonLd({ data }: Props) {
  const __html = safeJsonLd(data);
  const props = { type: "application/ld+json", dangerouslySetInnerHTML: { __html } };
  return <script {...props} />;
}
