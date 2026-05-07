import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { DbConversation } from "@/lib/db/types";

// PATCH /api/conversations/[id]/read — 내가 받은 unread 메시지 모두 read_at = now()
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 참여 여부 확인
    const { data: conversation } = await db
      .from("conversations")
      .select("startup_id, enabler_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const conv = conversation as Pick<DbConversation, "startup_id" | "enabler_id">;
    if (conv.startup_id !== user.id && conv.enabler_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // sender != me 이고 read_at is null인 메시지 일괄 업데이트
    const { error } = await db
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
