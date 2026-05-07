import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ChatRoomClient from "./ChatRoomClient";
import type { DbConversation, DbMessage, DbUser } from "@/lib/db/types";

export const metadata = { title: "채팅 | Get It Done" };

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 대화 fetch
  const { data: conv } = await db
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conv) notFound();

  const conversation = conv as DbConversation;

  // 참여 여부
  if (conversation.startup_id !== user.id && conversation.enabler_id !== user.id) {
    notFound();
  }

  // 초기 메시지 50개 (시간순)
  const { data: msgRows } = await db
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(50);

  const initialMessages: DbMessage[] = ((msgRows ?? []) as DbMessage[]).reverse();

  // 상대방 정보
  const otherId = conversation.startup_id === user.id ? conversation.enabler_id : conversation.startup_id;
  const { data: otherUserData } = await db
    .from("users")
    .select("id, full_name, avatar_url")
    .eq("id", otherId)
    .single();

  const otherUser = (otherUserData ?? { id: otherId, full_name: null, avatar_url: null }) as Pick<DbUser, "id" | "full_name" | "avatar_url">;

  return (
    <ChatRoomClient
      conversationId={conversationId}
      currentUserId={user.id}
      initialMessages={initialMessages}
      otherUser={otherUser}
    />
  );
}
