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
 * - 운영 환경에서는 항상 false.
 * - 비운영 환경에서만 NEXT_PUBLIC_SHOW_TEST_DATA=true 또는 super_admin이면 true.
 */
export async function shouldShowTestData(): Promise<boolean> {
  if (isProductionEnv()) return false;

  if (process.env.NEXT_PUBLIC_SHOW_TEST_DATA === "true") return true;

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
