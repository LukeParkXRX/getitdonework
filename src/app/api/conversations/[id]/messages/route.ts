import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import type { DbConversation, DbMessage, DbUser } from "@/lib/db/types";

// GET /api/conversations/[id]/messages — 최근 100개 (created_at DESC)
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

    const { data: rows, error } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // created_at ASC 순으로 뒤집어서 반환 (시간순)
    const messages: DbMessage[] = (rows ?? []).reverse();
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages — 메시지 전송
// body: { body: string }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const messageBody = (body?.body ?? "").trim() as string;
    if (!messageBody || messageBody.length === 0) {
      return NextResponse.json({ error: "body required" }, { status: 400 });
    }
    if (messageBody.length > 4000) {
      return NextResponse.json({ error: "body too long (max 4000)" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 대화 존재 + 참여 여부 확인 (RLS가 처리하지만 명시적으로도)
    const { data: conversation, error: convError } = await db
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const conv = conversation as DbConversation;
    if (conv.startup_id !== user.id && conv.enabler_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 메시지 INSERT
    const { data: newMessage, error: insertError } = await db
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: messageBody,
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    // conversations.last_message_at + last_message_preview UPDATE
    const preview = messageBody.length > 80 ? messageBody.slice(0, 80) + "…" : messageBody;
    await db
      .from("conversations")
      .update({ last_message_at: new Date().toISOString(), last_message_preview: preview })
      .eq("id", conversationId);

    // 알림 fire-and-forget
    const otherId = conv.startup_id === user.id ? conv.enabler_id : conv.startup_id;
    const { data: senderData } = await db
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const senderName = (senderData as Pick<DbUser, "full_name"> | null)?.full_name ?? "Someone";

    createNotification(db, {
      userId: otherId,
      type: "message_received",
      title: "새 메시지",
      body: `${senderName}: ${preview}`,
      link: `/messages/${conversationId}`,
    }).catch(() => { /* fire-and-forget */ });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
