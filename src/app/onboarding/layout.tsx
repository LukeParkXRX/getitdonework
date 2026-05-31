import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 온보딩은 역할 선택 전 단계이므로 requireRole(역할 필요) 대신 인증만 서버에서 검증.
// 비인증 접근 시 클라이언트 리다이렉트 플래시 없이 즉시 /login 으로 보냄.
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirect=/onboarding/role");
  }

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 56 }}>{children}</div>
    </>
  );
}
