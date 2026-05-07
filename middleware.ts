import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

const intl = createIntlMiddleware(routing);

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

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isAuthRoute(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 정적/에셋 안전망 (matcher가 대부분 걸러줌)
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // 1) Supabase 세션 갱신 + user 정보
  const { user, supabaseResponse } = await updateSession(req);

  // 2) API는 미들웨어에서 리다이렉트하지 않음 — 각 route handler가 401 처리
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // 3) 로그인 유저가 /login·/signup 진입 → /my
  if (user && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/my", req.url));
  }

  // 4) 비로그인 유저가 보호 경로 진입 → /login?redirect=...
  if (!user && isProtected(pathname)) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 5) intl 처리 (locale prefix/redirect)
  const intlResponse = intl(req);

  // intl이 redirect/rewrite를 요구하면 그것 우선 + Supabase 쿠키 복사
  if (intlResponse.status !== 200) {
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      intlResponse.cookies.set(name, value);
    });
    return intlResponse;
  }

  // 6) 일반 통과 — Supabase 쿠키 응답 + intl headers 병합
  intlResponse.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value);
  });
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|favicon\\.ico|opengraph-image|.*\\..*).*)",
  ],
};
