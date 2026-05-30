import type { UserRole } from "@/lib/db/types";

// 역할 기반 기본 언어: enabler(미국 전문가) → 영어, 그 외(스타트업 등) → 한국어.
// 로그인/이메일 인증/콜백 시점에 NEXT_LOCALE 쿠키를 이 값으로 세팅한다.
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년 (routing.ts와 동일)

export function localeForRole(role: UserRole | null | undefined): "en" | "ko" {
  return role === "enabler" ? "en" : "ko";
}
