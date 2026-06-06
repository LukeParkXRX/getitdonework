"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import type { EnablerDetail, ReviewItem, SpecialtyDetail } from "./page";
import { generateAvailableSlots, resolveTimeZone, tzAbbrev, type SlotDay } from "@/lib/utils/timezone";

// 소개(bio) 마크다운 렌더 — 공개 상세에서만 사용하므로 dynamic import로 코드 스플릿
const BioMarkdown = dynamic(() => import("./BioMarkdown"), {
  ssr: false,
  loading: () => null,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type SessionType = "chemistry" | "standard" | "project";

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_OPTIONS: {
  id: SessionType;
  icon: string;
  label: string;
  sublabel: string;
  credits: string;
  duration: string;
}[] = [
  {
    id: "chemistry",
    icon: "⚡",
    label: "Chemistry Call",
    sublabel: "첫 만남 / 무료",
    credits: "Free",
    duration: "15분",
  },
  {
    id: "standard",
    icon: "📋",
    label: "Standard Session",
    sublabel: "심화 상담",
    credits: "1 Credit",
    duration: "60분",
  },
  {
    id: "project",
    icon: "🎯",
    label: "Project Consultation",
    sublabel: "프로젝트 단위 · 별도 협의",
    credits: "1 Credit",
    duration: "협의",
  },
];

const FALLBACK_ICONS = ["◈", "◉", "◐", "◑", "◒", "◓", "◔", "◕"];

function buildSpecialtyCards(enabler: EnablerDetail): SpecialtyDetail[] {
  if (enabler.specialtyDetails.length > 0) return enabler.specialtyDetails;
  // legacy fallback: specialties 태그 배열만 있는 경우
  return enabler.specialties.map((title, i) => ({
    icon: FALLBACK_ICONS[i % FALLBACK_ICONS.length],
    title,
    description: "",
  }));
}

// ── Helper components ─────────────────────────────────────────────────────────

function SectionHeading({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between mb-4"
      style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}
    >
      <h2
        style={{
          fontSize: "14px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-dim)",
        }}
      >
        {children}
      </h2>
      {action}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          style={{
            width: "14px",
            height: "14px",
            fill: i < Math.floor(rating) ? "var(--color-gold)" : "var(--color-border)",
          }}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

// ── ReportModal ───────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  { value: "spam", label: "스팸" },
  { value: "hate", label: "욕설·혐오" },
  { value: "false_info", label: "허위 정보" },
  { value: "privacy", label: "사적 정보 포함" },
  { value: "etc", label: "기타" },
];

function ReportModal({
  reviewId,
  onClose,
  onSuccess,
  onAlreadyReported,
}: {
  reviewId: string;
  onClose: () => void;
  onSuccess: () => void;
  onAlreadyReported: () => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      if (res.status === 409) {
        onAlreadyReported();
        onClose();
        return;
      }
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "신고 실패");
        return;
      }
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--color-dark)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "28px 24px",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "18px",
            color: "var(--color-text)",
            marginBottom: "20px",
          }}
        >
          리뷰 신고
        </h3>

        {/* 사유 선택 */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              color: "var(--color-dim)",
              fontFamily: "var(--font-body)",
              marginBottom: "8px",
            }}
          >
            신고 사유 <span style={{ color: "var(--color-accent)" }}>*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              color: reason ? "var(--color-text)" : "var(--color-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="" disabled>
              사유를 선택하세요
            </option>
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* 추가 설명 */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              color: "var(--color-dim)",
              fontFamily: "var(--font-body)",
              marginBottom: "8px",
            }}
          >
            추가 설명 (선택)
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="자세한 내용을 입력하세요"
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              color: "var(--color-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            style={{
              padding: "10px 18px",
              background: reason ? "var(--color-accent)" : "var(--color-border)",
              border: "none",
              borderRadius: "8px",
              color: reason ? "var(--color-black)" : "var(--color-dim)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "14px",
              cursor: reason ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "신고 중..." : "신고"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

