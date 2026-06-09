"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { signInWithGoogle, signUpWithEmail } from "@/lib/supabase/auth";
import { useToast } from "@/components/ui";
import { validatePassword, PASSWORD_HINT } from "@/lib/utils/password";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/role-locale";

export default function SignupForm() {
  const t = useTranslations("SignupPage");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");
  const urlRole = searchParams.get("role");

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"startup" | "enabler">(
    urlRole === "enabler" ? "enabler" : "startup"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  const tokenSaved = useRef(false);
  const localeForced = useRef(false);
  useEffect(() => {
    if (urlToken && !tokenSaved.current) {
      sessionStorage.setItem("__enabler_signup_token", urlToken);
      tokenSaved.current = true;
    }
  }, [urlToken]);

  useEffect(() => {
    if (urlRole === "enabler" && locale !== "en" && !localeForced.current) {
      localeForced.current = true;
      localStorage.setItem("__locale_manual", "true");
      document.cookie = `${LOCALE_COOKIE}=en; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
      router.refresh();
    }
  }, [locale, router, urlRole]);

  const isEnablerInvite = Boolean(urlToken && urlRole === "enabler");
  const isDirectEnablerSignup = urlRole === "enabler" && !urlToken;

  if (urlRole === "enabler" && locale !== "en") {
    return (
      <div style={{ fontFamily: "var(--font-body)", color: "var(--color-dim)" }}>
        Loading...
      </div>
    );
  }

  async function handleGoogleSignup() {
    if (isDirectEnablerSignup) {
      toast.error(t("enablerApplyRequiredToast"));
      return;
    }
    setLoading(true);
    try {
      await signInWithGoogle({
        enablerSignupToken: isEnablerInvite ? urlToken ?? undefined : undefined,
      });
    } catch {
      setLoading(false);
      toast.error(t("googleSignupFailed"));
    }
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (isDirectEnablerSignup) {
      setFormError(t("enablerApplyRequiredBody"));
      return;
    }

    if (!agreed) {
      setFormError(t("agreeToTermsRequired"));
      return;
    }
    const pw = validatePassword(password);
    if (!pw.ok) {
      setFormError(pw.message);
      return;
    }

    setLoading(true);
    const { error } = await signUpWithEmail(
      email,
      password,
      { full_name: fullName, role },
      { enablerSignupToken: isEnablerInvite ? urlToken ?? undefined : undefined }
    );

    if (error) {
      setFormError(error.message ?? t("signupError"));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <>
      {/* Logo */}
      <div style={{ marginBottom: "32px", animation: "var(--animate-fade-in)" }}>
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

      {/* Enabler 초대 배너 */}
      {isEnablerInvite && (
        <div
          style={{
            backgroundColor: "oklch(0.91 0.2 110 / 0.08)",
            border: "1px solid oklch(0.91 0.2 110 / 0.35)",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "24px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            animation: "var(--animate-fade-in)",
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1, marginTop: "1px", flexShrink: 0 }}>
            &#x2713;
          </span>
          <div>
            <p style={{ fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-accent)", marginBottom: "4px" }}>
              {t("inviteBannerTitle")}
            </p>
            <p style={{ fontSize: "12px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
              {t("inviteBannerBody")}
            </p>
          </div>
        </div>
      )}

      {/* Heading */}
      <div style={{ marginBottom: "28px", animation: "var(--animate-slide-up)", animationDelay: "0.05s" }}>
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
          {t("heading")}
        </h1>
        <p style={{ fontSize: "14px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
          {isDirectEnablerSignup
            ? t("enablerApplyRequiredShort")
            : isEnablerInvite
            ? t("subheadingEnabler")
            : t("subheading")}
        </p>
      </div>

      {isDirectEnablerSignup && (
        <div
          style={{
            padding: "20px 22px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "oklch(0.18 0.006 280 / 0.7)",
            border: "1px solid var(--color-border)",
            animation: "var(--animate-fade-in)",
          }}
        >
          <p style={{ fontSize: "15px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", marginBottom: "8px" }}>
            {t("enablerApplyRequiredTitle")}
          </p>
          <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6, marginBottom: "16px" }}>
            {t("enablerApplyRequiredBody")}
          </p>
          <Link
            href="/enabler-apply"
            style={{
              display: "block",
              textAlign: "center",
              padding: "12px 16px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--color-accent)",
              color: "oklch(0.1 0 0)",
              fontSize: "14px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {t("goToEnablerApply")}
          </Link>
        </div>
      )}

      {/* 이메일 확인 안내 — 성공 */}
      {!isDirectEnablerSignup && success ? (
        <div
          style={{
            padding: "20px 22px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "oklch(0.18 0.006 280 / 0.7)",
            border: "1px solid oklch(0.91 0.2 110 / 0.3)",
            animation: "var(--animate-fade-in)",
          }}
        >
          <p style={{ fontSize: "14px", fontFamily: "var(--font-body)", color: "var(--color-text)", lineHeight: 1.7, marginBottom: "8px" }}>
            {t("emailSentTitle")}
          </p>
          <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
            {t("emailSentBody")}
            {isEnablerInvite && " " + t("emailSentEnablerNote")}
            {" "}{t("emailSentSpamNote")}
          </p>
        </div>
      ) : !isDirectEnablerSignup ? (
        <>
          {/* Google signup button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
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
              marginBottom: "24px",
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
            {loading ? t("connecting") : t("continueWithGoogle")}
          </button>

          {/* 구분선 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
              animation: "var(--animate-slide-up)",
              animationDelay: "0.15s",
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
            <span style={{ fontSize: "12px", fontFamily: "var(--font-body)", color: "var(--color-dim)", whiteSpace: "nowrap" }}>
              {t("orSignupWithEmail")}
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
          </div>

          {/* 이메일/비번 폼 */}
          <form
            onSubmit={handleEmailSignup}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              animation: "var(--animate-slide-up)",
              animationDelay: "0.2s",
            }}
          >
            {/* 이름 */}
            <input
              type="text"
              required
              placeholder={t("namePlaceholder")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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

            {/* 역할 선택 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {(["startup", "enabler"] as const).map((r) => {
                const enablerRequiresInvite = r === "enabler" && !isEnablerInvite;
                return (
                  <label
                    key={r}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${role === r ? "var(--color-accent)" : "var(--color-border)"}`,
                      backgroundColor: role === r ? "oklch(0.91 0.2 110 / 0.08)" : "oklch(0.12 0.005 280 / 0.6)",
                      cursor: (loading || isEnablerInvite || enablerRequiresInvite) ? "not-allowed" : "pointer",
                      transition: "border-color 0.15s ease, background-color 0.15s ease",
                      opacity: enablerRequiresInvite || (isEnablerInvite && r !== "enabler") ? 0.45 : 1,
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => {
                        if (!isEnablerInvite && !enablerRequiresInvite) setRole(r);
                      }}
                      disabled={loading || isEnablerInvite || enablerRequiresInvite}
                      style={{ accentColor: "var(--color-accent)" }}
                    />
                    <span style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
                      {r === "startup" ? t("roleStartup") : t("roleEnabler")}
                    </span>
                  </label>
                );
              })}
            </div>
            {!isEnablerInvite && (
              <p style={{ fontSize: "12px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.5, margin: 0 }}>
                {t("enablerApplyNote")}{" "}
                <Link href="/enabler-apply" style={{ color: "var(--color-accent)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                  {t("goToEnablerApply")}
                </Link>
              </p>
            )}

            {/* 이메일 */}
            <input
              type="email"
              required
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              aria-label={t("emailAriaLabel")}
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

            {/* 비밀번호 */}
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder={t("passwordPlaceholder", { hint: PASSWORD_HINT })}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                aria-label={t("passwordPlaceholder", { hint: PASSWORD_HINT })}
                style={{
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
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
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
                }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* 약관 동의 */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                cursor: "pointer",
                marginTop: "2px",
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={loading}
                style={{ accentColor: "var(--color-accent)", marginTop: "2px", flexShrink: 0 }}
              />
              <span style={{ fontSize: "12px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.6 }}>
                <Link href="/terms" style={{ color: "var(--color-dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}>{t("termsOfService")}</Link>
                {" "}{t("termsAnd")}{" "}
                <Link href="/privacy" style={{ color: "var(--color-dim)", textDecoration: "underline", textUnderlineOffset: "2px" }}>{t("privacyPolicy")}</Link>
                {t("agreeSuffix")}
              </span>
            </label>

            {/* 에러 */}
            {formError && (
              <p role="alert" style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "oklch(0.65 0.2 25)", margin: 0 }}>
                {formError}
              </p>
            )}

            {/* 가입 버튼 */}
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
                marginTop: "4px",
              }}
            >
              {loading ? t("signingUp") : isEnablerInvite ? t("createEnablerAccount") : t("signupWithEmail")}
            </button>
          </form>

          {/* 로그인 링크 */}
          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
              marginTop: "20px",
              animation: "var(--animate-slide-up)",
              animationDelay: "0.25s",
            }}
          >
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              style={{
                color: "var(--color-accent)",
                fontWeight: 600,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.75")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
            >
              {t("login")}
            </Link>
          </p>
        </>
      ) : null}
    </>
  );
}
