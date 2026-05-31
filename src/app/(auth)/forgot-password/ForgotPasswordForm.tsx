"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/lib/supabase/auth";

export default function ForgotPasswordForm() {
  const t = useTranslations("ForgotPassword");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await requestPasswordReset(email);

    if (err) {
      setError(err.message ?? t("errorGeneric"));
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <>
      {/* Logo */}
      <div style={{ marginBottom: "40px", animation: "var(--animate-fade-in)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ color: "oklch(0.1 0 0)" }}>
              <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--color-text)", letterSpacing: "-0.02em" }}>
            Get It Done
          </span>
        </div>
      </div>

      {/* Heading */}
      <div style={{ marginBottom: "32px", animation: "var(--animate-slide-up)", animationDelay: "0.05s" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "26px",
            color: "var(--color-text)",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            marginBottom: "10px",
          }}
        >
          {t("title")}
        </h1>
        <p style={{ fontSize: "14px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
          {t("subtitle")}
        </p>
      </div>

      {sent ? (
        <div
          style={{
            padding: "20px 22px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "oklch(0.18 0.006 280 / 0.7)",
            border: "1px solid oklch(0.91 0.2 110 / 0.3)",
            animation: "var(--animate-fade-in)",
            marginBottom: "24px",
          }}
        >
          <p style={{ fontSize: "14px", fontFamily: "var(--font-body)", color: "var(--color-text)", lineHeight: 1.7, marginBottom: "8px" }}>
            {t("sentTitle")}
          </p>
          <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
            {t("sentDescription")}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "24px",
            animation: "var(--animate-slide-up)",
            animationDelay: "0.1s",
          }}
        >
          <input
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "oklch(0.12 0.005 280 / 0.6)",
              color: "var(--color-text)",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
              outline: "none",
              boxSizing: "border-box",
              opacity: loading ? 0.65 : 1,
            }}
          />

          {error && (
            <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "oklch(0.65 0.2 25)", margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 20px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--color-accent)",
              border: "none",
              color: "var(--color-black)",
              fontSize: "15px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "-0.01em",
              opacity: loading ? 0.5 : 1,
              transition: "opacity 0.15s ease, filter 0.15s ease",
            }}
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          animation: "var(--animate-slide-up)",
          animationDelay: "0.15s",
        }}
      >
        <Link
          href="/login"
          style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}
        >
          {t("backToLogin")}
        </Link>
        <Link
          href="/signup"
          style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}
        >
          {t("signUp")}
        </Link>
      </div>
    </>
  );
}
