import { ROLE_HOME } from "@/lib/auth/roles";
import { createServerSupabaseClient, createUntypedAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type ApprovedApplication = {
  id: string;
  signup_token: string | null;
  signup_token_expires_at: string | null;
};

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createUntypedAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (profile?.role) {
      return NextResponse.json({
        claimed: false,
        role: profile.role,
        redirectTo: ROLE_HOME[profile.role as keyof typeof ROLE_HOME] ?? "/",
      });
    }

    const { data: applications, error: applicationError } = await admin
      .from("enabler_applications")
      .select("id, signup_token, signup_token_expires_at")
      .ilike("email", user.email)
      .eq("status", "approved")
      .is("signed_up_user_id", null)
      .not("signup_token", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (applicationError) {
      return NextResponse.json({ error: applicationError.message }, { status: 500 });
    }

    const now = Date.now();
    const application = ((applications ?? []) as ApprovedApplication[]).find((app) => {
      if (!app.signup_token) return false;
      if (!app.signup_token_expires_at) return true;
      return Date.parse(app.signup_token_expires_at) > now;
    });

    if (!application?.signup_token) {
      return NextResponse.json({ claimed: false, reason: "no_matching_approved_application" });
    }

    const { error: claimError } = await admin.rpc("claim_enabler_application", {
      p_user_id: user.id,
      p_signup_token: application.signup_token,
    });

    if (claimError) {
      return NextResponse.json({ error: claimError.message }, { status: 400 });
    }

    return NextResponse.json({
      claimed: true,
      role: "enabler",
      redirectTo: "/enabler-dashboard?welcome=true",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
