import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";
import { sendAnnouncementToRecipients } from "@/lib/announcements";

// GET /api/admin/announcements — 최근 50건 목록
export async function GET() {
  try {
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
      .select("id, title, audience, channel, status, recipient_count, sent_count, failed_count, created_at, sent_at, created_by, users!announcements_created_by_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ announcements: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// POST /api/admin/announcements — 신규 작성 (send=true면 즉시 발송)
export async function POST(request: Request) {
  try {
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

    const body = await request.json() as {
      title: string;
      body: string;
      link?: string;
      audience: string;
      audience_target_id?: string;
      target_user_ids?: string[];
      channel: string;
      send: boolean;
    };

    const { title, body: annBody, link, audience, audience_target_id, target_user_ids, channel, send } = body;

    if (!title || !annBody || !audience || !channel) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }

    const { data: announcement, error: insertError } = await db
      .from("announcements")
      .insert({
        title,
        body: annBody,
        link: link ?? null,
        audience,
        audience_target_id: audience_target_id ?? null,
        target_user_ids: target_user_ids ?? null,
        channel,
        status: "draft",
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !announcement) {
      return NextResponse.json({ error: insertError?.message ?? "생성 실패" }, { status: 500 });
    }

    if (send) {
      const result = await sendAnnouncementToRecipients(db, announcement.id, user.id);
      return NextResponse.json({ announcement: { ...announcement, ...result } });
    }

    return NextResponse.json({ announcement });
  } catch (e) {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
