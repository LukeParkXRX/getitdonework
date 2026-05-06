"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/hooks/useAuth";
import { signOut } from "@/lib/supabase/auth";
import NotificationBell from "@/components/layout/NotificationBell";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";

type Role = "startup" | "enabler" | "org_admin" | "super_admin";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isLoggedIn = !!user;
  const currentRole = (profile?.role || "startup") as Role;

  const displayName = profile?.full_name || user?.email || "";
  const avatarUrl = profile?.avatar_url || "";

  // 번역된 네비 링크 — 훅 내부에서 동적으로 구성
  const GUEST_NAV_LINKS = [
    { label: t("findEnabler"), href: "/enablers" },
    { label: t("registerProject"), href: "/projects/new" },
    { label: t("insights"), href: "/insights" },
    { label: t("corporateService"), href: "/organizations" },
  ];

  const ROLE_NAV_LINKS: Record<Role, { label: string; href: string }[]> = {
    startup: [
      { label: t("findEnabler"), href: "/enablers" },
      { label: t("matching"), href: "/matching" },
      { label: t("myDashboard"), href: "/my" },
      { label: t("insights"), href: "/insights" },
    ],
    enabler: [
      { label: t("enablerDashboard"), href: "/enabler-dashboard" },
      { label: t("sessionManagement"), href: "/session" },
      { label: t("insights"), href: "/insights" },
    ],
    org_admin: [
      { label: t("orgDashboard"), href: "/org/dashboard" },
      { label: t("creditManagement"), href: "/org/credits" },
      { label: t("sessionHistory"), href: "/org/dashboard" },
      { label: t("insights"), href: "/insights" },
    ],
    super_admin: [
      { label: t("adminPanel"), href: "/admin/dashboard" },
      { label: t("orgManagement"), href: "/admin/organizations" },
      { label: t("enablerManagement"), href: "/admin/enablers" },
      { label: t("users"), href: "/admin/users" },
    ],
  };

  const activeLinks = isLoggedIn ? ROLE_NAV_LINKS[currentRole] : GUEST_NAV_LINKS;

  const roleLabel: Record<Role, string> = {
    startup: t("roleStartup"),
    enabler: t("roleEnabler"),
    org_admin: t("roleOrgAdmin"),
    super_admin: t("roleAdmin"),
  };

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: "56px",
          backgroundColor: scrolled ? "oklch(0.1 0 0 / 0.92)" : "oklch(0.1 0 0 / 0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="max-w-7xl mx-auto h-full px-5 flex items-center justify-between gap-6">

          {/* 로고 */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="Get It Done 홈"
          >
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-transform duration-200 group-hover:scale-105"
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

          {/* 센터 네비 — 데스크탑 */}
          <nav className="hidden md:flex items-center gap-1" aria-label="주요 메뉴">
            {activeLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="px-3.5 py-1.5 text-[15px] rounded-md transition-colors duration-150"
                style={{ color: "var(--color-dim)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text)";
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-card)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-dim)";
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 우측 액션 — 데스크탑 */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* 언어 토글 */}
            <LocaleSwitcher />

            {isLoggedIn ? (
              <>
                <NotificationBell />
                <div className="flex items-center gap-2">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      width={32}
                      height={32}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid var(--color-border)",
                      }}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <span
                    style={{
                      display: avatarUrl ? "none" : "flex",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-accent)",
                      color: "oklch(0.1 0 0)",
                      fontSize: "13px",
                      fontWeight: "700",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {displayName.charAt(0)}
                  </span>
                  <span style={{ color: "var(--color-dim)", fontSize: "14px", fontFamily: "var(--font-body)" }}>
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3.5 py-1.5 text-[15px] rounded-md border transition-colors duration-150"
                  style={{
                    color: "var(--color-dim)",
                    borderColor: "var(--color-border)",
                    backgroundColor: "transparent",
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-dim)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                  }}
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-[15px] rounded-md border transition-colors duration-150"
                  style={{
                    color: "var(--color-dim)",
                    borderColor: "var(--color-border)",
                    backgroundColor: "transparent",
                    fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-dim)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-dim)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-border)";
                  }}
                >
                  {t("login")}
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-[15px] rounded-md font-bold transition-all duration-150"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "oklch(0.1 0 0)",
                    fontFamily: "var(--font-display)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
                >
                  {t("start")}
                </Link>
              </>
            )}
          </div>

          {/* 햄버거 — 모바일 */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-md transition-colors duration-150"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={menuOpen}
            style={{ backgroundColor: menuOpen ? "var(--color-card)" : "transparent" }}
          >
            <span
              className="block h-[1.5px] w-5 rounded-full transition-all duration-300 origin-center"
              style={{
                backgroundColor: "var(--color-text)",
                transform: menuOpen ? "translateY(6.5px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block h-[1.5px] w-5 rounded-full transition-all duration-200"
              style={{ backgroundColor: "var(--color-text)", opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block h-[1.5px] w-5 rounded-full transition-all duration-300 origin-center"
              style={{
                backgroundColor: "var(--color-text)",
                transform: menuOpen ? "translateY(-6.5px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </header>

      {/* 모바일 드로어 */}
      <div
        className="fixed inset-0 z-40 md:hidden transition-all duration-300"
        style={{ pointerEvents: menuOpen ? "auto" : "none", opacity: menuOpen ? 1 : 0 }}
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "oklch(0 0 0 / 0.6)" }}
          onClick={() => setMenuOpen(false)}
        />

        <nav
          className="absolute top-[56px] left-0 right-0 flex flex-col p-4 gap-1 transition-transform duration-300"
          style={{
            backgroundColor: "var(--color-dark)",
            borderBottom: "1px solid var(--color-border)",
            transform: menuOpen ? "translateY(0)" : "translateY(-8px)",
          }}
          aria-label="모바일 메뉴"
        >
          {isLoggedIn && (
            <>
              <div className="flex items-center gap-3 px-4 py-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    width={36}
                    height={36}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid var(--color-border)",
                      flexShrink: 0,
                    }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span
                    style={{
                      display: "flex",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-accent)",
                      color: "oklch(0.1 0 0)",
                      fontSize: "14px",
                      fontWeight: "700",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-display)",
                      flexShrink: 0,
                    }}
                  >
                    {displayName.charAt(0)}
                  </span>
                )}
                <div>
                  <p style={{ color: "var(--color-text)", fontSize: "14px", fontFamily: "var(--font-body)", fontWeight: "600", margin: 0 }}>
                    {displayName}
                  </p>
                  <p style={{ color: "var(--color-dim)", fontSize: "12px", fontFamily: "var(--font-body)", margin: 0 }}>
                    {roleLabel[currentRole]}
                  </p>
                </div>
              </div>
              <div className="h-px mx-4 mb-1" style={{ backgroundColor: "var(--color-border)" }} />
            </>
          )}

          {activeLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm rounded-md transition-colors duration-150"
              style={{ color: "var(--color-dim)", fontFamily: "var(--font-body)" }}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px my-2" style={{ backgroundColor: "var(--color-border)" }} />

          {/* 모바일 언어 토글 */}
          <div className="px-4 py-2">
            <LocaleSwitcher />
          </div>

          <div className="h-px my-1" style={{ backgroundColor: "var(--color-border)" }} />

          {isLoggedIn ? (
            <button
              onClick={() => { handleSignOut(); setMenuOpen(false); }}
              className="px-4 py-3 text-sm rounded-md border text-left transition-colors duration-150"
              style={{
                color: "var(--color-dim)",
                borderColor: "var(--color-border)",
                fontFamily: "var(--font-body)",
                backgroundColor: "transparent",
                cursor: "pointer",
                width: "100%",
              }}
            >
              {t("logout")}
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm rounded-md border transition-colors duration-150"
                style={{ color: "var(--color-dim)", borderColor: "var(--color-border)", fontFamily: "var(--font-body)" }}
              >
                {t("login")}
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm rounded-md font-bold text-center mt-1"
                style={{ backgroundColor: "var(--color-accent)", color: "oklch(0.1 0 0)", fontFamily: "var(--font-display)" }}
              >
                {t("start")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
