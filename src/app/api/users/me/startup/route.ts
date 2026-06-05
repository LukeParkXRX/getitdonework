import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbStartupProfile } from "@/lib/db/types";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as Partial<Pick<DbStartupProfile, "company_name" | "industry" | "stage" | "us_goal">>;
    const { company_name, industry, stage, us_goal } = body;

    const { data, error } = await db
      .from("startup_profiles")
      .upsert({
        user_id: user.id,
        ...(company_name !== undefined && { company_name }),
        ...(industry !== undefined && { industry }),
        ...(stage !== undefined && { stage }),
        ...(us_goal !== undefined && { us_goal }),
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data as DbStartupProfile });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
