import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import TwoFactorChallengeClient from "./TwoFactorChallengeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "2단계 인증 — Get It Done at Work",
};

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function TwoFactorChallengePage({ searchParams }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미인증 → 로그인부터
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, two_factor_enabled")
    .eq("id", user.id)
    .single<{ email: string | null; two_factor_enabled: boolean | null }>();

  // 2FA 미사용자가 이 페이지에 오면 홈으로
  if (!profile?.two_factor_enabled) {
    redirect("/");
  }

  const params = await searchParams;
  const redirectTo = params.redirect ?? "/";

  return (
    <TwoFactorChallengeClient
      email={profile.email ?? user.email ?? ""}
      redirectTo={redirectTo}
    />
  );
}
