import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import WebhooksAdminClient from "./WebhooksAdminClient";

export const metadata = { title: "Webhook 모니터링 | Admin" };

export type WebhookEvent = {
  id: string;
  provider: string;
  event_type: string;
  event_id: string | null;
  payload_summary: Record<string, unknown> | null;
  status: string;
  error_message: string | null;
  processing_ms: number | null;
  created_at: string;
};

export default async function WebhooksPage() {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authAny = authClient as any;
  const { data: profile } = await authAny
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") redirect("/");

  const db = createServiceClient();

  const { data: events } = await (db as any)
    .from("webhook_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: WebhookEvent[] = events ?? [];

  const stats = {
    processed: rows.filter((r) => r.status === "processed").length,
    failed:    rows.filter((r) => r.status === "failed").length,
    ignored:   rows.filter((r) => r.status === "ignored").length,
    received:  rows.filter((r) => r.status === "received").length,
  };

  return <WebhooksAdminClient events={rows} stats={stats} />;
}
