import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbStartupProfile, DbEnablerProfile, DbUser } from "@/lib/db/types";
import { NextResponse } from "next/server";

interface SettingsPatchBody {
  fullName?: string;
  companyName?: string;
  industry?: string;
  stage?: string;
  usGoal?: string;
  notificationPrefs?: {
    session: boolean;
    credit: boolean;
    marketing: boolean;
  };
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error } = await db
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const typedProfile = profile as DbUser | null;

    // Fetch role-specific profile
    let roleProfile: DbStartupProfile | DbEnablerProfile | null = null;
    if (typedProfile?.role === "startup") {
      const { data } = await db.from("startup_profiles").select("*").eq("user_id", user.id).single();
      roleProfile = data as DbStartupProfile | null;
    } else if (typedProfile?.role === "enabler") {
      const { data } = await db.from("enabler_profiles").select("*").eq("user_id", user.id).single();
      roleProfile = data as DbEnablerProfile | null;
    }

    return NextResponse.json({ user: typedProfile, roleProfile });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as SettingsPatchBody;
    const { fullName, companyName, industry, stage, usGoal, notificationPrefs } = body;

    // users 테이블 업데이트
    const userUpdate: Record<string, unknown> = {};
    if (fullName !== undefined) userUpdate.full_name = fullName.trim();
    if (notificationPrefs !== undefined) userUpdate.notification_prefs = notificationPrefs;

    if (Object.keys(userUpdate).length > 0) {
      const { error: userError } = await db
        .from("users")
        .update(userUpdate)
        .eq("id", authUser.id);
      if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // role 확인
    const { data: userRow } = await db
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle();

    // startup_profiles 업데이트 (startup role만)
    if (userRow?.role === "startup") {
      const profileUpdate: Record<string, unknown> = {};
      if (companyName !== undefined) profileUpdate.company_name = companyName.trim();
      if (industry !== undefined) {
        profileUpdate.industry = industry
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      if (stage !== undefined) profileUpdate.stage = stage;
      if (usGoal !== undefined) profileUpdate.us_goal = usGoal.trim();

      if (Object.keys(profileUpdate).length > 0) {
        const { data: existing } = await db
          .from("startup_profiles")
          .select("user_id")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (existing) {
          const { error: profileError } = await db
            .from("startup_profiles")
            .update(profileUpdate)
            .eq("user_id", authUser.id);
          if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
        } else {
          const { error: insertError } = await db
            .from("startup_profiles")
            .insert({ user_id: authUser.id, ...profileUpdate });
          if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }
    }

    // 업데이트된 전체 데이터 반환
    const { data: updatedUser } = await db
      .from("users")
      .select("id, email, full_name, role, is_verified, created_at, notification_prefs")
      .eq("id", authUser.id)
      .maybeSingle();

    let updatedProfile: DbStartupProfile | null = null;
    if (userRow?.role === "startup") {
      const { data } = await db
        .from("startup_profiles")
        .select("company_name, industry, stage, us_goal")
        .eq("user_id", authUser.id)
        .maybeSingle();
      updatedProfile = data as DbStartupProfile | null;
    }

    return NextResponse.json({ user: updatedUser as DbUser, profile: updatedProfile });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
