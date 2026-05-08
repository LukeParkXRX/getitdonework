import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

// NOTE: next-intl 미들웨어는 일시 비활성.
// 사유: 페이지 구조가 src/app/[locale]/... 로 마이그레이션되지 않은 상태에서
// next-intl을 적용하면 모든 (public) 페이지가 404 반환됨.
// 회사 측에서 [locale] 라우트 마이그레이션 완료 후 다시 활성화 필요.

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

  // 5) 일반 통과
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|favicon\\.ico|opengraph-image|.*\\..*).*)",
  ],
};
