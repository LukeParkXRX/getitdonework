"use client";

export default function EnablerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        padding: "48px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "oklch(0.32 0.12 25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 700,
          color: "oklch(0.75 0.2 25)",
          marginBottom: 4,
        }}
      >
        !
      </div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          margin: 0,
        }}
      >
        Couldn't load the Enabler area
      </h2>
      <p style={{ color: "var(--color-dim)", fontSize: 14, maxWidth: 400, margin: "4px 0 8px" }}>
        {error.message || "Something went wrong while loading this Enabler page."}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "10px 24px",
          backgroundColor: "var(--color-accent)",
          color: "oklch(0.1 0 0)",
          borderRadius: "var(--radius-lg, 8px)",
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          fontSize: 14,
        }}
      >
        Try again
      </button>
    </div>
  );
}
