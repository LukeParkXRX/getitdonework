"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { updatePassword } from "@/lib/supabase/auth";
import { validatePassword, PASSWORD_HINT } from "@/lib/utils/password";

export default function ResetPasswordForm() {
  const t = useTranslations("ResetPassword");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const pw = validatePassword(password);
    if (!pw.ok) {
      setError(pw.message);
      return;
    }
    if (password !== confirm) {
      setError(t("error.mismatch"));
      return;
    }

    setLoading(true);
    const { error: err } = await updatePassword(password);

    if (err) {
      setError(err.message ?? t("error.generic"));
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  const eyeOff = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  const eyeOn = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 40px 10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    backgroundColor: "oklch(0.12 0.005 280 / 0.6)",
    color: "var(--color-text)",
    fontSize: "14px",
    fontFamily: "var(--font-body)",
    outline: "none",
    boxSizing: "border-box",
    opacity: loading ? 0.65 : 1,
  };

  const eyeBtnStyle: React.CSSProperties = {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    padding: "2px",
    cursor: "pointer",
    color: "var(--color-dim)",
    display: "flex",
    alignItems: "center",
  };

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
          {t("subtitle", { hint: PASSWORD_HINT })}
        </p>
      </div>

      {done ? (
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
            {t("success.title")}
          </p>
          <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
            {t("success.redirect")}
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
          {/* 새 비밀번호 */}
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={eyeBtnStyle}
              tabIndex={-1}
            >
              {showPassword ? eyeOff : eyeOn}
            </button>
          </div>

          {/* 비밀번호 확인 */}
          <div style={{ position: "relative" }}>
            <input
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              placeholder={t("confirmPlaceholder")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              style={eyeBtnStyle}
              tabIndex={-1}
            >
              {showConfirm ? eyeOff : eyeOn}
            </button>
          </div>

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
              backgroundColor: loading ? "oklch(0.75 0.18 110 / 0.6)" : "var(--color-accent)",
              border: "none",
              color: "oklch(0.1 0 0)",
              fontSize: "15px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>
      )}

      <div style={{ display: "flex", justifyContent: "center", animation: "var(--animate-slide-up)", animationDelay: "0.15s" }}>
        <Link
          href="/login"
          style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}
        >
          {t("backToLogin")}
        </Link>
      </div>
    </>
  );
}
