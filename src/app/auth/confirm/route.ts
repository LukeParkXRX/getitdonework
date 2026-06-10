import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/lib/db/types";
import { ROLE_HOME } from "@/lib/auth/roles";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, localeForRole } from "@/lib/i18n/role-locale";
import { NextResponse, type NextRequest } from "next/server";

// 이메일 인증 링크 처리 (token_hash 방식).
// 발신 도메인(getitdonework.com)과 링크 도메인을 일치시켜 스팸 점수를 낮춘다.
// 기존 /auth/callback(OAuth code 교환)과 달리, 이메일 OTP 토큰을 verifyOtp 로 검증한다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const enablerToken = searchParams.get("enabler_token");

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=auth_missing_token`);
  }

  // callback 라우트와 동일한 쿠키 처리: response 를 먼저 만들고 Supabase 가 직접 쓰게 한다.
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (enablerToken) {
    const { error: claimError } = await (supabase as any).rpc("claim_enabler_application", {
      p_user_id: data.user.id,
      p_signup_token: enablerToken,
    });

    if (claimError) {
      console.error("[auth/confirm] enabler application claim failed:", claimError.message);
      const redirectResponse = NextResponse.redirect(`${origin}/login?role=enabler&error=enabler_claim_failed`);
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c);
      });
      return redirectResponse;
    }
  }

  // 목적지 결정.
  // - 명시적 next(앱 내부 경로)가 있으면 우선.
  // - 비밀번호 재설정/초대는 새 비밀번호 설정 화면으로.
  // - 그 외(가입확인·매직링크·이메일변경)는 역할 기반 홈으로.
  // 역할 조회 (목적지 + 기본 언어 결정에 공용)
  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", data.user.id)
    .single<{ id: string; role: UserRole | null }>();
  const role = profile?.role ?? null;

  const safeNext =
    nextParam && nextParam.startsWith("/") && nextParam !== "/"
      ? nextParam
      : null;

  let destination: string;
  if (safeNext) {
    destination = safeNext;
  } else if (type === "recovery" || type === "invite") {
    destination = "/reset-password";
  } else {
    destination = !role ? "/onboarding/role" : ROLE_HOME[role];
  }

  // verifyOtp 가 설정한 세션 쿠키를 최종 리디렉트 응답으로 이전
  const redirectResponse = NextResponse.redirect(`${origin}${destination}`);
  response.cookies.getAll().forEach((c) => {
    redirectResponse.cookies.set(c.name, c.value, c);
  });
  // 역할 기반 기본 언어 (enabler→en, 그 외→ko)
  redirectResponse.cookies.set(LOCALE_COOKIE, localeForRole(role), {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
  return redirectResponse;
}
