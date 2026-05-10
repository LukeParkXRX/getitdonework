import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "booking_requested"
  | "booking_confirmed"
  | "booking_cancelled"
  | "review_received"
  | "application_received"
  | "application_status"
  | "message_received"
  | "payout_paid"
  | "review_hidden"
  | "announcement";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
};

// 서버 컨텍스트에서만 호출. supabase server client 인자로 받음.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createNotification(supabase: SupabaseClient | any, input: CreateNotificationInput) {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
  });
  if (error) console.warn("createNotification failed", error);
  return { ok: !error };
}
