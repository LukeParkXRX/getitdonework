"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ui";
import { getSessionEntryStatus, type EntryVariant } from "@/lib/utils/availability";
import type { BookingType } from "@/lib/db/types";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export interface RequestBooking {
  id: string;
  type: BookingType;
  status: string;
  scheduled_at: string | null;
  credits_amount: number;
  brief: string | null;
  startup_user_name: string | null;
  startup_user_avatar: string | null;
  startup_company_name: string | null;
  startup_industry: string[] | null;
  startup_stage: string | null;
}

export interface UpcomingBooking {
  id: string;
  type: BookingType;
  scheduled_at: string | null;
  credits_amount: number;
  meeting_url: string | null;
  startup_user_name: string | null;
  startup_user_avatar: string | null;
  startup_company_name: string | null;
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const SESSION_TYPE_LABEL: Record<string, string> = {
  standard: "스탠다드",
  chemistry: "케미스트리",
  project: "프로젝트",
};

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function formatScheduledAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AvatarCircle({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  const initials = (name ?? "?").slice(0, 1).toUpperCase();
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name ?? ""}
        width={36}
        height={36}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      backgroundColor: "var(--color-accent-dim)",
      color: "var(--color-accent)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "14px",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── 매칭 요청 카드 ───────────────────────────────────────────────────────────

function RequestCard({ booking, onActionDone }: {
  booking: RequestBooking;
  onActionDone: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [processing, setProcessing] = useState<"accept" | "reject" | null>(null);

  async function handleAccept() {
    setProcessing("accept");
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError(json.error ?? "수락 중 오류가 발생했습니다.");
        return;
      }
      success("수락했습니다. 세션이 확정되었습니다.");
      onActionDone();
    } catch {
      toastError("네트워크 오류가 발생했습니다.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject() {
    const reason = window.prompt("거절 사유를 입력해주세요. (비워도 됩니다)");
    if (reason === null) return; // 사용자가 취소 누름

    setProcessing("reject");
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          cancel_reason: reason.trim() || "Enabler 거절",
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError(json.error ?? "거절 중 오류가 발생했습니다.");
        return;
      }
      success("거절했습니다. 크레딧은 스타트업에 환불됩니다.");
      onActionDone();
    } catch {
      toastError("네트워크 오류가 발생했습니다.");
    } finally {
      setProcessing(null);
    }
  }

  const companyLabel = [booking.startup_company_name, booking.startup_user_name]
    .filter(Boolean)
    .join(" · ");

  const industryLabel = [
    booking.startup_industry?.join(", "),
    booking.startup_stage,
  ].filter(Boolean).join(" · ");

  return (
    <div style={{
      backgroundColor: "var(--color-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "12px",
      padding: "20px",
    }}>
      {/* 상단: 아바타 + 회사정보 + 세션타입 */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
        <AvatarCircle name={booking.startup_user_name} avatarUrl={booking.startup_user_avatar} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <p style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "var(--color-text)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {companyLabel || "—"}
            </p>
            <span style={{
              fontSize: "11px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              flexShrink: 0,
              backgroundColor: "var(--color-accent-dim)",
              padding: "2px 8px",
              borderRadius: "20px",
            }}>
              {SESSION_TYPE_LABEL[booking.type] ?? booking.type}
            </span>
          </div>
          {industryLabel && (
            <p style={{ fontSize: "12px", color: "var(--color-dim)", margin: "2px 0 0" }}>
              {industryLabel}
            </p>
          )}
          {booking.scheduled_at && (
            <p style={{ fontSize: "12px", color: "var(--color-dim)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {formatScheduledAt(booking.scheduled_at)}
            </p>
          )}
        </div>
      </div>

      {/* 브리프 */}
      {booking.brief && (
        <p style={{
          fontSize: "13px",
          color: "var(--color-dim)",
          lineHeight: 1.6,
          margin: "0 0 14px",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          borderLeft: "2px solid var(--color-border)",
          paddingLeft: "10px",
        }}>
          {booking.brief}
        </p>
      )}

      {/* 수락 / 거절 버튼 */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleAccept}
          disabled={processing !== null}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: "8px",
            border: "none",
            backgroundColor: processing !== null ? "var(--color-border)" : "var(--color-accent)",
            color: processing !== null ? "var(--color-dim)" : "var(--color-black)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: processing !== null ? "not-allowed" : "pointer",
            transition: "opacity 0.15s",
          }}
        >
          {processing === "accept" ? "처리 중..." : "수락"}
        </button>
        <button
          onClick={handleReject}
          disabled={processing !== null}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            backgroundColor: "transparent",
            color: processing !== null ? "var(--color-dim)" : "var(--color-text)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: processing !== null ? "not-allowed" : "pointer",
            transition: "opacity 0.15s",
          }}
        >
          {processing === "reject" ? "처리 중..." : "거절"}
        </button>
      </div>
    </div>
  );
}

