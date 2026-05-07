import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { DbConversation, DbUser } from "@/lib/db/types";

// GET /api/conversations — 내가 참여한 대화 목록 (last_message_at DESC, 50개)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: rows, error } = await db
      .from("conversations")
      .select("*")
      .or(`startup_id.eq.${user.id},enabler_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const conversations: DbConversation[] = rows ?? [];

    // 상대방 user id 수집
    const otherIds = conversations.map((c: DbConversation) =>
      c.startup_id === user.id ? c.enabler_id : c.startup_id
    );
    const uniqueOtherIds = [...new Set(otherIds)];

    // 상대방 정보 fetch
    const userMap = new Map<string, Pick<DbUser, "id" | "full_name" | "avatar_url">>();
    if (uniqueOtherIds.length > 0) {
      const { data: usersData } = await db
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", uniqueOtherIds);
      (usersData ?? []).forEach((u: Pick<DbUser, "id" | "full_name" | "avatar_url">) => {
        userMap.set(u.id, u);
      });
    }

    const result = conversations.map((c: DbConversation) => {
      const otherId = c.startup_id === user.id ? c.enabler_id : c.startup_id;
      const other = userMap.get(otherId);
      return {
        ...c,
        other_user: other ?? { id: otherId, full_name: null, avatar_url: null },
      };
    });

    return NextResponse.json({ conversations: result });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/conversations — 기존 대화 반환 or 신규 생성
// body: { otherUserId: string }
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { otherUserId } = body as { otherUserId: string };
    if (!otherUserId) return NextResponse.json({ error: "otherUserId required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 내 role 확인
    const { data: profile } = await db
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as string | null;
    if (role !== "startup" && role !== "enabler") {
      return NextResponse.json({ error: "Only startup or enabler can start conversations" }, { status: 400 });
    }

    const startup_id = role === "startup" ? user.id : otherUserId;
    const enabler_id = role === "enabler" ? user.id : otherUserId;

    // 기존 대화 확인
    const { data: existing } = await db
      .from("conversations")
      .select("*")
      .eq("startup_id", startup_id)
      .eq("enabler_id", enabler_id)
      .maybeSingle();

    if (existing) return NextResponse.json({ conversation: existing });

    // 신규 생성
    const { data: created, error: insertError } = await db
      .from("conversations")
      .insert({ startup_id, enabler_id })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ conversation: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
