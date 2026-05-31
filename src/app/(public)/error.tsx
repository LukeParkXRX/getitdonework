"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");
  return (
    <div
      style={{
        padding: "80px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
        gap: 12,
        minHeight: "50vh",
        justifyContent: "center",
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
        {t("title")}
      </h2>
      <p style={{ color: "var(--color-dim)", fontSize: 14, maxWidth: 400, margin: "4px 0 8px" }}>
        {error.message || t("fallbackMessage")}
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
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
          {t("retry")}
        </button>
        <Link
          href="/"
          style={{
            padding: "10px 24px",
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
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
