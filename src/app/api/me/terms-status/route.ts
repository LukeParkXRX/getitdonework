import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 현재 약관 버전
    const { data: current, error: tvError } = await db
      .from("terms_versions")
      .select("*")
      .eq("is_current", true)
      .maybeSingle();

    if (tvError) return NextResponse.json({ error: tvError.message }, { status: 500 });
    if (!current) return NextResponse.json({ current_version: null, accepted: true });

    // 본인이 현재 버전 동의했는지
    const { data: acceptance } = await db
      .from("user_terms_acceptances")
      .select("accepted_at")
      .eq("user_id", user.id)
      .eq("terms_version_id", (current as { id: string }).id)
      .maybeSingle();

    return NextResponse.json({
      current_version: current,
      accepted: !!acceptance,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
