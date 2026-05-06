"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { signOut } from "@/lib/supabase/auth";
import NotificationBell from "@/components/layout/NotificationBell";

type Role = "startup" | "enabler" | "org_admin" | "super_admin";


const GUEST_NAV_LINKS = [
  { label: "Enabler 찾기", href: "/enablers" },
  { label: "프로젝트 등록", href: "/projects/new" },
  { label: "인사이트", href: "/insights" },
  { label: "기업 서비스", href: "/organizations" },
];

// 화상 세션은 본인 예약(booking)에 한해서만 입장 가능. 메뉴에서는 제거하고
// 각 역할의 대시보드 "다가오는 세션" 카드에서 booking 단위로 진입한다.
const ROLE_NAV_LINKS: Record<Role, { label: string; href: string }[]> = {
  startup: [
    { label: "Enabler 찾기", href: "/enablers" },
    { label: "매칭", href: "/matching" },
    { label: "내 대시보드", href: "/my" },
    { label: "인사이트", href: "/insights" },
  ],
  enabler: [
    { label: "내 대시보드", href: "/enabler-dashboard" },
    { label: "세션 관리", href: "/session" },
    { label: "인사이트", href: "/insights" },
  ],
  org_admin: [
    { label: "기관 대시보드", href: "/org/dashboard" },
    { label: "크레딧 관리", href: "/org/credits" },
    { label: "세션 이력", href: "/org/dashboard" },
    { label: "인사이트", href: "/insights" },
  ],
  super_admin: [
    { label: "관리자 패널", href: "/admin/dashboard" },
    { label: "기관 관리", href: "/admin/organizations" },
    { label: "Enabler 관리", href: "/admin/enablers" },
    { label: "사용자", href: "/admin/users" },
  ],
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isLoggedIn = !!user;
  const currentRole = (profile?.role || "startup") as Role;

  const displayName = profile?.full_name || user?.email || "";
  const avatarUrl = profile?.avatar_url || "";

  const activeLinks = isLoggedIn ? ROLE_NAV_LINKS[currentRole] : GUEST_NAV_LINKS;

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 모바일 메뉴 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: "56px",
          backgroundColor: scrolled
            ? "oklch(0.1 0 0 / 0.92)"
            : "oklch(0.1 0 0 / 0.6)",
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
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text)",
              }}
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
                style={{
                  color: "var(--color-dim)",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--color-text)";
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "var(--color-card)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--color-dim)";
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    "transparent";
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 우측 액션 — 데스크탑 */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {isLoggedIn ? (
              <>
                {/* 알림 벨 */}
                <NotificationBell />

                {/* 유저 아바타 + 이름 */}
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
                  <span
                    style={{
                      color: "var(--color-dim)",
                      fontSize: "14px",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {displayName}
                  </span>
                </div>

                {/* 로그아웃 */}
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
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--color-text)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-dim)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--color-dim)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-border)";
                  }}
                >
                  로그아웃
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
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "var(--color-text)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "var(--color-dim)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "var(--color-dim)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "var(--color-border)";
                  }}
                >
                  로그인
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-[15px] rounded-md font-bold transition-all duration-150"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "oklch(0.1 0 0)",
                    fontFamily: "var(--font-display)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
                  }}
                >
                  시작하기
                </Link>
              </>
            )}
          </div>

          {/* 햄버거 — 모바일 */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-md transition-colors duration-150"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            style={{ backgroundColor: menuOpen ? "var(--color-card)" : "transparent" }}
          >
            <span
              className="block h-[1.5px] w-5 rounded-full transition-all duration-300 origin-center"
              style={{
                backgroundColor: "var(--color-text)",
                transform: menuOpen
                  ? "translateY(6.5px) rotate(45deg)"
                  : "none",
              }}
            />
            <span
              className="block h-[1.5px] w-5 rounded-full transition-all duration-200"
              style={{
                backgroundColor: "var(--color-text)",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block h-[1.5px] w-5 rounded-full transition-all duration-300 origin-center"
              style={{
                backgroundColor: "var(--color-text)",
                transform: menuOpen
                  ? "translateY(-6.5px) rotate(-45deg)"
                  : "none",
              }}
            />
          </button>
        </div>
      </header>

      {/* 모바일 드로어 */}
      <div
        className="fixed inset-0 z-40 md:hidden transition-all duration-300"
        style={{
          pointerEvents: menuOpen ? "auto" : "none",
          opacity: menuOpen ? 1 : 0,
        }}
        aria-hidden={!menuOpen}
      >
        {/* 딤 오버레이 */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "oklch(0 0 0 / 0.6)" }}
          onClick={() => setMenuOpen(false)}
        />

        {/* 드로어 패널 */}
        <nav
          className="absolute top-[56px] left-0 right-0 flex flex-col p-4 gap-1 transition-transform duration-300"
          style={{
            backgroundColor: "var(--color-dark)",
            borderBottom: "1px solid var(--color-border)",
            transform: menuOpen ? "translateY(0)" : "translateY(-8px)",
          }}
          aria-label="모바일 메뉴"
        >
          {/* 로그인 상태 — 유저 정보 헤더 */}
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
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = "none";
                    }}
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
                  <p
                    style={{
                      color: "var(--color-text)",
                      fontSize: "14px",
                      fontFamily: "var(--font-body)",
                      fontWeight: "600",
                      margin: 0,
                    }}
                  >
                    {displayName}
                  </p>
                  <p
                    style={{
                      color: "var(--color-dim)",
                      fontSize: "12px",
                      fontFamily: "var(--font-body)",
                      margin: 0,
                    }}
                  >
                    {currentRole === "startup" ? "스타트업" : currentRole === "enabler" ? "Enabler" : currentRole === "org_admin" ? "기관 관리자" : "관리자"}
                  </p>
                </div>
              </div>
              <div
                className="h-px mx-4 mb-1"
                style={{ backgroundColor: "var(--color-border)" }}
              />
            </>
          )}

          {activeLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm rounded-md transition-colors duration-150"
              style={{
                color: "var(--color-dim)",
                fontFamily: "var(--font-body)",
              }}
            >
              {link.label}
            </Link>
          ))}

          <div
            className="h-px my-2"
            style={{ backgroundColor: "var(--color-border)" }}
          />

          {isLoggedIn ? (
            <button
              onClick={() => {
                handleSignOut();
                setMenuOpen(false);
              }}
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
              로그아웃
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm rounded-md border transition-colors duration-150"
                style={{
                  color: "var(--color-dim)",
                  borderColor: "var(--color-border)",
                  fontFamily: "var(--font-body)",
                }}
              >
                로그인
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm rounded-md font-bold text-center mt-1"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "oklch(0.1 0 0)",
                  fontFamily: "var(--font-display)",
                }}
              >
                시작하기
              </Link>
            </>
          )}
        </nav>
      </div>


      {/* 56px 상단 여백 보정용 placeholder — 필요한 페이지에서 사용 */}
      {/* <div style={{ height: "56px" }} /> */}
    </>
  );
}
