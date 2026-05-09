"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/supabase/auth";

export default function ForgotPasswordForm() {
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
      setError(err.message ?? "요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
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
          비밀번호 재설정
        </h1>
        <p style={{ fontSize: "14px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
          가입한 이메일 주소를 입력하면 재설정 링크를 보내드립니다.
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
            이메일을 확인하세요.
          </p>
          <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
            재설정 링크를 발송했습니다. 메일이 안 오면 스팸함도 확인해 주세요.
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
            placeholder="이메일"
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
            {loading ? "전송 중..." : "재설정 링크 받기"}
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
          로그인으로 돌아가기
        </Link>
        <Link
          href="/signup"
          style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}
        >
          회원가입
        </Link>
      </div>
    </>
  );
}
