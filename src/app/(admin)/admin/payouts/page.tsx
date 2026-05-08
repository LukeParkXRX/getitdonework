import { createServiceClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PayoutsAdminClient from "./PayoutsAdminClient";

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

export default async function PayoutsPage() {
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

  const { data: invoices } = await dbAny
    .from("invoices")
    .select(
      `id, enabler_id, period_start, period_end, total_credits, total_net,
       status, approved_at, cancelled_at, cancel_reason, created_at, updated_at,
       enabler:enabler_id ( id, full_name, email )`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const allInvoices = invoices ?? [];
  const stats = {
    total: allInvoices.length,
    pending: allInvoices.filter((i: { status: string }) => i.status === "pending").length,
    approved: allInvoices.filter((i: { status: string }) => i.status === "approved").length,
  };

  return (
    <PayoutsAdminClient initialInvoices={allInvoices} stats={stats} />
  );
}
