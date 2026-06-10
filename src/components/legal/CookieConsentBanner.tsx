"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export const CONSENT_KEY = "cookieConsent";
export const CONSENT_VERSION = "2.0";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string;
  version: string;
};

const COOKIE_COPY = {
  ko: {
    banner: "이 사이트는 서비스 개선을 위해 쿠키와 분석 도구를 사용합니다.",
    settings: "설정",
    decline: "거부",
    accept: "동의",
    modalTitle: "Cookie 설정",
    modalDescription: "카테고리별로 쿠키 사용을 설정하세요.",
    necessaryTitle: "필수 쿠키",
    necessaryDescription: "로그인, 보안, 기본 기능에 필요합니다. 비활성화할 수 없습니다.",
    analyticsTitle: "분석 쿠키",
    analyticsDescription: "Google Analytics 등을 통해 방문자 행동을 분석하고 서비스를 개선합니다.",
    marketingTitle: "마케팅 쿠키",
    marketingDescription: "이메일 다이제스트, 광고 최적화 등 마케팅 목적으로 사용합니다.",
    cancel: "취소",
    save: "저장",
  },
  en: {
    banner: "We use cookies and analytics tools to improve this service.",
    settings: "Settings",
    decline: "Decline",
    accept: "Accept",
    modalTitle: "Cookie settings",
    modalDescription: "Choose which cookie categories you want to allow.",
    necessaryTitle: "Necessary cookies",
    necessaryDescription: "Required for sign-in, security, and core site features. These cannot be disabled.",
    analyticsTitle: "Analytics cookies",
    analyticsDescription: "Help us understand site usage and improve the service.",
    marketingTitle: "Marketing cookies",
    marketingDescription: "Used for email digest optimization and marketing-related improvements.",
    cancel: "Cancel",
    save: "Save",
  },
} as const;

