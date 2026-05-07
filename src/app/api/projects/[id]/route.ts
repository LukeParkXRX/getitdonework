import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("startup_id", user.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 소유권 확인 (RLS 보호 외 일관성)
    const { data: existing, error: fetchError } = await db
      .from("projects")
      .select("id, startup_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (existing.startup_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { title, category, description, duration, budget, requirements, status } = body;

    // 제공된 필드만 검증
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0 || title.trim().length > 200) {
        return NextResponse.json({ error: "title은 1-200자입니다." }, { status: 400 });
      }
    }
    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length < 10 || description.trim().length > 5000) {
        return NextResponse.json({ error: "description은 10-5000자입니다." }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description.trim();
    if (duration !== undefined) updates.duration = duration || null;
    if (budget !== undefined) updates.budget = budget || null;
    if (requirements !== undefined) updates.requirements = Array.isArray(requirements) ? requirements : [];
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "변경할 필드가 없습니다." }, { status: 400 });
    }

    const { data, error } = await db
      .from("projects")
      .update(updates)
      .eq("id", id)
      .eq("startup_id", user.id)
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 소유권 확인
    const { data: existing, error: fetchError } = await db
      .from("projects")
      .select("id, startup_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (existing.startup_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await db
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("startup_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
