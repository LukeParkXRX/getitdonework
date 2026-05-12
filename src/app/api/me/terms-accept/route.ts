import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { terms_version_id: string };
    if (!body.terms_version_id) {
      return NextResponse.json({ error: "terms_version_id required" }, { status: 400 });
    }

    const { error } = await db.from("user_terms_acceptances").upsert(
      {
        user_id: user.id,
        terms_version_id: body.terms_version_id,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,terms_version_id", ignoreDuplicates: true }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
