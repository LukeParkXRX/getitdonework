/**
 * POST /api/auth/2fa/send-code
 *
 * 로그인 비밀번호 검증 통과 후, 6자리 OTP 생성 → DB 저장 → 이메일 발송.
 * 응답: { challenge_id }
 *
 * LoginForm에서 비밀번호 로그인 성공 + two_factor_enabled=true 시 호출. 또한
 * /login/2fa-challenge 페이지가 12h 윈도우 만료 시 재발급용으로 호출.
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { otpCodeEmail } from "@/lib/emails/templates";
import crypto from "crypto";
import { cookies } from "next/headers";
import { verifyImpersonationToken } from "@/lib/impersonation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateOtp(): string {
  // 암호학적으로 안전한 6자리 숫자
  const buf = crypto.randomBytes(4);
  const num = buf.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, "0");
}

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

    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    // 2FA 활성화 여부 확인
    const { data: userRow } = await db
      .from("users")
      .select("two_factor_enabled, two_factor_method, email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!userRow?.two_factor_enabled) {
      return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
    }

    const code = generateOtp();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data: challenge, error: insertError } = await db
      .from("auth_otp_challenges")
      .insert({
        user_id: user.id,
        code_hash: codeHash,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError || !challenge) {
      return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
    }

    // 이메일 발송
    const emailPayload = otpCodeEmail({
      recipientName: userRow.full_name ?? user.email ?? "사용자",
      code,
    });
    const emailResult = await sendEmail(userRow.email ?? user.email!, emailPayload);
    if (!emailResult.ok) {
      // 이메일 실패해도 challenge는 남김 (재시도 가능)
      return NextResponse.json(
        { error: `Email send failed: ${emailResult.error}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ challenge_id: challenge.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
