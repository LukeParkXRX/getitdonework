import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        gap: 16,
        backgroundColor: "var(--color-black)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          fontFamily: "var(--font-display)",
          color: "var(--color-accent)",
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}
      >
        404
      </div>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          margin: "8px 0 0",
        }}
      >
        페이지를 찾을 수 없어요
      </h1>

      <p
        style={{
          color: "var(--color-dim)",
          fontSize: 15,
          maxWidth: 480,
          lineHeight: 1.6,
          margin: "4px 0 8px",
        }}
      >
        주소가 정확한지 다시 확인해 주세요. 또는 아래에서 다른 경로로 이동하세요.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--color-accent)",
            color: "oklch(0.1 0 0)",
            borderRadius: "var(--radius-lg, 8px)",
            textDecoration: "none",
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            fontSize: 14,
          }}
        >
          홈으로
        </Link>
        <Link
          href="/enablers"
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--color-card)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg, 8px)",
            textDecoration: "none",
            fontWeight: 600,
            fontFamily: "var(--font-display)",
            fontSize: 14,
          }}
        >
          Enabler 찾기
        </Link>
      </div>
    </main>
  );
}
