import { requireRole } from "@/lib/supabase/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import SecurityClient from "./SecurityClient";

export const metadata = {
  title: "보안 설정 | Get It Done at Work",
};

export default async function SecuritySettingsPage() {
  const { userId, role } = await requireRole(
    ["startup", "enabler", "org_admin", "super_admin"],
    "/login",
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createServerSupabaseClient()) as any;

  const { data: userRow } = await db
    .from("users")
    .select("id, email, full_name, role, two_factor_enabled, two_factor_method")
    .eq("id", userId)
    .maybeSingle();

  // 최근 활동 로그 50건 (컬럼 존재 시)
  let activityLogs: unknown[] = [];
  try {
    const { data } = await db
      .from("user_activity_log")
      .select("id, activity_type, ip_address, user_agent, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    activityLogs = data ?? [];
  } catch {
    // 마이그레이션 미적용 시 graceful fallback
  }

  if (!userRow) {
    return (
      <div style={{ padding: 40, color: "var(--color-dim)", fontFamily: "var(--font-body)" }}>
        사용자 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <SecurityClient
      user={{
        id: userRow.id,
        email: userRow.email,
        full_name: userRow.full_name,
        role: role,
        two_factor_enabled: userRow.two_factor_enabled ?? false,
        two_factor_method: userRow.two_factor_method ?? null,
      }}
      activityLogs={activityLogs as ActivityLog[]}
    />
  );
}

// 타입 re-export (SecurityClient에서 import 할 수 있도록)
export interface ActivityLog {
  id: string;
  activity_type: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
