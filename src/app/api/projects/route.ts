import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from("projects")
      .select("id, title, category, description, duration, budget, status, created_at")
      .eq("startup_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ projects: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, category, description, duration, budget, requirements, status } = body;

    // 필수 필드 검증
    if (!title || typeof title !== "string" || title.trim().length === 0 || title.trim().length > 200) {
      return NextResponse.json({ error: "title은 1-200자 필수입니다." }, { status: 400 });
    }
    if (!category || typeof category !== "string") {
      return NextResponse.json({ error: "category는 필수입니다." }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length < 10 || description.trim().length > 5000) {
      return NextResponse.json({ error: "description은 10-5000자 필수입니다." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from("projects")
      .insert({
        startup_id: user.id,
        title: title.trim(),
        category,
        description: description.trim(),
        duration: duration ?? null,
        budget: budget ?? null,
        requirements: Array.isArray(requirements) ? requirements : [],
        status: status ?? "open",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
