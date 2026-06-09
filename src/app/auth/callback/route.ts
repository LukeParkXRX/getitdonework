import { createServerClient } from "@supabase/ssr";
import type { Database, UserRole } from "@/lib/db/types";
import { ROLE_HOME } from "@/lib/auth/roles";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, localeForRole } from "@/lib/i18n/role-locale";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextOverride = searchParams.get("next");
  const enablerToken = searchParams.get("enabler_token");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_missing_code`);
  }

  // 🔑 핵심: response 객체 먼저 만들고 Supabase가 이 response에 직접 쿠키 쓰도록.
  // NextResponse.redirect() 를 나중에 만들면 exchangeCodeForSession 으로 설정한 쿠키가 사라짐.
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (enablerToken) {
    const { error: claimError } = await (supabase as any).rpc("claim_enabler_application", {
      p_user_id: data.user.id,
      p_signup_token: enablerToken,
    });

    if (claimError) {
      console.error("[auth/callback] enabler application claim failed:", claimError.message);
      const redirectResponse = NextResponse.redirect(`${origin}/login?error=enabler_claim_failed`);
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c);
      });
      return redirectResponse;
    }
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", data.user.id)
    .single<{ id: string; role: UserRole | null }>();

  let destination: string;
  if (!profile?.role) {
    destination = "/onboarding/role";
  } else if (nextOverride) {
    destination = nextOverride;
  } else {
    destination = ROLE_HOME[profile.role];
  }

  // 최종 리디렉트 응답에 exchangeCodeForSession 이 설정한 쿠키를 모두 이전
  const redirectResponse = NextResponse.redirect(`${origin}${destination}`);
  response.cookies.getAll().forEach((c) => {
    redirectResponse.cookies.set(c.name, c.value, c);
  });
  // 역할 기반 기본 언어 (enabler→en, 그 외→ko)
  redirectResponse.cookies.set(LOCALE_COOKIE, localeForRole(profile?.role), {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
  return redirectResponse;
}
