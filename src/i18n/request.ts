import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

    let locale: "en" | "ko";
    if (cookieLocale === "en" || cookieLocale === "ko") {
      // 명시적 선택(스위처) 또는 로그인 시 역할 기반 쿠키 우선
      locale = cookieLocale;
    } else {
      // 쿠키 없으면(첫 방문) 브라우저 언어로 감지 — 영어 브라우저(미국 전문가)는 자동 영어
      const accept = (await headers()).get("accept-language") ?? "";
      const primary = accept.split(",")[0]?.trim().toLowerCase() ?? "";
      locale = primary.startsWith("en") ? "en" : routing.defaultLocale;
    }

    return {
      locale,
      messages: (await import(`../messages/${locale}.json`)).default,
    };
  } catch {
    // RSC prefetch 등에서 쿠키 접근 실패 시 기본값 fallback
    return {
      locale: routing.defaultLocale,
      messages: (await import(`../messages/${routing.defaultLocale}.json`)).default,
    };
  }
});
