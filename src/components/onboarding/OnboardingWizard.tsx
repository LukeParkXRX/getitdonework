"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Role = "startup" | "enabler" | "org_admin";

interface Step {
  icon: string;
  title: string;
  body: string;
  ctas?: { label: string; href: string }[];
}

const STEPS: Record<Role, Step[]> = {
  startup: [
    {
      icon: "01",
      title: "환영합니다!",
      body: "Get It Done at Work는 한국 스타트업이 미국 시장에 진출하는 1:1 전문가 매칭 서비스입니다. 현지 MBA·전문가와 직접 연결해 실행 속도를 높이세요.",
    },
    {
      icon: "02",
      title: "토큰으로 세션을 예약하세요",
      body: "토큰 1개 = 세션 1회. 먼저 무료 Chemistry Call (15분)로 매칭 가능 여부를 확인할 수 있습니다. 비용 없이 Enabler와 궁합을 먼저 확인하세요.",
    },
    {
      icon: "03",
      title: "지금 시작하세요",
      body: "Enabler를 둘러보거나, 먼저 프로필을 작성해 매칭 정확도를 높이세요.",
      ctas: [
        { label: "Enabler 둘러보기", href: "/enablers" },
        { label: "프로필 작성", href: "/my" },
      ],
    },
  ],
  enabler: [
    {
      icon: "01",
      title: "Welcome!",
      body: "You'll match with Korean startups expanding to the US market. Your expertise becomes their execution engine.",
    },
    {
      icon: "02",
      title: "Set up your profile & availability",
      body: "Complete your profile so startups can find you. Set your availability and connect your Stripe Connect account to receive payouts.",
    },
    {
      icon: "03",
      title: "Get started",
      body: "Complete your profile and connect payouts to start receiving match requests.",
      ctas: [
        { label: "Set up profile", href: "/my" },
        { label: "Connect payouts", href: "/my" },
      ],
    },
  ],
  org_admin: [
    {
      icon: "01",
      title: "환영합니다!",
      body: "기관 어드민으로 멤버에게 크레딧을 배분할 수 있습니다. 조직 전체의 실행력을 높이세요.",
    },
    {
      icon: "02",
      title: "초대 코드를 공유하세요",
      body: "초대 코드를 멤버에게 공유하세요. 가입 시 자동으로 우리 조직에 합류하고 크레딧을 사용할 수 있습니다.",
    },
    {
      icon: "03",
      title: "지금 시작하세요",
      body: "조직 정보를 편집하거나 멤버를 초대해 팀을 구성하세요.",
      ctas: [
        { label: "조직 정보 편집", href: "/org/settings" },
        { label: "멤버 초대", href: "/org/members" },
      ],
    },
  ],
};

const DISMISS_KEY = "__onboarding_dismissed";

export default function OnboardingWizard() {
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

  const steps = STEPS[role];
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
          aria-label="건너뛰기"
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
              이전
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
              다음
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
              {completing ? "..." : "시작하기"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
