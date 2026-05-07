import Link from "next/link";

export const metadata = {
  title: "결제 취소 — Get It Done at Work",
};

export default function CreditsPurchaseCancelPage() {
  return (
    <div
      style={{
        background: "var(--color-dark)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 24,
          padding: "56px 40px",
          textAlign: "center",
        }}
      >
        {/* 상태 아이콘 */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "oklch(0.25 0.08 50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="oklch(0.75 0.15 50)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 26,
            color: "var(--color-text)",
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
          }}
        >
          결제가 취소되었습니다
        </h1>
        <p
          style={{
            color: "var(--color-dim)",
            fontSize: 15,
            lineHeight: 1.7,
            margin: "0 0 36px",
          }}
        >
          결제가 완료되지 않았습니다.
          <br />
          언제든지 다시 시도할 수 있습니다.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link
            href="/credits"
            style={{
              display: "block",
              padding: "12px 0",
              background: "var(--color-accent)",
              color: "var(--color-dark)",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            다시 시도하기
          </Link>
          <Link
            href="/"
            style={{
              display: "block",
              padding: "12px 0",
              background: "transparent",
              color: "var(--color-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              fontWeight: 500,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
