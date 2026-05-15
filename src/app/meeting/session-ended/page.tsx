import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ bookingId?: string; duration?: string }>;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}초`;
  return `${m}분 ${s}초`;
}

export default async function SessionEndedPage({ searchParams }: PageProps) {
  const { bookingId, duration: durationParam } = await searchParams;

  let durationSeconds: number | null = durationParam ? parseInt(durationParam, 10) : null;
  let creditsUsed: number | null = null;
  let wasRefunded = false;
  let partnerName: string | null = null;

  if (bookingId) {
    const supabase = await createServerSupabaseClient();
    const { data: booking } = await supabase
      .from("bookings")
      .select("session_duration_seconds, credits_amount, status, startup_id, enabler_id, startup:users!bookings_startup_id_fkey(full_name), enabler:users!bookings_enabler_id_fkey(full_name)")
      .eq("id", bookingId)
      .single<{
        session_duration_seconds: number | null;
        credits_amount: number;
        status: string;
        startup_id: string;
        enabler_id: string;
        startup: { full_name: string | null } | null;
        enabler: { full_name: string | null } | null;
      }>();

    if (booking) {
      if (booking.session_duration_seconds) {
        durationSeconds = booking.session_duration_seconds;
      }
      wasRefunded = booking.status === "cancelled";
      creditsUsed = wasRefunded ? 0 : booking.credits_amount;

      // 상대방 이름: 현재 유저 확인 후 파트너 결정 (server에서는 auth 필요)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const isStartup = booking.startup_id === user.id;
        partnerName = isStartup
          ? (booking.enabler?.full_name ?? null)
          : (booking.startup?.full_name ?? null);
      }
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-black)",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "var(--color-card)",
          borderRadius: 20,
          padding: 40,
          border: "1px solid var(--color-border)",
          textAlign: "center",
        }}
      >
        {/* 완료 아이콘 */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: wasRefunded ? "oklch(0.63 0.2 25 / 0.15)" : "oklch(0.7 0.17 145 / 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 28,
          }}
        >
          {wasRefunded ? "↩" : "✓"}
        </div>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: 8,
          }}
        >
          {wasRefunded ? "세션이 짧게 종료됐습니다" : "세션이 완료됐습니다 ✓"}
        </h1>

        {partnerName && (
          <p style={{ color: "var(--color-dim)", fontSize: 14, marginBottom: 24 }}>
            {partnerName} 님과의 세션
          </p>
        )}

        {/* 세션 정보 카드 */}
        <div
          style={{
            background: "var(--color-dark)",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 28,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {durationSeconds !== null && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--color-dim)" }}>세션 길이</span>
              <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
                {formatDuration(durationSeconds)}
              </span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "var(--color-dim)" }}>토큰</span>
            <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
              {wasRefunded
                ? "환불됨"
                : creditsUsed !== null
                ? `${creditsUsed} 토큰 사용`
                : "정산 완료"}
            </span>
          </div>
        </div>

        {wasRefunded && (
          <p
            style={{
              fontSize: 13,
              color: "var(--color-dim)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            세션 시간이 5분 미만이어서 토큰이 환불 처리됐습니다.
          </p>
        )}

        {/* CTA 버튼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!wasRefunded && bookingId && (
            <Link
              href={`/bookings?review=${bookingId}`}
              style={{
                display: "block",
                padding: "14px",
                background: "var(--color-accent)",
                color: "var(--color-black)",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              리뷰 작성하기
            </Link>
          )}
          <Link
            href="/"
            style={{
              display: "block",
              padding: "14px",
              background: "transparent",
              color: "var(--color-dim)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
