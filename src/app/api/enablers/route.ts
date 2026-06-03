import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("enabler_profiles")
      .select("*, users!inner(full_name, avatar_url)", { count: "exact" })
      .eq("status", "approved")
      .order("enabler_score", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (specialty) {
      query = query.contains("specialties", [specialty]);
    }

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ enablers: data, total: count, page, limit });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
