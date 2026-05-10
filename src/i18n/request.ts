import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    const locale =
      cookieLocale === "en" || cookieLocale === "ko"
        ? cookieLocale
        : routing.defaultLocale;

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
