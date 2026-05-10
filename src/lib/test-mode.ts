import { createServerSupabaseClient } from "./supabase/server";

/**
 * 운영 환경 판별.
 * NEXT_PUBLIC_VERCEL_ENV="production" 또는 NODE_ENV="production" 이면 true.
 */
export function isProductionEnv(): boolean {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

/**
 * 공개 페이지에서 테스트 데이터를 노출할지 판정 (서버 전용).
 * - NEXT_PUBLIC_SHOW_TEST_DATA=true 면 운영 환경이라도 항상 true (베타 기간용).
 * - 비운영 환경에서는 super_admin 이면 true.
 */
export async function shouldShowTestData(): Promise<boolean> {
  // env 명시 활성화: 운영/비운영 무관하게 허용 (베타 기간)
  if (process.env.NEXT_PUBLIC_SHOW_TEST_DATA === "true") return true;

  // 운영 환경에서 env 없으면 차단
  if (isProductionEnv()) return false;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const row = data as { role: string | null } | null;
  return row?.role === "super_admin";
}
