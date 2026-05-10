import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "approve_application" | "reject_application"
  | "hide_review" | "unhide_review" | "dismiss_review_report"
  | "approve_payout" | "cancel_payout" | "transfer_payout"
  | "approve_payment" | "reject_payment"
  | "update_user_role" | "verify_user" | "unverify_user"
  | "update_payment_settings" | "update_payout_settings"
  | "create_credit_package" | "update_credit_package" | "delete_credit_package"
  | "create_organization" | "update_organization" | "delete_organization"
  | "allocate_credits"
  | "send_announcement";

export type AuditTargetType =
  | "application" | "review" | "review_report"
  | "invoice" | "payment" | "user"
  | "payment_settings" | "payout_settings"
  | "credit_package" | "organization" | "credit_transaction"
  | "announcement";

export type AuditLogInput = {
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

// 서버 컨텍스트에서 호출. supabase server client 인자 + actor session.user.id
export async function logAdminAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient | any,
  actorId: string,
  input: AuditLogInput
): Promise<void> {
  try {
    await supabase.from("admin_audit_log").insert({
      actor_id: actorId,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (e) {
    console.warn("logAdminAction failed", e);
  }
}
