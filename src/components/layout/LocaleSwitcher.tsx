"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const [pending, setPending] = useState(false);

  function switchLocale(next: "ko" | "en") {
    if (next === locale || pending) return;
    setPending(true);

    // 수동 선택 플래그 — LocaleAutoSync가 덮어쓰지 않도록
    localStorage.setItem("__locale_manual", "true");
    localStorage.setItem("__locale_manual_at", String(Date.now()));

    // 쿠키 직접 set
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    window.location.reload();
  }

  return (
    <div
      className="flex items-center rounded-md overflow-hidden shrink-0"
      style={{
        border: "1px solid var(--color-border)",
        opacity: pending ? 0.6 : 1,
        transition: "opacity 150ms",
      }}
    >
      {(["ko", "en"] as const).map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          disabled={pending}
          style={{
            padding: "4px 10px",
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            letterSpacing: "0.05em",
            cursor: loc === locale ? "default" : "pointer",
            backgroundColor:
              loc === locale ? "var(--color-accent)" : "transparent",
            color:
              loc === locale ? "oklch(0.1 0 0)" : "var(--color-dim)",
            border: "none",
            transition: "all 150ms",
          }}
        >
          {t(loc)}
        </button>
      ))}
    </div>
  );
}
