"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@supabase/ssr";

type Role = "startup" | "enabler" | "org_admin";

interface Step {
  icon: string;
  title: string;
  body: string;
  ctas?: { label: string; href: string }[];
}

type Translate = ReturnType<typeof useTranslations>;

function buildSteps(t: Translate): Record<Role, Step[]> {
  return {
    startup: [
      {
        icon: "01",
        title: t("startupStep1Title"),
        body: t("startupStep1Body"),
      },
      {
        icon: "02",
        title: t("startupStep2Title"),
        body: t("startupStep2Body"),
      },
      {
        icon: "03",
        title: t("startupStep3Title"),
        body: t("startupStep3Body"),
        ctas: [
          { label: t("startupCtaBrowseEnablers"), href: "/enablers" },
          { label: t("startupCtaCreateProfile"), href: "/my" },
        ],
      },
    ],
    enabler: [
      {
        icon: "01",
        title: t("enablerStep1Title"),
        body: t("enablerStep1Body"),
      },
      {
        icon: "02",
        title: t("enablerStep2Title"),
        body: t("enablerStep2Body"),
      },
      {
        icon: "03",
        title: t("enablerStep3Title"),
        body: t("enablerStep3Body"),
        ctas: [
          { label: t("enablerCtaSetupProfile"), href: "/enabler-dashboard/profile" },
          { label: t("enablerCtaConnectPayouts"), href: "/enabler-dashboard/payouts" },
        ],
      },
    ],
    org_admin: [
      {
        icon: "01",
        title: t("orgStep1Title"),
        body: t("orgStep1Body"),
      },
      {
        icon: "02",
        title: t("orgStep2Title"),
        body: t("orgStep2Body"),
      },
      {
        icon: "03",
        title: t("orgStep3Title"),
        body: t("orgStep3Body"),
        ctas: [
          { label: t("orgCtaEditOrg"), href: "/org/settings" },
          { label: t("orgCtaInviteMembers"), href: "/org/members" },
        ],
      },
    ],
  };
}

const DISMISS_KEY = "__onboarding_dismissed";

export default function OnboardingWizard() {
  const t = useTranslations("OnboardingWizard");
  const [visible, setVisible] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // localStorage dismiss 체크
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed === user.id) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { data } = await db
        .from("users")
        .select("role, onboarded_at")
        .eq("id", user.id)
        .maybeSingle();

      if (!data) return;
      if (data.onboarded_at) return; // 이미 완료

      const r = data.role as Role;
      if (!["startup", "enabler", "org_admin"].includes(r)) return;

      setUserId(user.id);
      setRole(r);
      setVisible(true);
    })();
  }, []);

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    try {
      await fetch("/api/users/me/onboarding", { method: "POST" });
    } finally {
      setCompleting(false);
      setVisible(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    if (userId) {
      localStorage.setItem(DISMISS_KEY, userId);
    }
    setVisible(false);
  }, [userId]);

  if (!visible || !role) return null;

  const steps = buildSteps(t)[role];
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface, #1a1a20)",
          border: "1px solid var(--color-border, #2a2a32)",
          borderRadius: "20px",
          padding: "40px",
          maxWidth: "480px",
          width: "100%",
          position: "relative",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={handleDismiss}
          aria-label={t("skip")}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-dim, #6b7280)",
            fontSize: "20px",
            lineHeight: 1,
            padding: "4px",
          }}
        >
          ✕
        </button>

        {/* 단계 번호 */}
        <div
          style={{
            fontFamily: "var(--font-body, sans-serif)",
            fontWeight: 700,
            fontSize: "72px",
            lineHeight: 1,
            color: "var(--color-accent, #c8ff00)",
            marginBottom: "24px",
            letterSpacing: "-3px",
          }}
        >
          {current.icon}
        </div>

        {/* 제목 */}
        <h2
          style={{
            fontFamily: "var(--font-body, sans-serif)",
            fontWeight: 700,
            fontSize: "24px",
            color: "var(--color-text, #f0f0f0)",
            margin: "0 0 14px",
            lineHeight: 1.3,
          }}
        >
          {current.title}
        </h2>

        {/* 본문 */}
        <p
          style={{
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: "15px",
            color: "var(--color-dim, #9ca3af)",
            margin: "0 0 28px",
            lineHeight: 1.7,
          }}
        >
          {current.body}
        </p>

        {/* CTA 링크 (마지막 스텝) */}
        {current.ctas && current.ctas.length > 0 && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "28px", flexWrap: "wrap" }}>
            {current.ctas.map((cta) => (
              <a
                key={cta.href + cta.label}
                href={cta.href}
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  backgroundColor: "var(--color-surface-hover, #25252d)",
                  border: "1px solid var(--color-border, #2a2a32)",
                  color: "var(--color-text, #f0f0f0)",
                  fontFamily: "var(--font-body, sans-serif)",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
                onClick={handleComplete}
              >
                {cta.label}
              </a>
            ))}
          </div>
        )}

        {/* 진행 점 */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor:
                  i === step
                    ? "var(--color-accent, #c8ff00)"
                    : "var(--color-border, #2a2a32)",
                transition: "width 0.2s",
              }}
            />
          ))}
        </div>

        {/* 네비게이션 버튼 */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "1px solid var(--color-border, #2a2a32)",
                background: "none",
                color: "var(--color-dim, #9ca3af)",
                fontFamily: "var(--font-body, sans-serif)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("previous")}
            </button>
          )}
          {!isLast ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                border: "none",
                background: "var(--color-accent, #c8ff00)",
                color: "var(--color-text-on-accent, #0a0a0a)",
                fontFamily: "var(--font-body, sans-serif)",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("next")}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                border: "none",
                background: "var(--color-accent, #c8ff00)",
                color: "var(--color-text-on-accent, #0a0a0a)",
                fontFamily: "var(--font-body, sans-serif)",
                fontSize: "14px",
                fontWeight: 700,
                cursor: completing ? "not-allowed" : "pointer",
                opacity: completing ? 0.7 : 1,
              }}
            >
              {completing ? "..." : t("getStarted")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
