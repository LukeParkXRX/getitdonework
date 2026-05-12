import { createServerSupabaseClient } from "@/lib/supabase/server";
import { shouldShowTestData } from "@/lib/test-mode";
import MatchingClient, { type MatchingEnablerItem } from "./MatchingClient";
import type { EnablerBadge } from "@/types";

// ── Raw DB row type ───────────────────────────────────────────────────────────

type RawEnablerRow = {
  user_id: string;
  university: string;
  degree_type: string;
  specialties: string[];
  location: string;
  bio: string;
  credit_rate: number;
  badge_level: string;
  session_count: number;
  rating: number | string;
  re_request_rate?: number | null;
  enabler_score?: number | null;
  users:
    | { full_name: string; avatar_url: string | null; role: string | null; is_test: boolean }
    | { full_name: string; avatar_url: string | null; role: string | null; is_test: boolean }[]
    | null;
};

// ── Data fetch ────────────────────────────────────────────────────────────────

async function fetchMatchingEnablers(): Promise<MatchingEnablerItem[]> {
  const supabase = await createServerSupabaseClient();
  const showTest = await shouldShowTestData();

  let query = supabase
    .from("enabler_profiles")
    .select(`
      user_id,
      university,
      degree_type,
      specialties,
      location,
      bio,
      credit_rate,
      badge_level,
      session_count,
      rating,
      re_request_rate,
      enabler_score,
      users!inner ( full_name, avatar_url, role, is_test )
    `)
    .eq("status", "approved")
    .eq("users.role", "enabler");

  if (!showTest) {
    query = query.eq("users.is_test", false);
  }

  const { data, error } = await query.order("rating", { ascending: false });

  if (error) {
    return [];
  }

  const rows = (data ?? []) as unknown as RawEnablerRow[];

  return rows.map((row) => {
    const usersRaw = Array.isArray(row.users) ? row.users[0] : row.users;
    const fullName: string = usersRaw?.full_name ?? "";
    const avatarUrl: string | null = usersRaw?.avatar_url ?? null;

    const avatarInitial = fullName
      ? fullName
          .split(" ")
          .map((w: string) => w[0] ?? "")
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "";

    return {
      userId: row.user_id,
      fullName,
      avatarUrl,
      avatarInitial,
      university: row.university,
      degreeType: row.degree_type,
      specialties: row.specialties ?? [],
      location: row.location,
      bio: row.bio,
      creditRate: row.credit_rate,
      badgeLevel: row.badge_level as EnablerBadge,
      sessionCount: row.session_count,
      rating: Number(row.rating),
      reRequestRate: row.re_request_rate ?? undefined,
      enablerScore: row.enabler_score ?? undefined,
    };
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MatchingPage() {
  const enablers = await fetchMatchingEnablers();
  return <MatchingClient enablers={enablers} />;
}
