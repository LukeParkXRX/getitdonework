/**
 * POST /api/me/activity
 * body: { type: string; metadata?: Record<string, unknown> }
 *
 * 클라이언트에서 직접 활동 로그를 기록할 때 사용.
 * (로그인 성공, 로그아웃 등 server action이 없는 이벤트)
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { logUserActivity } from "@/lib/user-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "login_success",
  "login_failed",
  "logout",
  "password_changed",
  "email_changed",
  "2fa_enabled",
  "2fa_disabled",
  "profile_updated",
  "data_downloaded",
  "account_deletion_requested",
] as const;

type ActivityType = (typeof ALLOWED_TYPES)[number];

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { type: string; metadata?: Record<string, unknown> };

    if (!body.type || !ALLOWED_TYPES.includes(body.type as ActivityType)) {
      return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
    }

    // INSERT는 service role만 허용 (RLS)
    const admin = await createAdminClient();
    await logUserActivity(admin, user.id, body.type, request, body.metadata);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/me/activity
 * 최근 활동 로그 조회 (최대 50건)
 */
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
      .from("user_activity_log")
      .select("id, activity_type, ip_address, user_agent, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ logs: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
