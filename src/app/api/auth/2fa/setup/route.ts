/**
 * POST /api/auth/2fa/setup
 * body: { enable: boolean }
 *
 * 2FA 활성화/비활성화 토글.
 * enable=true 시 method='email' 설정.
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { logUserActivity } from "@/lib/user-activity";
import { cookies } from "next/headers";
import { verifyImpersonationToken } from "@/lib/impersonation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Impersonation 중 2FA 변경 차단
  const cookieStore = await cookies();
  const impCookie = cookieStore.get("__impersonate")?.value;
  if (impCookie && verifyImpersonationToken(impCookie)) {
    return NextResponse.json(
      { error: "Impersonation 중에는 2FA 설정을 변경할 수 없습니다." },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { enable: boolean };
    if (typeof body.enable !== "boolean") {
      return NextResponse.json({ error: "enable (boolean) required" }, { status: 400 });
    }

    // service role로 업데이트 (users 테이블 RLS 우회)
    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const { error } = await db
      .from("users")
      .update({
        two_factor_enabled: body.enable,
        two_factor_method: body.enable ? "email" : null,
      })
      .eq("id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 활동 로그
    await logUserActivity(
      db,
      user.id,
      body.enable ? "2fa_enabled" : "2fa_disabled",
      request,
    );

    return NextResponse.json({
      ok: true,
      two_factor_enabled: body.enable,
      two_factor_method: body.enable ? "email" : null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await db
      .from("users")
      .select("two_factor_enabled, two_factor_method")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      two_factor_enabled: data?.two_factor_enabled ?? false,
      two_factor_method: data?.two_factor_method ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
