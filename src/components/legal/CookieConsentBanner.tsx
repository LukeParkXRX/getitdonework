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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-2xl w-full px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-zinc-300 flex-1">
          이 사이트는 서비스 개선을 위해 쿠키와 분석 도구를 사용합니다.{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 text-zinc-400 hover:text-white transition-colors"
          >
            개인정보처리방침
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            거부
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm rounded-lg bg-white text-black font-medium hover:bg-zinc-100 transition-colors"
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
}
