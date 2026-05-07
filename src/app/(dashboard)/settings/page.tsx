import { requireRole } from "@/lib/supabase/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const { userId, role } = await requireRole(["startup", "enabler"], "/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createServerSupabaseClient()) as any;

  const { data: user } = await db
    .from("users")
    .select("id, email, full_name, role, is_verified, created_at, notification_prefs")
    .eq("id", userId)
    .maybeSingle();

  let profile = null;
  if (role === "startup") {
    const { data } = await db
      .from("startup_profiles")
      .select("company_name, industry, stage, us_goal")
      .eq("user_id", userId)
      .maybeSingle();
    profile = data;
  }

  if (!user) {
    return (
      <div style={{ padding: 40, color: "var(--color-dim)", fontFamily: "var(--font-body)" }}>
        사용자 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return <SettingsClient user={user} profile={profile} />;
}
