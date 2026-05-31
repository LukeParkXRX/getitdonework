import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ bookingId?: string; duration?: string }>;
}

function formatDuration(
  seconds: number,
  t: Awaited<ReturnType<typeof getTranslations<"SessionEnded">>>
): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return t("durationSec", { seconds: s });
  return t("durationMinSec", { minutes: m, seconds: s });
}

export default async function SessionEndedPage({ searchParams }: PageProps) {
  const t = await getTranslations("SessionEnded");
  const { bookingId, duration: durationParam } = await searchParams;

  let durationSeconds: number | null = durationParam ? parseInt(durationParam, 10) : null;
  let creditsUsed: number | null = null;
  let wasRefunded = false;
  let partnerName: string | null = null;
  // 사용자 역할에 따른 CTA 분기 (기본값: startup) — booking 당사자 정보로 도출
  let isEnabler = false;

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

      // 현재 유저 확인 후 역할 조회 및 파트너 결정
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const isStartup = booking.startup_id === user.id;
        partnerName = isStartup
          ? (booking.enabler?.full_name ?? null)
          : (booking.startup?.full_name ?? null);
        // 이 booking의 당사자이므로 startup이 아니면 enabler — 별도 role 조회 불필요
        isEnabler = !isStartup;
      }
    }
  }

  // 역할별 CTA 경로·텍스트 결정
  const homeHref = isEnabler ? "/enabler-dashboard" : "/bookings";
  const homeLabel = isEnabler ? t("toDashboard") : t("viewMyBookings");

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
          {wasRefunded ? t("shortEndTitle") : t("completedTitle")}
        </h1>

        {partnerName && (
          <p style={{ color: "var(--color-dim)", fontSize: 14, marginBottom: 24 }}>
            {t("sessionWith", { partnerName })}
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
              <span style={{ color: "var(--color-dim)" }}>{t("sessionDuration")}</span>
              <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
                {formatDuration(durationSeconds, t)}
              </span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "var(--color-dim)" }}>{t("tokens")}</span>
            <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
              {wasRefunded
                ? t("refunded")
                : creditsUsed !== null
                ? t("tokensUsed", { count: creditsUsed })
                : t("settled")}
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
            {t("refundNote")}
          </p>
        )}

        {/* CTA 버튼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!wasRefunded && bookingId && !isEnabler && (
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
              {t("writeReview")}
            </Link>
          )}
          <Link
            href={homeHref}
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
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
