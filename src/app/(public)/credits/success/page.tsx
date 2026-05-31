import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const revalidate = 86400;

export const metadata = {
  title: "결제 완료 — Get It Done at Work",
};

export default async function CreditsPurchaseSuccessPage() {
  const t = await getTranslations("CreditsResult");
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
            background: "oklch(0.35 0.1 145)",
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
            stroke="oklch(0.85 0.18 145)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
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
          {t("successTitle")}
        </h1>
        <p
          style={{
            color: "var(--color-dim)",
            fontSize: 15,
            lineHeight: 1.7,
            margin: "0 0 36px",
          }}
        >
          {t("successLine1")}
          <br />
          {t("successLine2")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link
            href="/enablers"
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
            {t("findEnablers")}
          </Link>
          <Link
            href="/credits"
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
            {t("backToCredits")}
          </Link>
        </div>
      </div>
    </div>
  );
}
