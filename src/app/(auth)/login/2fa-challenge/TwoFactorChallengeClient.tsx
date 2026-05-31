"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface Props {
  email: string;
  redirectTo: string;
}

export default function TwoFactorChallengeClient({ email, redirectTo }: Props) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("TwoFactorChallenge");

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialSendRef = useRef(false);

  function startResendCountdown() {
    setResendCountdown(300);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function sendCode() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/2fa/send-code", { method: "POST" });
    const json = (await res.json()) as { challenge_id?: string; error?: string };
    setLoading(false);
    if (json.challenge_id) {
      setChallengeId(json.challenge_id);
      startResendCountdown();
      return true;
    }
    setError(json.error ?? t("sendFailed"));
    return false;
  }

  // 페이지 진입 시 자동 발송 (1회만)
  useEffect(() => {
    if (initialSendRef.current) return;
    initialSendRef.current = true;
    sendCode();
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeId) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_id: challengeId, code }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      remaining_attempts?: number;
    };

    if (json.ok) {
      toast.success(t("verifySuccess"));
      router.push(redirectTo);
      router.refresh();
      return;
    }

    const remaining = json.remaining_attempts;
    if (remaining !== undefined && remaining <= 0) {
      setError(t("attemptsExceeded"));
      const supabase = createClient();
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    setError(
      remaining !== undefined
        ? t("invalidCodeWithRemaining", { count: remaining })
        : json.error ?? t("invalidCode")
    );
    setLoading(false);
  }

  async function handleResend() {
    if (resendCountdown > 0) return;
    const ok = await sendCode();
    if (ok) {
      setCode("");
      toast.success(t("resendSuccess"));
    }
  }

  async function handleCancel() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 24,
            color: "var(--color-text)",
            letterSpacing: "-0.03em",
            marginBottom: 10,
          }}
        >
          {t("title")}
        </h1>
        <p
          style={{
            fontSize: 14,
            fontFamily: "var(--font-body)",
            color: "var(--color-dim)",
            lineHeight: 1.6,
          }}
        >
          {t.rich("subtitle", {
            email,
            strong: (chunks) => (
              <strong style={{ color: "var(--color-text)" }}>{chunks}</strong>
            ),
          })}
        </p>
      </div>

      <form
        onSubmit={handleVerify}
        style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}
      >
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          placeholder={t("codePlaceholder")}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          disabled={loading || !challengeId}
          autoFocus
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            backgroundColor: "oklch(0.12 0.005 280 / 0.6)",
            color: "var(--color-text)",
            fontSize: 22,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "0.3em",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {error && (
          <p style={{ fontSize: 13, color: "oklch(0.65 0.2 25)", margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6 || !challengeId}
          style={{
            width: "100%",
            padding: "12px 20px",
            borderRadius: "var(--radius-lg)",
            backgroundColor:
              loading || code.length !== 6 || !challengeId
                ? "oklch(0.75 0.18 110 / 0.4)"
                : "var(--color-accent)",
            border: "none",
            color: "oklch(0.1 0 0)",
            fontSize: 15,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            cursor:
              loading || code.length !== 6 || !challengeId ? "not-allowed" : "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          {loading ? t("verifying") : t("verifyButton")}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCountdown > 0 || loading}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 13,
            fontFamily: "var(--font-body)",
            color: resendCountdown > 0 ? "var(--color-dim)" : "var(--color-accent)",
            cursor: resendCountdown > 0 ? "default" : "pointer",
            textDecoration: resendCountdown > 0 ? "none" : "underline",
            textUnderlineOffset: 2,
          }}
        >
          {resendCountdown > 0
            ? t("resendCountdown", {
                time: `${Math.floor(resendCountdown / 60)}:${String(resendCountdown % 60).padStart(2, "0")}`,
              })
            : t("resendButton")}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 13,
            fontFamily: "var(--font-body)",
            color: "var(--color-dim)",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          {t("cancelButton")}
        </button>
      </div>
    </>
  );
}
