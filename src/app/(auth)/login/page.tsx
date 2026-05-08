"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui";
import { signInWithGoogle, signInWithEmail } from "@/lib/supabase/auth";
import { ROLE_HOME } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/db/types";
import TestLoginPanel from "./TestLoginPanel";

// TestLoginPanel이 내부에서 환경 가드를 직접 처리 (production 자동 차단).

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth") {
      toast.error("인증이 필요합니다. 로그인해 주세요.");
    } else if (err === "auth_missing_code") {
      toast.error("인증 정보가 없습니다. 다시 시도해 주세요.");
    }
  }, [searchParams, toast]);

  async function handleGoogleLogin() {
    setLoading(true);
    await signInWithGoogle();
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setLoading(true);

    const { data, error } = await signInWithEmail(email, password);

    if (error || !data.user) {
      setEmailError("이메일 또는 비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single<{ role: UserRole | null }>();

    if (!profile?.role) {
      router.push("/onboarding/role");
    } else {
      router.push(ROLE_HOME[profile.role] ?? "/");
    }
  }

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .auth-left-panel { display: none !important; }
          .auth-outer { flex-direction: column !important; }
        }
      `}</style>

      <div
        className="auth-outer"
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-black)",
        }}
      >
        {/* ═══════════════════════════════════════════════════════════
            LEFT HALF — Editorial pull-quote panel
        ═══════════════════════════════════════════════════════════ */}
        <div
          className="auth-left-panel"
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: "var(--color-dark)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 56px 52px",
            overflow: "hidden",
          }}
        >
          {/* Grain texture overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Subtle gradient */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 90% 70% at 35% 45%, oklch(0.2 0.008 280 / 0.6) 0%, transparent 70%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Accent glow — bottom left */}
          <div
            style={{
              position: "absolute",
              bottom: "-80px",
              left: "-60px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, oklch(0.91 0.2 110 / 0.06) 0%, transparent 70%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* ── Top: Logo wordmark ── */}
          <div style={{ position: "relative", zIndex: 1, animation: "var(--animate-fade-in)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "oklch(0.1 0 0)" }}>
                  <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "var(--color-text)",
                  letterSpacing: "-0.02em",
                }}
              >
                Get It Done
              </span>
            </div>
          </div>

          {/* ── Center: Pull-quote ── */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              animation: "var(--animate-slide-up)",
              animationDelay: "0.1s",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "120px",
                lineHeight: 0.8,
                color: "oklch(0.91 0.2 110 / 0.12)",
                marginBottom: "8px",
                marginLeft: "-8px",
                userSelect: "none",
              }}
            >
              &ldquo;
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: "28px",
                lineHeight: 1.35,
                color: "var(--color-text)",
                letterSpacing: "-0.025em",
                marginBottom: "20px",
              }}
            >
              Get It Done at Work는 단순한 멘토링이 아닙니다.
              <br />
              실제{" "}
              <span style={{ color: "var(--color-accent)", position: "relative", display: "inline-block" }}>
                실행
                <span
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    left: 0,
                    right: 0,
                    height: "2px",
                    backgroundColor: "var(--color-accent)",
                    borderRadius: "2px",
                    opacity: 0.5,
                  }}
                />
              </span>
              을 대신해주는
              <br />
              미국 현지 파트너입니다.
            </h2>

            <p
              style={{
                fontSize: "14px",
                fontFamily: "var(--font-body)",
                color: "var(--color-dim)",
                lineHeight: 1.7,
                maxWidth: "360px",
              }}
            >
              탑-티어 MBA 학생과 직접 연결되어, 시장 조사부터 파트너십 체결까지
              현지에서 직접 실행합니다.
            </p>
          </div>

          {/* ── Bottom: Testimonial card ── */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              animation: "var(--animate-slide-up)",
              animationDelay: "0.2s",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "1px",
                backgroundColor: "oklch(0.91 0.2 110 / 0.4)",
                marginBottom: "20px",
              }}
            />

            <div
              style={{
                backgroundColor: "oklch(0.18 0.006 280 / 0.7)",
                border: "1px solid oklch(0.24 0.008 280 / 0.8)",
                borderRadius: "var(--radius-xl)",
                padding: "20px 22px",
                backdropFilter: "blur(8px)",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-body)",
                  fontStyle: "italic",
                  color: "oklch(0.75 0.005 280)",
                  lineHeight: 1.65,
                  marginBottom: "16px",
                }}
              >
                "Get It Done 덕분에 Wharton MBA 파트너와 3주 만에 파일럿 계약을 체결했습니다.
                혼자였다면 6개월은 걸렸을 일입니다."
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "12px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "oklch(0.1 0 0)",
                  }}
                >
                  김
                </div>

                <div>
                  <p style={{ fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", lineHeight: 1.3 }}>
                    김재원
                  </p>
                  <p style={{ fontSize: "11px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.3 }}>
                    CEO · Nexlayer AI
                  </p>
                </div>

                <div style={{ marginLeft: "auto", color: "var(--color-gold)", fontSize: "12px", letterSpacing: "1px" }}>
                  ★★★★★
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT HALF — Google-only login panel
        ═══════════════════════════════════════════════════════════ */}
        <div
          style={{
            flex: 1,
            backgroundColor: "var(--color-card)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 56px",
            overflowY: "auto",
            position: "relative",
          }}
        >
          {/* Subtle top-right glow */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, oklch(0.65 0.15 250 / 0.05) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              margin: "0 auto",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* ── Logo ── */}
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

            {/* ── Heading ── */}
            <div style={{ marginBottom: "40px", animation: "var(--animate-slide-up)", animationDelay: "0.05s" }}>
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
                Get It Done에 로그인
              </h1>
              <p style={{ fontSize: "14px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
                한국 스타트업과 미국 MBA를 실행으로 연결합니다
              </p>
            </div>

            {/* ── Google login button ── */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px 20px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                fontSize: "15px",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                transition: "border-color 0.15s ease, background-color 0.15s ease",
                marginBottom: "32px",
                animation: "var(--animate-slide-up)",
                animationDelay: "0.1s",
                opacity: loading ? 0.65 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.4 0.008 280)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.14 0.005 280 / 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading ? "연결 중..." : "Google로 계속하기"}
            </button>

            {/* ── 구분선 ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
                animation: "var(--animate-slide-up)",
                animationDelay: "0.15s",
              }}
            >
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
              <span style={{ fontSize: "12px", fontFamily: "var(--font-body)", color: "var(--color-dim)", whiteSpace: "nowrap" }}>
                또는 이메일로 로그인
              </span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
            </div>

            {/* ── 이메일/비밀번호 폼 ── */}
            <form
              onSubmit={handleEmailLogin}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "24px",
                animation: "var(--animate-slide-up)",
                animationDelay: "0.2s",
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
              <input
                type="password"
                required
                minLength={6}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

              {emailError && (
                <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "oklch(0.65 0.2 25)", margin: 0 }}>
                  {emailError}
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
                {loading ? "로그인 중..." : "이메일로 로그인"}
              </button>
            </form>

            {/* ── 보조 링크 ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
                animation: "var(--animate-slide-up)",
                animationDelay: "0.25s",
              }}
            >
              <Link
                href="/forgot-password"
                style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-dim)",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                비밀번호를 잊으셨나요?
              </Link>
              <Link
                href="/signup"
                style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-dim)",
                  textDecoration: "none",
                }}
              >
                계정이 없으신가요?{" "}
                <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>회원가입</span>
              </Link>
            </div>

            {/* ── 이용약관 ── */}
            <p
              style={{
                textAlign: "center",
                fontSize: "12px",
                fontFamily: "var(--font-body)",
                color: "var(--color-dim)",
                lineHeight: 1.6,
                marginBottom: "32px",
                animation: "var(--animate-slide-up)",
                animationDelay: "0.3s",
              }}
            >
              로그인하면{" "}
              <Link
                href="/terms"
                style={{ color: "var(--color-dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                이용약관
              </Link>
              과{" "}
              <Link
                href="/privacy"
                style={{ color: "var(--color-dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                개인정보처리방침
              </Link>
              에 동의하게 됩니다
            </p>

            {/* ── 개발자 전용 퀵로그인 패널 (TestLoginPanel 내부에서 환경 가드 처리) ── */}
            <TestLoginPanel />
          </div>
        </div>
      </div>
    </>
  );
}
