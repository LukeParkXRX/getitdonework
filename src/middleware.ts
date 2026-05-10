import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/admin",
  "/bookings",
  "/matching",
  "/meeting",
  "/my",
  "/onboarding",
  "/org",
  "/projects",
  "/session",
  "/settings",
] as const;

const AUTH_ROUTES = ["/login", "/signup"] as const;

const SUPPORTED_LOCALES = ["ko", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isAuthRoute(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname);
}

function localeFromCountry(country: string | undefined): Locale | null {
  if (!country) return null;
  const upper = country.toUpperCase();
  if (upper === "KR") return "ko";
  if (upper === "US") return "en";
  return null;
}

function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "ko";
  const langs = header
    .toLowerCase()
    .split(",")
    .map((s) => s.split(";")[0].trim());
  for (const l of langs) {
    if (l.startsWith("ko")) return "ko";
    if (l.startsWith("en")) return "en";
  }
  return "ko";
}

function detectLocale(req: NextRequest): Locale {
  // 1) 수동 선택 쿠키 우선
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale === "ko" || cookieLocale === "en") {
    return cookieLocale;
  }

  // 2) Vercel geo header (배포 환경)
  const country =
    req.headers.get("x-vercel-ip-country") ?? undefined;
  const fromCountry = localeFromCountry(country);
  if (fromCountry) return fromCountry;

  // 3) Accept-Language fallback
  return localeFromAcceptLanguage(req.headers.get("accept-language"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // RSC prefetch 최우선 우회 (503 방지)
  if (
    req.nextUrl.searchParams.has("_rsc") ||
    req.headers.get("RSC") === "1"
  ) {
    return NextResponse.next();
  }

  // 정적/에셋 안전망
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 1) Supabase 세션 갱신
  const { user, supabaseResponse } = await updateSession(req);

  // 2) API — 각 route handler가 401 처리
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // 3) 로그인 유저가 /login·/signup 진입 → /my
  // 베타: NEXT_PUBLIC_SHOW_TEST_DATA=true 면 /login 자동 redirect 안 함 (역할 전환 가능)
  const betaPanelOn = process.env.NEXT_PUBLIC_SHOW_TEST_DATA === "true";
  if (user && isAuthRoute(pathname) && !betaPanelOn) {
    return NextResponse.redirect(new URL("/my", req.url));
  }

  // 4) 비로그인 유저가 보호 경로 진입 → /login?redirect=...
  if (!user && isProtected(pathname)) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 5) locale 쿠키가 없을 때만 자동 감지해서 set
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale !== "ko" && cookieLocale !== "en") {
    const detected = detectLocale(req);
    supabaseResponse.cookies.set({
      name: "NEXT_LOCALE",
      value: detected,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|favicon\\.ico|opengraph-image|.*\\..*).*)",
  ],
};
