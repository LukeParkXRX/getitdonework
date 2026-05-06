import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

const intl = createIntlMiddleware(routing);

export async function middleware(req: NextRequest) {
  // 1) Supabase 세션 갱신 (쿠키 refresh)
  const { supabaseResponse } = await updateSession(req);

  // 2) intl 미들웨어로 locale prefix/redirect 처리
  const intlResponse = intl(req);

  // intl이 redirect/rewrite를 요구하면 그걸 우선 반환
  if (intlResponse.status !== 200) {
    // Supabase 쿠키가 있으면 intl response에 복사
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      intlResponse.cookies.set(name, value);
    });
    return intlResponse;
  }

  // 일반 통과 — Supabase 쿠키 응답 사용, intl headers 병합
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
