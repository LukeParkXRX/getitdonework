import { createServiceClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PayoutDetailClient from "./PayoutDetailClient";

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
}

export default async function PayoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getAdminOrRedirect();
  const { id } = await params;

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

  const { data: invoice } = await dbAny
    .from("invoices")
    .select(
      `id, enabler_id, period_start, period_end, total_credits, total_net,
       status, approved_by, approved_at, cancelled_by, cancelled_at, cancel_reason,
       created_at, updated_at,
       enabler:enabler_id ( id, full_name, email )`
    )
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const { data: earnings } = await dbAny
    .from("enabler_earnings")
    .select(
      `id, booking_id, credits_earned, fee_pct, net_amount, credit_rate,
       status, accrued_at,
       booking:booking_id ( id, type, scheduled_at, credits_amount )`
    )
    .eq("invoice_id", id)
    .order("accrued_at", { ascending: false });

  // Enabler Connect 계정 상태 및 세무 정보 조회
  const { data: payoutAccount } = await dbAny
    .from("enabler_payout_accounts")
    .select("status, tax_form_type, tax_form_url, tax_form_completed")
    .eq("user_id", invoice.enabler_id)
    .maybeSingle();

  return (
    <PayoutDetailClient
      invoice={invoice}
      earnings={earnings ?? []}
      payoutAccountStatus={payoutAccount?.status ?? null}
      taxFormType={payoutAccount?.tax_form_type ?? "none"}
      taxFormUrl={payoutAccount?.tax_form_url ?? null}
      taxFormCompleted={payoutAccount?.tax_form_completed ?? false}
    />
  );
}
