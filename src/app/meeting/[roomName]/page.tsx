import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/db/types";
import { MeetingRoom } from "./MeetingRoom";
import type { BookingInfo } from "./PreCallLobby";

interface PageProps {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ name?: string }>;
}

/**
 * 화상 세션 페이지 — 서버측 1차 가드.
 *
 * 세션은 예약(booking)이 있을 때만 입장 가능. room 명은 `session-{bookingId}` 형식 강제.
 * super_admin은 운영/지원 목적으로 임의 room 진입 허용.
 * /api/livekit이 토큰 발급 단계에서도 동일 검증 (defense in depth).
 */
export default async function MeetingRoomPage({ params, searchParams }: PageProps) {
  const { roomName: rawRoom } = await params;
  const { name } = await searchParams;
  const roomName = decodeURIComponent(rawRoom);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/meeting/${rawRoom}`)}`);
  }

  const { data: callerRaw } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single<{ role: UserRole | null; full_name: string | null }>();
  const callerRole = callerRaw?.role ?? null;

  if (!callerRole) {
    redirect("/onboarding/role");
  }

  const isSuperAdmin = callerRole === "super_admin";
  const sessionMatch = roomName.match(/^session-(.+)$/);

  let bookingInfo: BookingInfo | null = null;
  let bookingId: string | null = null;

  if (!sessionMatch) {
    if (!isSuperAdmin) {
      redirect(ROLE_HOME[callerRole]);
    }
  } else {
    bookingId = sessionMatch[1];

    type BookingRow = {
      startup_id: string;
      enabler_id: string;
      status: string;
      scheduled_at: string | null;
      session_type: string | null;
      credits_amount: number;
      startup: { full_name: string | null } | null;
      enabler: { full_name: string | null } | null;
    };

    const { data: bookingRaw } = await supabase
      .from("bookings")
      .select("startup_id, enabler_id, status, scheduled_at, session_type, credits_amount, startup:users!bookings_startup_id_fkey(full_name), enabler:users!bookings_enabler_id_fkey(full_name)")
      .eq("id", bookingId)
      .single<BookingRow>();

    if (!bookingRaw) redirect(ROLE_HOME[callerRole]);

    const isParticipant =
      bookingRaw!.startup_id === user.id || bookingRaw!.enabler_id === user.id;
    if (!isParticipant && !isSuperAdmin) {
      redirect(ROLE_HOME[callerRole]);
    }

    if (!["pending", "confirmed"].includes(bookingRaw!.status)) {
      redirect(ROLE_HOME[callerRole]);
    }

    // 상대방 이름 결정 (내가 startup이면 enabler, 반대면 startup)
    const isStartup = bookingRaw!.startup_id === user.id;
    const partnerName = isStartup
      ? (bookingRaw!.enabler?.full_name ?? "상대방")
      : (bookingRaw!.startup?.full_name ?? "상대방");

    bookingInfo = {
      partnerName,
      scheduledAt: bookingRaw!.scheduled_at ?? new Date().toISOString(),
      type: bookingRaw!.session_type ?? "세션",
      creditsAmount: bookingRaw!.credits_amount ?? 0,
    };
  }

  const participantName = callerRaw?.full_name ?? name ?? "Guest";

  return (
    <MeetingRoom
      roomName={roomName}
      participantName={participantName}
      bookingId={bookingId}
      bookingInfo={bookingInfo}
    />
  );
}
