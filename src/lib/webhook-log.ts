import type { SupabaseClient } from "@supabase/supabase-js";

export async function logWebhookEvent(
  supabase: SupabaseClient,
  params: {
    provider: string;
    eventType: string;
    eventId?: string;
    payloadSummary?: Record<string, unknown>;
    status: "received" | "processed" | "failed" | "ignored";
    errorMessage?: string;
    processingMs?: number;
  }
): Promise<void> {
  try {
    await supabase.from("webhook_events").insert({
      provider:        params.provider,
      event_type:      params.eventType,
      event_id:        params.eventId        ?? null,
      payload_summary: params.payloadSummary ?? null,
      status:          params.status,
      error_message:   params.errorMessage   ?? null,
      processing_ms:   params.processingMs   ?? null,
    });
  } catch (e) {
    console.warn("logWebhookEvent failed", e);
  }
}
