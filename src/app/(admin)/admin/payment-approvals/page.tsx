import { createServiceClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PaymentApprovalsClient from "./PaymentApprovalsClient";

async function getAdminOrRedirect() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase as any)
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") redirect("/");
  return user.id;
}

export default async function PaymentApprovalsPage() {
  await getAdminOrRedirect();

  let db: ReturnType<typeof createServiceClient>;
  try {
    db = createServiceClient();
  } catch {
    return (
      <div style={{ color: "var(--color-error, #ef4444)", padding: 32 }}>
        서비스 설정 오류: SUPABASE_SERVICE_ROLE_KEY를 확인하세요.
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  // Lazy 만료 처리
  const now = new Date().toISOString();
  await dbAny
    .from("credit_purchases")
    .update({ status: "expired", updated_at: now })
    .eq("status", "paid_pending_admin")
    .lt("expires_at", now);

  const { data: orders } = await dbAny
    .from("credit_purchases")
    .select(
      `id, status, credits, amount_krw, expires_at, created_at, updated_at,
       rejection_reason, rejected_at, approved_at,
       users:startup_id ( id, name, email ),
       credit_packages:package_id ( id, name )`
    )
    .in("status", ["paid_pending_admin", "rejected", "expired"])
    .order("created_at", { ascending: false })
    .limit(200);

  // 결제 정책 조회
  const { data: settings } = await dbAny
    .from("payment_settings")
    .select("id, auto_approve_threshold_cents, approval_expiry_days, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pending = (orders ?? []).filter(
    (o: { status: string }) => o.status === "paid_pending_admin"
  ).length;

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const rejectedThisMonth = (orders ?? []).filter((o: { status: string; rejected_at: string | null }) => {
    if (o.status !== "rejected") return false;
    if (!o.rejected_at) return false;
    return new Date(o.rejected_at) >= thisMonthStart;
  }).length;

  return (
    <PaymentApprovalsClient
      initialOrders={orders ?? []}
      stats={{ pending, rejectedThisMonth }}
      initialSettings={
        settings
          ? {
              autoApproveThresholdCents: settings.auto_approve_threshold_cents,
              approvalExpiryDays: settings.approval_expiry_days,
            }
          : { autoApproveThresholdCents: 1000000, approvalExpiryDays: 7 }
      }
    />
  );
}
