import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/guards";
import BookingsListClient from "./BookingsListClient";
import type { BookingWithEnabler } from "./BookingsListClient";

// DB 조인 결과 로우 타입
type RawEnablerProfile = {
  university: string | null;
  degree_type: string | null;
  specialties: string[] | null;
  badge_level: string | null;
};

type RawEnablerUser = {
  full_name: string | null;
  avatar_url: string | null;
  enabler_profile: RawEnablerProfile | RawEnablerProfile[] | null;
};

type RawBookingRow = {
  id: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  credits_amount: number;
  brief: string | null;
  meeting_url: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  completed_at: string | null;
  created_at: string;
  enabler_id: string;
  enabler_user: RawEnablerUser | RawEnablerUser[] | null;
};

function pickEnablerUser(raw: RawEnablerUser | RawEnablerUser[] | null): RawEnablerUser | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function pickEnablerProfile(raw: RawEnablerProfile | RawEnablerProfile[] | null | undefined): RawEnablerProfile | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

export default async function BookingsPage() {
  // layout이 startup 포함 여러 role을 허용하므로, page에서 startup 전용 검증
  const { userId } = await requireRole(["startup"], "/my").catch(() => {
    redirect("/my");
  }) as { userId: string };

  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [{ data: rawRows, error }, { data: rawReviews }, { data: rawDisputes }] = await Promise.all([
    db
      .from("bookings")
      .select(
        `id, type, status, scheduled_at, credits_amount, brief, meeting_url,
         cancelled_at, cancel_reason, completed_at, created_at, enabler_id,
         enabler_user:users!bookings_enabler_id_fkey(
           full_name,
           avatar_url,
           enabler_profile:enabler_profiles(university, degree_type, specialties, badge_level)
         )`
      )
      .eq("startup_id", userId)
      .order("created_at", { ascending: false }),
    db
      .from("reviews")
      .select("booking_id")
      .eq("author_id", userId),
    db
      .from("disputes")
      .select("booking_id, status")
      .eq("filer_id", userId),
  ]);

  if (error) {
    // fetch 실패는 빈 목록으로 처리 (console.error 금지)
  }

  const reviewedSet = new Set<string>(
    ((rawReviews as { booking_id: string }[] | null) ?? []).map((r) => r.booking_id)
  );

  const disputeMap = new Map<string, string>(
    ((rawDisputes as { booking_id: string; status: string }[] | null) ?? []).map((d) => [
      d.booking_id,
      d.status,
    ])
  );

  const rows = (rawRows as RawBookingRow[] | null) ?? [];

  const bookings: BookingWithEnabler[] = rows.map((r) => {
    const eu = pickEnablerUser(r.enabler_user);
    const ep = pickEnablerProfile(eu?.enabler_profile);
    return {
      id: r.id,
      type: r.type as BookingWithEnabler["type"],
      status: r.status as BookingWithEnabler["status"],
      scheduled_at: r.scheduled_at,
      credits_amount: r.credits_amount,
      brief: r.brief,
      meeting_url: r.meeting_url,
      cancelled_at: r.cancelled_at,
      cancel_reason: r.cancel_reason,
      completed_at: r.completed_at,
      created_at: r.created_at,
      enabler_id: r.enabler_id,
      enabler_user_name: eu?.full_name ?? null,
      enabler_avatar_url: eu?.avatar_url ?? null,
      enabler_university: ep?.university ?? null,
      enabler_degree_type: ep?.degree_type ?? null,
      enabler_specialties: ep?.specialties ?? null,
      enabler_badge_level: ep?.badge_level ?? null,
      reviewed: reviewedSet.has(r.id),
      dispute_status: disputeMap.get(r.id) ?? null,
    };
  });

  return <BookingsListClient bookings={bookings} />;
}
