/**
 * POST /api/auth/2fa/verify
 * body: { challenge_id: string; code: string }
 *
 * OTP 코드 검증. 성공 시 used_at + users.two_factor_passed_at 기록.
 * 실패 5회 이상이면 challenge 폐기. 보호 라우트는 guards.ts에서
 * two_factor_passed_at 12h 윈도우로 강제.
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { logUserActivity } from "@/lib/user-activity";
import crypto from "crypto";
import { cookies } from "next/headers";
import { verifyImpersonationToken } from "@/lib/impersonation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  // Impersonation 중 2FA 차단
  const cookieStore = await cookies();
  const impCookie = cookieStore.get("__impersonate")?.value;
  if (impCookie && verifyImpersonationToken(impCookie)) {
    return NextResponse.json(
      { error: "Impersonation 중에는 이 작업을 할 수 없습니다." },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { challenge_id: string; code: string };
    if (!body.challenge_id || !body.code) {
      return NextResponse.json({ error: "challenge_id and code required" }, { status: 400 });
    }

    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const { data: challenge, error: fetchError } = await db
      .from("auth_otp_challenges")
      .select("id, user_id, code_hash, expires_at, attempts, used_at")
      .eq("id", body.challenge_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // 이미 사용됨
    if (challenge.used_at) {
      return NextResponse.json({ error: "Code already used" }, { status: 400 });
    }

    // 만료 확인
    if (new Date(challenge.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    // 시도 횟수 초과
    if (challenge.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const inputHash = hashCode(body.code.trim());

    if (inputHash !== challenge.code_hash) {
      // 실패: attempts 증가
      await db
        .from("auth_otp_challenges")
        .update({ attempts: challenge.attempts + 1 })
        .eq("id", challenge.id);

      const remaining = MAX_ATTEMPTS - (challenge.attempts + 1);
      return NextResponse.json(
        { error: "Invalid code", remaining_attempts: remaining },
        { status: 401 },
      );
    }

    // 성공: used_at + users.two_factor_passed_at 동시 기록
    const now = new Date().toISOString();
    await Promise.all([
      db.from("auth_otp_challenges").update({ used_at: now }).eq("id", challenge.id),
      db.from("users").update({ two_factor_passed_at: now }).eq("id", user.id),
    ]);

    await logUserActivity(db, user.id, "login_success", request, { method: "2fa_otp" });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