// ─── 매칭 요청 목록 (export) ──────────────────────────────────────────────────

export function RequestsList({ bookings }: { bookings: RequestBooking[] }) {
  const router = useRouter();

  if (bookings.length === 0) {
    return (
      <div style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "32px 24px",
        textAlign: "center",
        color: "var(--color-dim)",
        fontSize: "14px",
      }}>
        아직 새 요청이 없어요. 프로필이 승인되면 매칭이 시작됩니다.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {bookings.map((b) => (
        <RequestCard key={b.id} booking={b} onActionDone={() => router.refresh()} />
      ))}
    </div>
  );
}

// 입장 버튼 variant별 색상 맵 (입장 상태 로직은 @/lib/utils/availability 공용 사용)
const ENTRY_VARIANT_STYLES: Record<EntryVariant, { bg: string; text: string; border: string }> = {
  accent: {
    bg: "transparent",
    text: "var(--color-accent)",
    border: "var(--color-accent)",
  },
  amber: {
    bg: "color-mix(in oklch, var(--color-amber) 10%, transparent)",
    text: "var(--color-amber)",
    border: "color-mix(in oklch, var(--color-amber) 30%, transparent)",
  },
  dim: {
    bg: "color-mix(in oklch, var(--color-border) 30%, transparent)",
    text: "var(--color-dim)",
    border: "var(--color-border)",
  },
};

// ─── 다가오는 세션 목록 (export) ─────────────────────────────────────────────

export function UpcomingSessionsList({ bookings, displayName }: {
  bookings: UpcomingBooking[];
  displayName: string;
}) {
  if (bookings.length === 0) {
    return (
      <div style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "32px 24px",
        textAlign: "center",
        color: "var(--color-dim)",
        fontSize: "14px",
      }}>
        예정된 세션이 없어요.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {bookings.map((b) => {
        const companyLabel = [b.startup_company_name, b.startup_user_name]
          .filter(Boolean)
          .join(" · ");
        const sessionHref = b.meeting_url
          ?? `/meeting/session-${b.id}?name=${encodeURIComponent(displayName)}`;

        const entry = getSessionEntryStatus(b.scheduled_at);
        const colors = ENTRY_VARIANT_STYLES[entry.variant];

        return (
          <div key={b.id} style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: 0 }}>
              <AvatarCircle name={b.startup_user_name} avatarUrl={b.startup_user_avatar} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {companyLabel || "—"}
                </p>
                <p style={{ fontSize: "12px", color: "var(--color-dim)", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  {b.scheduled_at ? formatScheduledAt(b.scheduled_at) : "—"}
                  {" · "}
                  {SESSION_TYPE_LABEL[b.type] ?? b.type}
                  {" · "}
                  {b.credits_amount}C
                </p>
              </div>
            </div>
            {/* 입장 가능 여부에 따라 링크(a) 또는 비활성 라벨(span) — 스타일 공통 */}
            {(() => {
              const Tag = entry.canEnter ? "a" : "span";
              return (
                <Tag
                  {...(entry.canEnter ? { href: sessionHref } : {})}
                  style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: colors.text,
                    textDecoration: "none",
                    flexShrink: 0,
                    padding: "6px 12px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    backgroundColor: colors.bg,
                    ...(entry.canEnter ? {} : { cursor: "not-allowed" }),
                  }}
                >
                  {entry.label}
                </Tag>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
