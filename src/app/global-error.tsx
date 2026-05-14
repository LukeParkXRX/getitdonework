"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#e5e5e5",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "24px",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "oklch(0.3 0.15 25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
            color: "oklch(0.75 0.2 25)",
            marginBottom: 8,
          }}
        >
          !
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          서비스를 불러올 수 없어요
        </h1>
        <p style={{ color: "#888", fontSize: 14, maxWidth: 400, lineHeight: 1.6, margin: "4px 0 8px" }}>
          앱 전체에 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "12px 28px",
            borderRadius: 8,
            backgroundColor: "#c8f135",
            color: "#0a0a0a",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
