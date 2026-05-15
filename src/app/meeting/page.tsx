import Link from "next/link";

export default function MeetingFallbackPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-black)",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          background: "var(--color-card)",
          borderRadius: 16,
          padding: 40,
          border: "1px solid var(--color-border)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "oklch(0.63 0.2 25 / 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-red)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: 10,
          }}
        >
          세션 정보가 없습니다
        </h1>
        <p
          style={{
            color: "var(--color-dim)",
            fontSize: 14,
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          예약된 세션 링크를 통해 입장해 주세요.
        </p>

        <Link
          href="/bookings"
          style={{
            display: "block",
            padding: "13px",
            background: "var(--color-accent)",
            color: "var(--color-black)",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          내 예약 보기
        </Link>
      </div>
    </div>
  );
}