function getInitialCookieLanguage(): keyof typeof COOKIE_COPY {
  if (typeof window === "undefined") return "ko";

  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname;
  const role = params.get("role");
  const redirect = params.get("redirect") ?? "";
  const next = params.get("next") ?? "";
  const localeCookie = document.cookie.match(/NEXT_LOCALE=(\w+)/)?.[1];
  const isEnablerAuthEntry =
    (pathname === "/login" || pathname === "/signup") &&
    (role === "enabler" ||
      redirect.startsWith("/enabler-dashboard") ||
      next.startsWith("/enabler-dashboard"));

  if (isEnablerAuthEntry || localeCookie === "en") return "en";
  return "ko";
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    // 구버전 (단순 string) 무시
    if (typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean, marketing: boolean) {
  const consent: CookieConsent = {
    necessary: true,
    analytics,
    marketing,
    acceptedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  return consent;
}

export function CookieConsentBanner({ gaId }: { gaId?: string }) {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);
  const [marketingOn, setMarketingOn] = useState(false);
  const [language, setLanguage] = useState<keyof typeof COOKIE_COPY>("ko");

  const copy = COOKIE_COPY[language];

  useEffect(() => {
    setLanguage(getInitialCookieLanguage());
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    } else {
      applyGaConsent(stored.analytics, gaId);
    }
  }, [gaId]);

  function applyGaConsent(analytics: boolean, id?: string) {
    if (!id) return;
    (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = !analytics;
  }

  function handleAcceptAll() {
    const consent = saveConsent(true, true);
    applyGaConsent(consent.analytics, gaId);
    setVisible(false);
    setShowModal(false);
  }

  function handleDeclineAll() {
    const consent = saveConsent(false, false);
    applyGaConsent(consent.analytics, gaId);
    setVisible(false);
    setShowModal(false);
  }

  function handleSaveSettings() {
    const consent = saveConsent(analyticsOn, marketingOn);
    applyGaConsent(consent.analytics, gaId);
    setVisible(false);
    setShowModal(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* 배너 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 flex justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:max-w-2xl rounded-xl px-4 py-3 sm:px-6 sm:py-4"
          style={{
            backgroundColor: "var(--color-dark)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 -4px 32px oklch(0 0 0 / 0.4)",
            pointerEvents: "auto",
          }}
        >
          <p
            className="flex-1 leading-snug"
            style={{ fontSize: 13, color: "var(--color-dim)" }}
          >
            {copy.banner}{" "}
            <Link
              href="/cookie-policy"
              style={{ color: "var(--color-dim)", textDecoration: "underline" }}
            >
              Cookie Policy
            </Link>
          </p>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg transition-colors duration-150"
              style={{
                padding: "8px 14px",
                fontSize: 13,
                background: "transparent",
                color: "var(--color-dim)",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
              }}
            >
              {copy.settings}
            </button>
            <button
              onClick={handleDeclineAll}
              className="rounded-lg transition-colors duration-150"
              style={{
                padding: "8px 14px",
                fontSize: 13,
                background: "var(--color-card)",
                color: "var(--color-dim)",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
              }}
            >
              {copy.decline}
            </button>
            <button
              onClick={handleAcceptAll}
              className="rounded-lg transition-opacity duration-150 hover:opacity-85"
              style={{
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                background: "var(--color-accent)",
                color: "oklch(0.1 0 0)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {copy.accept}
            </button>
          </div>
        </div>
      </div>

      {/* 설정 모달 */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backgroundColor: "oklch(0 0 0 / 0.6)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              padding: "28px 24px",
              width: "100%",
              maxWidth: 480,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  margin: "0 0 6px",
                }}
              >
                {copy.modalTitle}
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-dim)", margin: 0 }}>
                {copy.modalDescription}
              </p>
            </div>

            {/* Necessary */}
            <CookieCategory
              title={copy.necessaryTitle}
              description={copy.necessaryDescription}
              enabled={true}
              disabled={true}
              onChange={() => {}}
            />

            {/* Analytics */}
            <CookieCategory
              title={copy.analyticsTitle}
              description={copy.analyticsDescription}
              enabled={analyticsOn}
              disabled={false}
              onChange={setAnalyticsOn}
            />

            {/* Marketing */}
            <CookieCategory
              title={copy.marketingTitle}
              description={copy.marketingDescription}
              enabled={marketingOn}
              disabled={false}
              onChange={setMarketingOn}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "9px 18px",
                  fontSize: 13,
                  background: "var(--color-card)",
                  color: "var(--color-dim)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {copy.cancel}
              </button>
              <button
                onClick={handleSaveSettings}
                style={{
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  background: "var(--color-accent)",
                  color: "oklch(0.1 0 0)",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {copy.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CookieCategory({
  title,
  description,
  enabled,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 16px",
        backgroundColor: "var(--color-card)",
        borderRadius: 10,
        border: "1px solid var(--color-border)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--color-dim)", lineHeight: 1.5 }}>{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => !disabled && onChange(!enabled)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundColor: enabled ? "var(--color-accent)" : "var(--color-border)",
          position: "relative",
          flexShrink: 0,
          transition: "background-color 0.2s",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: enabled ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: enabled ? "oklch(0.1 0 0)" : "oklch(0.6 0 0)",
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

/**
 * 푸터 등에서 쿠키 설정을 다시 열 때 사용하는 버튼 컴포넌트.
 * 클릭하면 localStorage의 consent를 지워 배너를 다시 표시.
 */
export function CookieSettingsButton({ label = "Cookie 설정" }: { label?: string }) {
  function handleOpen() {
    localStorage.removeItem(CONSENT_KEY);
    window.location.reload();
  }
  return (
    <button
      onClick={handleOpen}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: "var(--color-dim)",
        fontSize: "inherit",
        fontFamily: "inherit",
        textDecoration: "none",
      }}
      className="text-xs transition-colors duration-150 hover:text-text"
    >
      {label}
    </button>
  );
}
