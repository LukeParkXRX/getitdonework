"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CookieSettingsButton } from "@/components/legal/CookieConsentBanner";

export default function Footer() {
  const t = useTranslations("Footer");

  const FOOTER_LINKS = {
    [t("catPlatform")]: [
      { label: t("findEnabler"), href: "/enablers" },
      { label: t("programIntro"), href: "/program" },
      { label: t("creditGuide"), href: "/credits" },
      { label: t("corporateService"), href: "/organizations" },
    ],
    [t("catResources")]: [
      { label: t("insights"), href: "/insights" },
      { label: t("successCases"), href: "/cases" },
      { label: t("faq"), href: "/faq" },
    ],
    [t("catCompany")]: [
      { label: t("about"), href: "/about" },
      { label: t("careers"), href: "/careers" },
      { label: t("contact"), href: "/contact" },
    ],
  };

  return (
    <footer className="relative" style={{ borderTop: "1px solid var(--color-border)" }}>
      {/* accent gradient top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.91 0.2 110 / 0.35), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 w-fit">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "oklch(0.1 0 0)",
                  fontFamily: "var(--font-display)",
                }}
              >
                G
              </span>
              <span
                className="text-[16px] font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
              >
                Get It Done
              </span>
            </Link>
            <p
              className="text-[15px] leading-relaxed max-w-[280px] whitespace-pre-line"
              style={{ color: "var(--color-dim)" }}
            >
              {t("tagline")}
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              {[
                { label: "LinkedIn", icon: "in", href: "https://linkedin.com/company/getitdonework" },
                { label: "X", icon: "𝕏", href: "https://x.com/getitdonework" },
                { label: t("emailLabel"), icon: "@", href: "mailto:hello@getitdonework.com" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-all duration-200 hover:border-accent hover:text-accent"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-dim)" }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([cat, links]) => (
            <div key={cat}>
              <h3
                className="text-[13px] font-bold uppercase tracking-widest mb-4"
                style={{ color: "var(--color-accent)" }}
              >
                {cat}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] transition-colors duration-150 hover:text-text"
                      style={{ color: "var(--color-dim)" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="h-px mb-6" style={{ backgroundColor: "var(--color-border)" }} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs" style={{ color: "var(--color-dim)" }}>
              © {new Date().getFullYear()} Get It Done at Work. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "var(--color-dim)", marginTop: 4 }}>
              (주)엑스알엑스 | 대표: 박규현 | 사업자등록번호: 000-00-00000 | 서울특별시 강남구
            </p>
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: t("privacy"), href: "/privacy" },
              { label: t("terms"), href: "/terms" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs transition-colors duration-150 hover:text-text"
                style={{ color: "var(--color-dim)" }}
              >
                {item.label}
              </Link>
            ))}
            <CookieSettingsButton label="Cookie 설정" />
          </div>
        </div>
      </div>
    </footer>
  );
}
