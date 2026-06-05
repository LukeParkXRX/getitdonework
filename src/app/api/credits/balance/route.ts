import { getEffectiveUserId } from "@/lib/auth-context";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const effectiveUser = await getEffectiveUserId();
    if (!effectiveUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = effectiveUser.impersonating
      ? await createAdminClient()
      : await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("startup_profiles")
      .select("credit_balance")
      .eq("user_id", effectiveUser.userId)
      .single() as { data: { credit_balance: number } | null; error: unknown };

    if (error) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      balance: data?.credit_balance,
      impersonating: effectiveUser.impersonating,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
