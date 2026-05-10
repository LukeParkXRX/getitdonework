import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/guards";
import DisputeDetailClient from "./DisputeDetailClient";
import type { DisputeDetail } from "./DisputeDetailClient";

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["super_admin"], "/admin/dashboard");

  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: raw } = await db
    .from("disputes")
    .select(
      `id, status, filer_role, reason, details, evidence_urls,
       resolved_at, resolution_notes, refund_amount, created_at,
       booking:bookings!disputes_booking_id_fkey(
         id, credits_amount, scheduled_at, type, brief,
         startup:users!bookings_startup_id_fkey(id, full_name, email, avatar_url),
         enabler:users!bookings_enabler_id_fkey(id, full_name, email, avatar_url)
       ),
       filer:users!disputes_filer_id_fkey(id, full_name, email, avatar_url),
       resolver:users!disputes_resolved_by_fkey(id, full_name)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!raw) notFound();

  // Supabase 임베드 조인은 배열로 올 수 있음 — 단일 객체로 정규화
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function pick<T>(v: T | T[] | null): T | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0] ?? null) : v;
  }

  const bookingRaw = pick(raw.booking);
  const dispute: DisputeDetail = {
    id: raw.id,
    status: raw.status,
    filer_role: raw.filer_role,
    reason: raw.reason,
    details: raw.details,
    evidence_urls: raw.evidence_urls ?? [],
    created_at: raw.created_at,
    resolved_at: raw.resolved_at,
    resolution_notes: raw.resolution_notes,
    refund_amount: raw.refund_amount,
    filer: pick(raw.filer),
    resolver: pick(raw.resolver),
    booking: bookingRaw
      ? {
          id: bookingRaw.id,
          credits_amount: bookingRaw.credits_amount,
          scheduled_at: bookingRaw.scheduled_at,
          type: bookingRaw.type,
          brief: bookingRaw.brief,
          startup: pick(bookingRaw.startup),
          enabler: pick(bookingRaw.enabler),
        }
      : null,
  };

  return <DisputeDetailClient dispute={dispute} />;
}
