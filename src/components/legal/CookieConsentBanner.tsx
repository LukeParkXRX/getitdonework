"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "cookieConsent";

export function CookieConsentBanner({
  gaId,
}: {
  gaId?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    } else if (stored === "declined" && gaId) {
      // 이전에 거부한 경우 GA 비활성 유지
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true;
    }
  }, [gaId]);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    if (gaId) {
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = false;
    }
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    if (gaId) {
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true;
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 flex justify-center"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="flex flex-row items-center gap-3 sm:gap-4 w-full sm:max-w-2xl rounded-xl px-4 py-3 sm:px-6 sm:py-4"
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
          이 사이트는 서비스 개선을 위해 쿠키와 분석 도구를 사용합니다.{" "}
          <Link
            href="/privacy"
            style={{ color: "var(--color-dim)", textDecoration: "underline" }}
          >
            개인정보처리방침
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
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
            거부
          </button>
          <button
            onClick={accept}
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
            동의
          </button>
        </div>
      </div>
    </div>
  );
}
