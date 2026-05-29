import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { shouldShowTestData } from "@/lib/test-mode";
import EnablerDetailClient from "./EnablerDetailClient";
import JsonLd from "@/components/seo/JsonLd";
import { UserBadges } from "@/components/ui/UserBadge";
import type { CareerItem } from "@/lib/db/types";

// ── DB 로우 타입 ────────────────────────────────────────────────────────────────

type RawSpecialtyDetail = { title: string; description: string; icon?: string };

type RawEnablerRow = {
  user_id: string;
  university: string;
  degree_type: string;
  specialties: string[] | null;
  specialty_details: RawSpecialtyDetail[] | null;
  location: string | null;
  bio: string | null;
  credit_rate: number | null;
  enabler_score: number | null;
  badge_level: string | null;
  session_count: number | null;
  rating: number | null;
  re_request_rate: number | null;
  career: unknown | null;
  users: {
    full_name: string;
    avatar_url: string | null;
    is_test: boolean;
  };
};

type RawReviewRow = {
  id: string;
  author_id: string;
  target_id: string;
  booking_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type SpecialtyDetail = { title: string; description: string; icon?: string };

export type EnablerDetail = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  university: string;
  degreeType: string;
  specialties: string[];
  specialtyDetails: SpecialtyDetail[];
  location: string;
  bio: string;
  creditRate: number;
  enablerScore: number;
  badgeLevel: string;
  sessionCount: number;
  rating: number;
  reRequestRate: number;
  career: CareerItem[];
};

export type ReviewItem = {
  id: string;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

function parseCareer(raw: unknown): CareerItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<CareerItem[]>((acc, item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return acc;
    const obj = item as Record<string, unknown>;
    const company = typeof obj["company"] === "string" ? obj["company"] : "";
    if (!company) return acc;
    acc.push({
      company,
      title: typeof obj["title"] === "string" ? obj["title"] : "",
      period: typeof obj["period"] === "string" ? obj["period"] : "",
      description: typeof obj["description"] === "string" ? obj["description"] : "",
    });
    return acc;
  }, []);
}

// ── 서버 컴포넌트 ──────────────────────────────────────────────────────────────

export default async function EnablerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const showTest = await shouldShowTestData();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("enabler_profiles")
    .select("*, specialty_details, users!inner(full_name, avatar_url, is_test)")
    .eq("user_id", id)
    .eq("status", "approved");

  if (!showTest) {
    query = query.eq("users.is_test", false);
  }

  const { data: rawEnabler } = await query.maybeSingle();

  if (!rawEnabler) notFound();

  const row = rawEnabler as RawEnablerRow;

  const enabler: EnablerDetail = {
    userId: row.user_id,
    fullName: row.users.full_name,
    avatarUrl: row.users.avatar_url,
    university: row.university ?? "",
    degreeType: row.degree_type ?? "",
    specialties: row.specialties ?? [],
    specialtyDetails: row.specialty_details ?? [],
    location: row.location ?? "",
    bio: row.bio ?? "",
    creditRate: row.credit_rate ?? 0,
    enablerScore: row.enabler_score ?? 0,
    badgeLevel: row.badge_level ?? "verified",
    sessionCount: row.session_count ?? 0,
    rating: row.rating ?? 0,
    reRequestRate: row.re_request_rate ?? 0,
    career: parseCareer(row.career),
  };

  const { data: rawReviews } = await db
    .from("reviews")
    .select("id, author_id, target_id, booking_id, rating, comment, created_at")
    .eq("target_id", enabler.userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const rawList = (rawReviews as RawReviewRow[] | null) ?? [];

  // 작성자 정보 별도 fetch (외래키 임베드 의존 회피)
  const authorIds = Array.from(new Set(rawList.map((r) => r.author_id)));
  const authorMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (authorIds.length > 0) {
    const { data: authors } = await db
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", authorIds);
    for (const a of (authors ?? []) as { id: string; full_name: string | null; avatar_url: string | null }[]) {
      authorMap.set(a.id, { full_name: a.full_name, avatar_url: a.avatar_url });
    }
  }

  const reviews: ReviewItem[] = rawList.map((r) => {
    const author = authorMap.get(r.author_id);
    return {
      id: r.id,
      authorId: r.author_id,
      authorName: author?.full_name ?? null,
      authorAvatar: author?.avatar_url ?? null,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    };
  });

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 뱃지 fetch
  const { data: badgeRows } = await supabase
    .from("user_badges")
    .select("badge")
    .eq("user_id", enabler.userId);
  const userBadges: string[] = (badgeRows ?? []).map((b: { badge: string }) => b.badge);

  const personJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: enabler.fullName,
    jobTitle: enabler.degreeType,
    alumniOf: enabler.university,
    address: enabler.location
      ? { "@type": "PostalAddress", addressLocality: enabler.location }
      : undefined,
    description: enabler.bio || undefined,
    ...(enabler.rating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: enabler.rating,
            reviewCount: enabler.sessionCount,
          },
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={personJsonLd} />
      {userBadges.length > 0 && (
        <div style={{ padding: "12px 24px 0", maxWidth: "900px", margin: "0 auto" }}>
          <UserBadges badges={userBadges} />
        </div>
      )}
      <EnablerDetailClient enabler={enabler} reviews={reviews} currentUserId={currentUser?.id ?? null} />
    </>
  );
}
