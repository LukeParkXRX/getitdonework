"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: "ko" | "en") {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className="flex items-center rounded-md overflow-hidden shrink-0"
      style={{
        border: "1px solid var(--color-border)",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 150ms",
      }}
    >
      {(["ko", "en"] as const).map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          disabled={isPending}
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
