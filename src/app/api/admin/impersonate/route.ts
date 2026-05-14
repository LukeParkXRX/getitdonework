import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { createImpersonationToken, verifyImpersonationToken } from "@/lib/impersonation";
import { logAdminAction } from "@/lib/admin-audit";
import { logUserActivity } from "@/lib/user-activity";
import { cookies } from "next/headers";

// ── 인증 guard ────────────────────────────────────────────────────────────────
async function getSuperAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (admin as any)
    .from("users")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") return null;
  return me as { id: string; role: string; full_name: string; email: string };
}

// ── POST: 시작 ────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const actor = await getSuperAdmin();
  if (!actor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    target_user_id: string;
    reason?: string;
  };

  if (!body.target_user_id) {
    return NextResponse.json(
      { error: "target_user_id required" },
      { status: 400 }
    );
  }

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  // 대상 사용자 존재 확인 + super_admin 간 차단
  const { data: targetUser } = await db
    .from("users")
    .select("id, role, full_name, email")
    .eq("id", body.target_user_id)
    .maybeSingle();

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser.role === "super_admin") {
    return NextResponse.json(
      { error: "super_admin 계정은 Impersonation할 수 없습니다" },
      { status: 403 }
    );
  }

  // impersonation_sessions INSERT
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1h
  const { data: session, error: sessionError } = await db
    .from("impersonation_sessions")
    .insert({
      admin_id: actor.id,
      target_user_id: body.target_user_id,
      reason: body.reason ?? null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "세션 생성에 실패했습니다" },
      { status: 500 }
    );
  }

  const token = createImpersonationToken({
    adminId: actor.id,
    targetUserId: body.target_user_id,
    expiresAt: expiresAt.getTime(),
    sessionId: session.id as string,
  });

  // audit 로그
  await logAdminAction(db, actor.id, {
    action: "start_impersonation",
    targetType: "user",
    targetId: body.target_user_id,
    metadata: {
      reason: body.reason ?? null,
      session_id: session.id,
      target_name: targetUser.full_name,
      target_email: targetUser.email,
    },
  });

  await logUserActivity(db, body.target_user_id, "impersonated_by_admin", request, {
    admin_id: actor.id,
    admin_email: actor.email,
    session_id: session.id,
    reason: body.reason ?? null,
  });

  const cookieStr = `__impersonate=${token}; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

  const response = NextResponse.json({
    ok: true,
    session_id: session.id,
    expires_at: expiresAt.toISOString(),
    target_name: targetUser.full_name,
    target_email: targetUser.email,
  });
  response.headers.set("Set-Cookie", cookieStr);
  return response;
}

// ── DELETE: 종료 ──────────────────────────────────────────────────────────────
export async function DELETE(_request: Request) {
  const actor = await getSuperAdmin();
  if (!actor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const impCookie = cookieStore.get("__impersonate")?.value;

  if (impCookie) {
    const payload = verifyImpersonationToken(impCookie);
    if (payload) {
      const admin = await createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = admin as any;

      await db
        .from("impersonation_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", payload.sessionId);

      await logAdminAction(db, actor.id, {
        action: "end_impersonation",
        targetType: "user",
        targetId: payload.targetUserId,
        metadata: { session_id: payload.sessionId },
      });
    }
  }

  const response = NextResponse.json({ ok: true });
  // cookie 제거
  response.headers.set(
    "Set-Cookie",
    "__impersonate=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  );
  return response;
}

// ── GET: 현재 상태 확인 ───────────────────────────────────────────────────────
export async function GET(_request: Request) {
  const cookieStore = await cookies();
  const impCookie = cookieStore.get("__impersonate")?.value;

  if (!impCookie) {
    return NextResponse.json({ active: false });
  }

  const payload = verifyImpersonationToken(impCookie);
  if (!payload) {
    // 만료 또는 무효 — cookie 제거
    const response = NextResponse.json({ active: false });
    response.headers.set(
      "Set-Cookie",
      "__impersonate=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
    );
    return response;
  }

  // 대상 사용자 정보 조회
  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetUser } = await (admin as any)
    .from("users")
    .select("full_name, email, avatar_url")
    .eq("id", payload.targetUserId)
    .maybeSingle();

  return NextResponse.json({
    active: true,
    targetUserId: payload.targetUserId,
    targetName: targetUser?.full_name ?? "Unknown",
    targetEmail: targetUser?.email ?? "",
    adminId: payload.adminId,
    expiresAt: payload.expiresAt,
    sessionId: payload.sessionId,
  });
}
