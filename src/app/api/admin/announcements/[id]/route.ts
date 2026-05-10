import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/admin/announcements/[id] — 상세 + 통계
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: me } = await db
      .from("users").select("role").eq("id", user.id).maybeSingle();
    if (me?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await db
      .from("announcements")
      .select("*, users!announcements_created_by_fkey(full_name, email)")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "공지를 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ announcement: data });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// DELETE /api/admin/announcements/[id] — draft만 삭제 가능
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: me } = await db
      .from("users").select("role").eq("id", user.id).maybeSingle();
    if (me?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: announcement } = await db
      .from("announcements")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (!announcement) {
      return NextResponse.json({ error: "공지를 찾을 수 없습니다" }, { status: 404 });
    }
    if (announcement.status !== "draft") {
      return NextResponse.json({ error: "초안 상태만 삭제할 수 있습니다" }, { status: 400 });
    }

    const { error: deleteError } = await db
      .from("announcements")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
