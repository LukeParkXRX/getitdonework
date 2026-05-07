import { createServerSupabaseClient } from "@/lib/supabase/server";
import CreditsPageClient from "./CreditsPageClient";

export const metadata = {
  title: "크레딧 시스템 — Get It Done at Work",
  description:
    "Get It Done at Work의 크레딧은 기관이 구매하고 스타트업이 사용하는 세션 단위 화폐입니다.",
};

export default async function CreditsPage() {
  const supabase = await createServerSupabaseClient();

  // 로그인 여부 확인 (구매 버튼 표시 조건)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 역할 확인
  let role: string | null = null;
  if (user) {
    const { data: profile } = await db
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  // 활성 패키지 조회 (공개 RLS: is_active=true만)
  const { data: packages } = await db
    .from("credit_packages")
    .select("id, name, credits, price_krw, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <CreditsPageClient
      packages={packages ?? []}
      isLoggedIn={Boolean(user)}
      isStartup={role === "startup"}
    />
  );
}