export default function EnablerDetailClient({
  enabler,
  reviews,
  currentUserId,
}: {
  enabler: EnablerDetail;
  reviews: ReviewItem[];
  currentUserId: string | null;
}) {
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const [sessionType, setSessionType] = useState<SessionType>("chemistry");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlotISO, setSelectedSlotISO] = useState<string | null>(null);
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // 뷰어(스타트업) 타임존 + 전문가 가용시간 기반 예약 슬롯
  const viewerTz = useMemo(() => resolveTimeZone(), []);
  const viewerTzAbbrev = useMemo(() => tzAbbrev(new Date(), viewerTz), [viewerTz]);
  const slotDays = useMemo<SlotDay[]>(() => {
    if (!enabler.availability) return [];
    return generateAvailableSlots(enabler.availability, viewerTz, { days: 21, slotMinutes: 30 });
  }, [enabler.availability, viewerTz]);
  const selectedDay = slotDays.find((d) => d.dateKey === selectedDateKey) ?? null;

  // 첫 가용 날짜 자동 선택
  useEffect(() => {
    if (!selectedDateKey && slotDays.length > 0) setSelectedDateKey(slotDays[0].dateKey);
  }, [slotDays, selectedDateKey]);

  // 내 크레딧 잔액 (스타트업)
  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      try {
        const res = await fetch("/api/credits/balance");
        if (!res.ok) return;
        const data = (await res.json()) as { balance?: number; credit_balance?: number };
        const bal = data.balance ?? data.credit_balance;
        if (typeof bal === "number") setCreditBalance(bal);
      } catch {
        // 무시 — 잔액 표시는 보조 정보
      }
    })();
  }, [currentUserId]);

  // 북마크 상태
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // 신고 모달 상태
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

  // 초기 북마크 상태 fetch
  useEffect(() => {
    if (!currentUserId) return;
    async function checkBookmark() {
      try {
        const res = await fetch("/api/bookmarks");
        if (!res.ok) return;
        const data = await res.json() as { bookmarks: { enabler_id: string }[] };
        const ids = (data.bookmarks ?? []).map((b) => b.enabler_id);
        setBookmarked(ids.includes(enabler.userId));
      } catch {
        // 무시
      }
    }
    checkBookmark();
  }, [currentUserId, enabler.userId]);

  async function toggleBookmark() {
    if (!currentUserId) {
      router.push(`/login?redirect=/enablers/${enabler.userId}`);
      return;
    }
    setBookmarkLoading(true);
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    try {
      if (next) {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabler_id: enabler.userId }),
        });
      } else {
        await fetch(`/api/bookmarks?enabler_id=${enabler.userId}`, { method: "DELETE" });
      }
    } catch {
      setBookmarked(!next); // 롤백
    } finally {
      setBookmarkLoading(false);
    }
  }

  async function handleStartChat() {
    if (!currentUserId) {
      router.push(`/login?redirect=/enablers/${enabler.userId}`);
      return;
    }
    if (startingChat) return;
    setStartingChat(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: enabler.userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toastError(json.error ?? "메시지를 시작할 수 없습니다.");
        return;
      }
      router.push(`/messages/${json.conversation.id}`);
    } catch {
      toastError("네트워크 오류가 발생했습니다.");
    } finally {
      setStartingChat(false);
    }
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : enabler.rating.toFixed(1);

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct:
      reviews.length > 0
        ? Math.round(
            (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
          )
        : 0,
  }));

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  async function handleSubmit() {
    if (!currentUserId) {
      router.push(`/login?redirect=/enablers/${enabler.userId}`);
      return;
    }

    if (!sessionType) {
      toastError("세션 유형을 선택해주세요.");
      return;
    }
    if (!selectedSlotISO) {
      toastError("예약 시간을 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabler_id: enabler.userId,
          type: sessionType,
          scheduled_at: selectedSlotISO,
          brief,
        }),
      });

      const json = (await res.json()) as { error?: string };

      if (res.ok) {
        success("예약 요청을 보냈습니다. Enabler가 수락하면 확정됩니다.");
        setBookingDone(true);
        setSelectedSlotISO(null);
        setBrief("");
      } else if (res.status >= 400 && res.status < 500) {
        toastError(json.error ?? "예약 요청에 실패했습니다.");
      } else {
        toastError("잠시 후 다시 시도해주세요.");
      }
    } catch {
      toastError("잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  // 아바타 이니셜 추출
  const avatarInitial = enabler.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-black)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Back breadcrumb */}
      <div
        style={{
          backgroundColor: "var(--color-black)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px 28px 0",
          }}
        >
          <Link
            href="/matching"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--color-text)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color =
                "var(--color-dim)")
            }
          >
            <svg
              style={{ width: "12px", height: "12px" }}
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2L4 6l4 4" />
            </svg>
            Enabler 찾기
          </Link>
        </div>
      </div>

      {/* Main layout */}
      <div
        className="enabler-detail-layout"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px 28px 80px",
          display: "flex",
          gap: "40px",
          alignItems: "flex-start",
        }}
      >
        {/* 모바일: 사이드바를 본문 아래로 스택 (데스크탑 불변) */}
        <style>{`
          @media (max-width: 900px) {
            .enabler-detail-layout { flex-direction: column; gap: 24px; padding-left: 16px; padding-right: 16px; }
            .enabler-detail-aside { width: 100% !important; min-width: 0 !important; position: static !important; top: auto !important; }
          }
        `}</style>
        {/* ── LEFT: Scrollable content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── HERO ── */}
          <div
            style={{
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "24px",
              position: "relative",
            }}
          >
            {/* 북마크 버튼 (우상단) */}
            <button
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
              aria-label={bookmarked ? "북마크 해제" : "북마크 추가"}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                backgroundColor: bookmarked ? "var(--color-accent-dim)" : "var(--color-card)",
                border: `1px solid ${bookmarked ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "9999px",
                color: bookmarked ? "var(--color-accent)" : "var(--color-dim)",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                cursor: bookmarkLoading ? "not-allowed" : "pointer",
                opacity: bookmarkLoading ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "15px", lineHeight: 1 }}>
                {bookmarked ? "★" : "☆"}
              </span>
              {bookmarked ? "북마크됨" : "북마크"}
            </button>

            {/* Avatar + Identity */}
            <div className="flex items-start gap-5 mb-6">
              {enabler.avatarUrl ? (
                <Image
                  src={enabler.avatarUrl}
                  alt={enabler.fullName}
                  width={180}
                  height={180}
                  priority
                  style={{
                    minWidth: "180px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "180px",
                    height: "180px",
                    minWidth: "180px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "52px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "var(--color-dim)",
                  }}
                >
                  {avatarInitial}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h1
                  style={{
                    fontSize: "26px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    color: "var(--color-text)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    marginBottom: "4px",
                  }}
                >
                  {enabler.fullName}
                </h1>
                <p
                  style={{
                    fontSize: "16px",
                    color: "var(--color-dim)",
                    fontFamily: "var(--font-body)",
                    marginBottom: "12px",
                  }}
                >
                  {enabler.degreeType} · {enabler.university}
                </p>

                {/* Badge row */}
                <div className="flex items-center flex-wrap gap-2">
                  {/* Verified */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      color: "var(--color-green)",
                      backgroundColor: "oklch(0.72 0.19 155 / 0.12)",
                      border: "1px solid oklch(0.72 0.19 155 / 0.25)",
                      padding: "2px 9px",
                      borderRadius: "9999px",
                    }}
                  >
                    Verified
                    <svg
                      style={{ width: "10px", height: "10px" }}
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </span>

                  {/* Top Rated */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      color: "var(--color-gold)",
                      backgroundColor: "oklch(0.82 0.15 85 / 0.12)",
                      border: "1px solid oklch(0.82 0.15 85 / 0.25)",
                      padding: "2px 9px",
                      borderRadius: "9999px",
                    }}
                  >
                    Top Rated ★
                  </span>

                  {/* School badge */}
                  <span
                    style={{
                      fontSize: "12px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      color: "var(--color-blue)",
                      backgroundColor: "var(--color-blue-dim)",
                      border: "1px solid oklch(0.65 0.15 250 / 0.25)",
                      padding: "2px 9px",
                      borderRadius: "9999px",
                    }}
                  >
                    {enabler.university}
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div
              className="flex items-center gap-1.5"
              style={{ color: "var(--color-dim)" }}
            >
              <svg
                style={{ width: "13px", height: "13px", flexShrink: 0 }}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 2C7.239 2 5 4.239 5 7c0 4.418 5 11 5 11s5-6.582 5-11c0-2.761-2.239-5-5-5z" />
                <circle cx="10" cy="7" r="1.5" />
              </svg>
              <span style={{ fontSize: "15px", fontFamily: "var(--font-body)" }}>
                {enabler.location}
              </span>
            </div>
          </div>

          {/* ── STATS GRID ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            {[
              { value: enabler.sessionCount, label: "Sessions" },
              { value: enabler.rating.toFixed(1), label: "Rating" },
              { value: `${enabler.reRequestRate}%`, label: "Re-request" },
              { value: "12", label: "Avg Meetings" },
            ].map(({ value, label }) => (
              <div
                key={label}
                style={{
                  backgroundColor: "var(--color-dark)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "18px 16px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "var(--color-text)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: "5px",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--color-dim)",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* ── ABOUT ── */}
          <div
            style={{
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "28px",
              marginBottom: "20px",
            }}
          >
            <SectionHeading>소개</SectionHeading>
            <div
              style={{
                fontSize: "16px",
                fontFamily: "var(--font-body)",
                color: "var(--color-text)",
                lineHeight: 1.75,
              }}
            >
              <BioMarkdown source={enabler.bio} />
            </div>
          </div>

          {/* ── SPECIALTIES ── */}
          <div
            style={{
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "28px",
              marginBottom: "20px",
            }}
          >
            <SectionHeading>전문 분야</SectionHeading>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              {buildSpecialtyCards(enabler).map(({ icon, title, description }) => (
                <div
                  key={title}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    padding: "14px",
                    backgroundColor: "var(--color-black)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "18px",
                      lineHeight: 1,
                      color: "var(--color-accent)",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    {icon}
                  </span>
                  <div>
                    <p
                      style={{
                        fontSize: "15px",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        color: "var(--color-text)",
                        marginBottom: "3px",
                        lineHeight: 1.3,
                      }}
                    >
                      {title}
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        fontFamily: "var(--font-body)",
                        color: "var(--color-dim)",
                        lineHeight: 1.5,
                      }}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CAREER ── */}
          {enabler.career.length > 0 && (
            <div
              style={{
                backgroundColor: "var(--color-dark)",
                border: "1px solid var(--color-border)",
                borderRadius: "16px",
                padding: "28px",
                marginBottom: "20px",
              }}
            >
              <SectionHeading>경력</SectionHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {enabler.career.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "16px",
                      paddingBottom: idx < enabler.career.length - 1 ? "20px" : 0,
                      marginBottom: idx < enabler.career.length - 1 ? "0" : 0,
                      position: "relative",
                    }}
                  >
                    {/* 타임라인 선 + 점 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "16px" }}>
                      <div style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-accent)",
                        border: "2px solid var(--color-accent)",
                        marginTop: "4px",
                        flexShrink: 0,
                      }} />
                      {idx < enabler.career.length - 1 && (
                        <div style={{
                          width: "1px",
                          flex: 1,
                          backgroundColor: "var(--color-border)",
                          marginTop: "6px",
                        }} />
                      )}
                    </div>

                    {/* 내용 */}
                    <div style={{ flex: 1, paddingBottom: idx < enabler.career.length - 1 ? "20px" : 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "4px", marginBottom: "2px" }}>
                        <p style={{
                          fontSize: "15px",
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          color: "var(--color-text)",
                          margin: 0,
                          lineHeight: 1.3,
                        }}>
                          {item.company}
                        </p>
                        {item.period && (
                          <span style={{
                            fontSize: "12px",
                            fontFamily: "var(--font-body)",
                            color: "var(--color-dim)",
                            flexShrink: 0,
                          }}>
                            {item.period}
                          </span>
                        )}
                      </div>
                      {item.title && (
                        <p style={{
                          fontSize: "13px",
                          fontFamily: "var(--font-body)",
                          color: "var(--color-accent)",
                          margin: "0 0 6px",
                          fontWeight: 500,
                        }}>
                          {item.title}
                        </p>
                      )}
                      {item.description && (
                        <p style={{
                          fontSize: "14px",
                          fontFamily: "var(--font-body)",
                          color: "var(--color-dim)",
                          margin: 0,
                          lineHeight: 1.6,
                        }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REVIEWS ── */}
          <div
            style={{
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "28px",
            }}
          >
            <SectionHeading>리뷰</SectionHeading>

            {reviews.length === 0 ? (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-dim)",
                  fontFamily: "var(--font-body)",
                  padding: "8px 0",
                }}
              >
                아직 리뷰가 없습니다.
              </p>
            ) : (
              <>
                {/* ── Rating Summary ── */}
                <div
                  style={{
                    display: "flex",
                    gap: "28px",
                    alignItems: "center",
                    padding: "20px 24px",
                    backgroundColor: "var(--color-black)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    marginBottom: "24px",
                  }}
                >
                  {/* Left: big average number */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      minWidth: "80px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "52px",
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        color: "var(--color-gold)",
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                      }}
                    >
                      {avgRating}
                    </span>
                    <StarRow rating={parseFloat(avgRating)} />
                    <span
                      style={{
                        fontSize: "12px",
                        fontFamily: "var(--font-body)",
                        color: "var(--color-dim)",
                        marginTop: "2px",
                      }}
                    >
                      {reviews.length}개 리뷰
                    </span>
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      width: "1px",
                      alignSelf: "stretch",
                      backgroundColor: "var(--color-border)",
                      flexShrink: 0,
                    }}
                  />

                  {/* Right: distribution bars */}
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {ratingDistribution.map(({ star, count, pct }) => (
                      <div
                        key={star}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            color: "var(--color-dim)",
                            minWidth: "18px",
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {star}
                        </span>
                        <svg
                          style={{
                            width: "11px",
                            height: "11px",
                            flexShrink: 0,
                            fill: pct > 0 ? "var(--color-gold)" : "var(--color-border)",
                          }}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div
                          style={{
                            flex: 1,
                            height: "6px",
                            backgroundColor: "var(--color-border)",
                            borderRadius: "9999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              backgroundColor: "var(--color-gold)",
                              borderRadius: "9999px",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            color: count > 0 ? "var(--color-dim)" : "var(--color-border)",
                            minWidth: "16px",
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Individual reviews ── */}
                <div>
                  {reviews.map((review, i) => (
                    <div
                      key={review.id}
                      style={{
                        padding: "20px 0",
                        borderBottom:
                          i < reviews.length - 1
                            ? "1px solid var(--color-border)"
                            : "none",
                      }}
                    >
                      {/* Reviewer header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          marginBottom: "12px",
                        }}
                      >
                        {/* Avatar */}
                        {review.authorAvatar ? (
                          <Image
                            src={review.authorAvatar}
                            alt={review.authorName ?? "리뷰어"}
                            width={40}
                            height={40}
                            style={{
                              minWidth: "40px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              minWidth: "40px",
                              borderRadius: "50%",
                              backgroundColor: "var(--color-card)",
                              border: "1px solid var(--color-border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              color: "var(--color-dim)",
                            }}
                          >
                            {(review.authorName ?? "익").slice(0, 1)}
                          </div>
                        )}

                        {/* Name + stars + date */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "15px",
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                                color: "var(--color-text)",
                              }}
                            >
                              {review.authorName ?? "익명"}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "var(--color-dim)",
                                  fontFamily: "var(--font-body)",
                                }}
                              >
                                {formatDate(review.createdAt)}
                              </span>
                              {/* 신고 버튼 — 본인 리뷰 제외 */}
                              {currentUserId && currentUserId !== review.authorId && (
                                <button
                                  onClick={() => setReportingReviewId(review.id)}
                                  title="리뷰 신고"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    padding: "2px 4px",
                                    cursor: "pointer",
                                    color: "var(--color-dim)",
                                    fontSize: "12px",
                                    fontFamily: "var(--font-body)",
                                    opacity: 0.6,
                                    lineHeight: 1,
                                  }}
                                >
                                  신고
                                </button>
                              )}
                            </div>
                          </div>
                          <StarRow rating={review.rating} />
                        </div>
                      </div>

                      {/* Comment */}
                      <p
                        style={{
                          fontSize: "15px",
                          fontFamily: "var(--font-body)",
                          color: "var(--color-text)",
                          lineHeight: 1.7,
                          paddingLeft: "52px",
                        }}
                      >
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Sticky booking sidebar ── */}
        <aside
          className="enabler-detail-aside"
          style={{
            width: "320px",
            minWidth: "320px",
            position: "sticky",
            top: "76px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {/* Credit display */}
            <div
              style={{
                padding: "20px 22px 18px",
                background:
                  "linear-gradient(135deg, oklch(0.91 0.2 110 / 0.07) 0%, var(--color-dark) 100%)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-dim)",
                  marginBottom: "4px",
                }}
              >
                크레딧
              </p>
              <div className="flex items-baseline gap-1.5">
                <span
                  style={{
                    fontSize: "36px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {enabler.creditRate}
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontFamily: "var(--font-body)",
                    color: "var(--color-dim)",
                  }}
                >
                  / session
                </span>
              </div>
            </div>

            <div style={{ padding: "18px 20px 22px" }}>
              {/* Session type selection */}
              <p
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-dim)",
                  marginBottom: "10px",
                }}
              >
                세션 유형
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginBottom: "20px",
                }}
              >
                {SESSION_OPTIONS.map((opt) => {
                  const isSelected = sessionType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSessionType(opt.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                        backgroundColor: isSelected
                          ? "var(--color-accent-dim)"
                          : "var(--color-black)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        textAlign: "left",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor =
                            "oklch(0.91 0.2 110 / 0.35)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor =
                            "var(--color-border)";
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span style={{ fontSize: "14px", lineHeight: 1 }}>
                          {opt.icon}
                        </span>
                        <div>
                          <p
                            style={{
                              fontSize: "14px",
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              color: isSelected
                                ? "var(--color-accent)"
                                : "var(--color-text)",
                              lineHeight: 1.3,
                              marginBottom: "1px",
                            }}
                          >
                            {opt.label}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              fontFamily: "var(--font-body)",
                              color: "var(--color-dim)",
                              lineHeight: 1.3,
                            }}
                          >
                            {opt.sublabel}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p
                          style={{
                            fontSize: "12px",
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            color: isSelected
                              ? "var(--color-accent)"
                              : "var(--color-text)",
                            lineHeight: 1.3,
                          }}
                        >
                          {opt.credits}
                        </p>
                        <p
                          style={{
                            fontSize: "10px",
                            fontFamily: "var(--font-body)",
                            color: "var(--color-dim)",
                            lineHeight: 1.3,
                          }}
                        >
                          {opt.duration}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 예약 시간 선택 — 전문가 가용시간 기반, 내 시간대 기준 표기 */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px", gap: "8px" }}>
                <p style={{ fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-dim)", margin: 0 }}>
                  예약 시간
                </p>
                {creditBalance !== null && (
                  <span style={{ fontSize: "11px", color: "var(--color-dim)", fontFamily: "var(--font-mono)" }}>
                    보유 {creditBalance} C
                  </span>
                )}
              </div>

              {slotDays.length === 0 ? (
                <div style={{ padding: "16px", borderRadius: "10px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-black)", marginBottom: "20px" }}>
                  <p style={{ fontSize: "12px", color: "var(--color-dim)", lineHeight: 1.6, margin: 0 }}>
                    전문가가 아직 예약 가능 시간을 등록하지 않았습니다. 아래 1:1 메시지로 문의해 보세요.
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: "11px", color: "var(--color-dim)", margin: "0 0 8px", lineHeight: 1.4 }}>
                    시간은 내 시간대({viewerTzAbbrev}) 기준 · 괄호는 전문가 현지 시각
                  </p>
                  {/* 날짜 선택 (가용 날짜만) */}
                  <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "6px", marginBottom: "10px" }}>
                    {slotDays.map((d) => {
                      const active = d.dateKey === selectedDateKey;
                      return (
                        <button
                          key={d.dateKey}
                          onClick={() => { setSelectedDateKey(d.dateKey); setSelectedSlotISO(null); }}
                          style={{
                            flexShrink: 0,
                            padding: "6px 12px",
                            borderRadius: "999px",
                            border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                            backgroundColor: active ? "var(--color-accent-dim)" : "var(--color-black)",
                            color: active ? "var(--color-accent)" : "var(--color-text)",
                            fontSize: "11px",
                            fontFamily: "var(--font-display)",
                            fontWeight: active ? 700 : 500,
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                        >
                          {d.viewerDateLabel}
                        </button>
                      );
                    })}
                  </div>
                  {/* 시간 슬롯 */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginBottom: "20px" }}>
                    {(selectedDay?.slots ?? []).map((s) => {
                      const isSelected = selectedSlotISO === s.utcISO;
                      return (
                        <button
                          key={s.utcISO}
                          onClick={() => setSelectedSlotISO(isSelected ? null : s.utcISO)}
                          style={{
                            padding: "8px 4px",
                            borderRadius: "8px",
                            border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                            backgroundColor: isSelected ? "var(--color-accent-dim)" : "var(--color-black)",
                            color: isSelected ? "var(--color-accent)" : "var(--color-text)",
                            fontFamily: "var(--font-display)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            lineHeight: 1.3,
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}
                        >
                          <span style={{ fontSize: "12px", fontWeight: isSelected ? 700 : 600 }}>{s.viewerTime}</span>
                          <span style={{ fontSize: "9px", color: "var(--color-dim)", fontWeight: 400 }}>전문가 {s.enablerTime}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Brief textarea */}
              <p
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-dim)",
                  marginBottom: "8px",
                }}
              >
                사전 브리프
              </p>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="상담 목적과 궁금한 점을 간략히 적어주세요..."
                style={{
                  width: "100%",
                  height: "70px",
                  backgroundColor: "var(--color-black)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text)",
                  resize: "none",
                  outline: "none",
                  transition: "border-color 0.15s",
                  marginBottom: "14px",
                  boxSizing: "border-box",
                  lineHeight: 1.55,
                }}
                onFocus={(e) =>
                  ((e.currentTarget as HTMLTextAreaElement).style.borderColor =
                    "var(--color-accent)")
                }
                onBlur={(e) =>
                  ((e.currentTarget as HTMLTextAreaElement).style.borderColor =
                    "var(--color-border)")
                }
              />

              {/* Submit button or done state */}
              {bookingDone ? (
                <Link
                  href="/bookings"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "13px",
                    borderRadius: "10px",
                    backgroundColor: "oklch(0.72 0.19 155)",
                    color: "white",
                    fontSize: "13px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    textAlign: "center",
                    textDecoration: "none",
                    marginBottom: "12px",
                    letterSpacing: "0.01em",
                    boxSizing: "border-box",
                  }}
                >
                  예약 요청 완료 — 내 예약 보기
                </Link>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedSlotISO || submitting}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor:
                      submitting
                        ? "oklch(0.91 0.2 110 / 0.35)"
                        : !selectedSlotISO
                        ? "oklch(0.91 0.2 110 / 0.35)"
                        : "var(--color-accent)",
                    color: submitting ? "var(--color-dim)" : "oklch(0.1 0 0)",
                    fontSize: "13px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    cursor: !selectedSlotISO || submitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    marginBottom: "12px",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSlotISO && !submitting) {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  }}
                >
                  {submitting
                    ? "전송 중..."
                    : currentUserId
                    ? "예약 요청하기"
                    : "로그인 후 예약 요청하기"}
                </button>
              )}

              {/* 1:1 메시지 버튼 */}
              <button
                onClick={handleStartChat}
                disabled={startingChat}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "11px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "transparent",
                  color: "var(--color-dim)",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  textAlign: "center",
                  cursor: startingChat ? "not-allowed" : "pointer",
                  marginBottom: "12px",
                  letterSpacing: "0.01em",
                  transition: "color 0.15s, border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  if (!startingChat) {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-dim)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                }}
              >
                {startingChat
                  ? "연결 중..."
                  : currentUserId
                  ? "1:1 메시지 보내기"
                  : "로그인 후 메시지 보내기"}
              </button>

              {/* Footer note */}
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-dim)",
                  lineHeight: 1.55,
                  textAlign: "center",
                }}
              >
                Chemistry Call은 무료입니다. 첫 만남 후 정규 세션을 예약하세요.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* 신고 모달 */}
      {reportingReviewId && (
        <ReportModal
          reviewId={reportingReviewId}
          onClose={() => setReportingReviewId(null)}
          onSuccess={() => success("신고 접수됨. 운영자가 검토합니다.")}
          onAlreadyReported={() => toastError("이미 신고하셨습니다.")}
        />
      )}
    </div>
  );
}
