import { createServerSupabaseClient } from "@/lib/supabase/server";
import EnablersAdminClient, { type EnablerRow } from "./EnablersAdminClient";

// ─── DB 조회 및 camelCase 변환 ────────────────────────────────────────────────

async function fetchEnablers(): Promise<EnablerRow[]> {
  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("enabler_profiles")
    .select(
      `
      user_id,
      status,
      university,
      degree_type,
      specialties,
      location,
      bio,
      credit_rate,
      badge_level,
      enabler_score,
      session_count,
      rating,
      re_request_rate,
      users!inner (
        full_name,
        avatar_url,
        enabler_payout_accounts (
          tax_form_type,
          tax_form_url,
          tax_form_completed
        )
      )
    `
    )
    .order("status", { ascending: true });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row): EnablerRow => {
    const fullName: string = row.users?.full_name ?? "Unknown";
    // avatarInitial: 이름 단어의 첫 글자 최대 2개
    const avatarInitial = fullName
      .split(" ")
      .slice(0, 2)
      .map((w: string) => w[0] ?? "")
      .join("")
      .toUpperCase();

    const payoutAccount = row.users?.enabler_payout_accounts;
    const singlePayoutAccount = Array.isArray(payoutAccount) ? payoutAccount[0] : payoutAccount;

    return {
      userId: row.user_id,
      fullName,
      avatarInitial,
      avatarUrl: row.users?.avatar_url ?? "",
      university: row.university ?? "",
      degreeType: row.degree_type ?? "",
      status: row.status ?? "pending",
      specialties: Array.isArray(row.specialties) ? row.specialties : [],
      location: row.location ?? "",
      enablerScore: row.enabler_score ?? 0,
      sessionCount: row.session_count ?? 0,
      rating: row.rating ?? 0,
      reRequestRate: row.re_request_rate ?? 0,
      bio: row.bio ?? "",
      creditRate: row.credit_rate ?? 0,
      badgeLevel: row.badge_level ?? "verified",
      availability: {},
      taxFormType: singlePayoutAccount?.tax_form_type ?? "none",
      taxFormUrl: singlePayoutAccount?.tax_form_url ?? null,
      taxFormCompleted: singlePayoutAccount?.tax_form_completed ?? false,
    };
  });
}

// ─── 페이지 (Server Component) ────────────────────────────────────────────────

export default async function AdminEnablersPage() {
  const enablers = await fetchEnablers();
  return <EnablersAdminClient initial={enablers} />;
}
