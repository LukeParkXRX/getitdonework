import { createServiceClient } from "@/lib/supabase/service";

export type PaymentSettings = {
  autoApproveThresholdCents: number;
  autoApproveCurrency: string;
  approvalExpiryDays: number;
};

const DEFAULT_SETTINGS: PaymentSettings = {
  autoApproveThresholdCents: 1000000, // 100만원
  autoApproveCurrency: "krw",
  approvalExpiryDays: 7,
};

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceClient() as any;
    const { data } = await db
      .from("payment_settings")
      .select("auto_approve_threshold_cents, auto_approve_currency, approval_expiry_days")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return {
        autoApproveThresholdCents: data.auto_approve_threshold_cents,
        autoApproveCurrency: data.auto_approve_currency,
        approvalExpiryDays: data.approval_expiry_days,
      };
    }
  } catch {
    // service role 미설정 또는 테이블 미마이그레이션 시 default 반환
  }
  return DEFAULT_SETTINGS;
}
