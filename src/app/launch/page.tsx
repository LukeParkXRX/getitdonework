// /launch — token 없이 직접 접근 시 친절한 안내 페이지

export default function LaunchIndexPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "var(--color-black)",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-lg)",
            backgroundColor: "oklch(0.63 0.2 25 / 0.12)",
            border: "1px solid oklch(0.63 0.2 25 / 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "24px",
          }}
        >
          🔒
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: 12,
          }}
        >
          Invalid Access Link
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: "var(--color-dim)",
            lineHeight: 1.65,
            marginBottom: 8,
          }}
        >
          Please use the secret URL provided to you.
        </p>

        <p
          style={{
            fontSize: "14px",
            color: "oklch(0.52 0.01 280 / 0.6)",
            lineHeight: 1.6,
          }}
        >
          비밀 링크를 통해 접근해주세요.
          <br />
          링크가 없다면 한국 개발팀에 문의하세요.
        </p>
      </div>
    </div>
  );
}
