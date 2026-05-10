import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/guards";
import DisputesAdminClient from "./DisputesAdminClient";
import type { DisputeRow, DisputeStats } from "./DisputesAdminClient";

export default async function DisputesAdminPage() {
  await requireRole(["super_admin"], "/admin/dashboard");

  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: rawDisputes } = await db
    .from("disputes")
    .select(
      `id, status, filer_role, reason, created_at, resolved_at, refund_amount,
       booking:bookings!disputes_booking_id_fkey(id, credits_amount, scheduled_at, type),
       filer:users!disputes_filer_id_fkey(id, full_name, email)`
    )
    .order("created_at", { ascending: false });

  const disputes: DisputeRow[] = (rawDisputes ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => ({
      ...d,
      booking: Array.isArray(d.booking) ? (d.booking[0] ?? null) : d.booking,
      filer: Array.isArray(d.filer) ? (d.filer[0] ?? null) : d.filer,
    })
  );

  // 통계
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const stats: DisputeStats = {
    open: disputes.filter((d) => d.status === "open").length,
    in_review: disputes.filter((d) => d.status === "in_review").length,
    resolved_this_month: disputes.filter(
      (d) =>
        ["resolved_refund", "resolved_partial", "resolved_dismissed"].includes(d.status) &&
        d.created_at >= monthStart
    ).length,
  };

  return <DisputesAdminClient initialDisputes={disputes} stats={stats} />;
}
