"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Pagination, useToast, Modal, StarRating } from "@/components/ui";
import { getSessionEntryStatus } from "@/lib/utils/availability";

// ── 공개 타입 (page.tsx에서 import) ───────────────────────────────────────────

export interface BookingWithEnabler {
  id: string;
  type: "chemistry" | "standard" | "project";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduled_at: string | null;
  credits_amount: number;
  brief: string | null;
  meeting_url: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  completed_at: string | null;
  created_at: string;
  enabler_id: string;
  enabler_user_name: string | null;
  enabler_avatar_url: string | null;
  enabler_university: string | null;
  enabler_degree_type: string | null;
  enabler_specialties: string[] | null;
  enabler_badge_level: string | null;
  reviewed?: boolean;
  dispute_status?: string | null;
}

// ── 내부 타입 ─────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "pending" | "confirmed" | "completed" | "cancelled";
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
type BookingType = "chemistry" | "standard" | "project";

// ── 상수 ──────────────────────────────────────────────────────────────────────

const STATUS_LABEL_KEYS: Record<BookingStatus, string> = {
  pending: "statusPending",
  confirmed: "statusConfirmed",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

const TYPE_LABEL_KEYS: Record<BookingType, string> = {
  chemistry: "typeChemistry",
  standard: "typeStandard",
  project: "typeProject",
};

const FILTER_TABS: { key: FilterStatus; labelKey: string }[] = [
  { key: "all", labelKey: "filterAll" },
  { key: "pending", labelKey: "statusPending" },
  { key: "confirmed", labelKey: "statusConfirmed" },
  { key: "completed", labelKey: "statusCompleted" },
  { key: "cancelled", labelKey: "statusCancelled" },
];

const PAGE_SIZE = 10;

// ── 유틸 함수 ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null, unscheduledLabel: string) {
  if (!iso) return unscheduledLabel;
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function avatarInitial(name: string | null) {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

// ── 뱃지 컴포넌트 ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const t = useTranslations("Bookings");
  const colorMap: Record<BookingStatus, string> = {
    pending: "var(--color-amber)",
    confirmed: "var(--color-blue)",
    completed: "var(--color-green)",
    cancelled: "var(--color-red)",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 15,
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: colorMap[status],
        border: `1px solid ${colorMap[status]}`,
        backgroundColor: `color-mix(in oklch, ${colorMap[status]} 12%, transparent)`,
      }}
    >
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );
}

function TypeBadge({ type }: { type: BookingType }) {
  const t = useTranslations("Bookings");
  const colorMap: Record<BookingType, string> = {
    chemistry: "oklch(0.72 0.18 300)",
    standard: "var(--color-blue)",
    project: "var(--color-accent)",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 14,
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        letterSpacing: "0.03em",
        color: colorMap[type],
        border: `1px solid ${colorMap[type]}`,
        backgroundColor: `color-mix(in oklch, ${colorMap[type]} 10%, transparent)`,
      }}
    >
      {t(TYPE_LABEL_KEYS[type])}
    </span>
  );
}

// ── ReviewModal ───────────────────────────────────────────────────────────────

function ReviewModal({
  booking,
  onClose,
  onDone,
}: {
  booking: BookingWithEnabler;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("Bookings");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit() {
    if (rating === 0) {
      toast.error(t("reviewSelectRating"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          target_id: booking.enabler_id,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        toast.error(body.error ?? t("reviewSubmitError"));
        return;
      }
      toast.success(t("reviewSubmitted"));
      onDone();
    } catch {
      toast.error(t("networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={t("reviewTitle")} size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Enabler 정보 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            backgroundColor: "var(--color-dark)",
            borderRadius: 8,
          }}
        >
          {booking.enabler_avatar_url ? (
            <Image
              src={booking.enabler_avatar_url}
              alt={booking.enabler_user_name ?? t("enablerFallback")}
              width={36}
              height={36}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "var(--color-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-accent)",
              }}
            >
              {(booking.enabler_user_name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--color-text)" }}>
              {booking.enabler_user_name ?? t("enablerFallback")}
            </p>
            <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-dim)" }}>
              {t("typeSession", { type: t(TYPE_LABEL_KEYS[booking.type]) })}
            </p>
          </div>
        </div>

        {/* 별점 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--color-text)",
            }}
          >
            {t("ratingLabel")} <span style={{ color: "var(--color-red)" }}>*</span>
          </label>
          <StarRating value={rating} interactive onChange={setRating} size={28} />
          {rating > 0 && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-dim)" }}>
              {["", t("rating1"), t("rating2"), t("rating3"), t("rating4"), t("rating5")][rating]}
            </span>
          )}
        </div>

        {/* 코멘트 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--color-text)",
            }}
          >
            {t("commentLabel")} <span style={{ color: "var(--color-dim)", fontWeight: 400 }}>{t("optionalSuffix")}</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 1000))}
            placeholder={t("commentPlaceholder")}
            rows={4}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-dark)",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-dim)", alignSelf: "flex-end" }}>
            {comment.length}/1000
          </span>
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-dim)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor: rating === 0 ? "oklch(0.91 0.2 110 / 0.3)" : "var(--color-accent)",
              color: rating === 0 ? "var(--color-dim)" : "var(--color-black)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              cursor: submitting || rating === 0 ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? t("submitting") : t("reviewSubmit")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── DisputeModal ──────────────────────────────────────────────────────────────

const DISPUTE_REASONS = [
  { value: "service_not_provided", labelKey: "disputeReasonNotProvided" },
  { value: "different_from_promised", labelKey: "disputeReasonDifferent" },
  { value: "payment_error", labelKey: "disputeReasonPayment" },
  { value: "other", labelKey: "disputeReasonOther" },
] as const;

function DisputeModal({
  booking,
  onClose,
  onDone,
}: {
  booking: BookingWithEnabler;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("Bookings");
  const [reason, setReason] = useState<string>(DISPUTE_REASONS[0].value);
  const [details, setDetails] = useState("");
  const [evidenceRaw, setEvidenceRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit() {
    if (details.trim().length < 30) {
      toast.error(t("disputeMinLengthError"));
      return;
    }
    setSubmitting(true);
    try {
      const evidenceUrls = evidenceRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          reason,
          details: details.trim(),
          evidenceUrls,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? t("disputeSubmitError"));
        return;
      }
      toast.success(t("disputeSubmitted"));
      onDone();
    } catch {
      toast.error(t("networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={t("disputeTitle")} size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 안내 */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            backgroundColor: "color-mix(in oklch, var(--color-amber) 10%, transparent)",
            border: "1px solid color-mix(in oklch, var(--color-amber) 30%, transparent)",
            fontSize: 13,
            color: "var(--color-amber)",
            fontFamily: "var(--font-body)",
            lineHeight: 1.5,
          }}
        >
          {t("disputeNotice")}
        </div>

        {/* 사유 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--color-text)",
            }}
          >
            {t("disputeReasonLabel")} <span style={{ color: "var(--color-red)" }}>*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-dark)",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              outline: "none",
            }}
          >
            {DISPUTE_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {t(r.labelKey)}
              </option>
            ))}
          </select>
        </div>

        {/* 상세 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--color-text)",
            }}
          >
            {t("disputeDetailsLabel")} <span style={{ color: "var(--color-red)" }}>*</span>{" "}
            <span style={{ color: "var(--color-dim)", fontWeight: 400 }}>{t("disputeMinChars")}</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
            placeholder={t("disputeDetailsPlaceholder")}
            rows={5}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${details.length > 0 && details.length < 30 ? "var(--color-red)" : "var(--color-border)"}`,
              backgroundColor: "var(--color-dark)",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: details.length < 30 ? "var(--color-red)" : "var(--color-dim)",
              alignSelf: "flex-end",
            }}
          >
            {t("disputeCharCount", { count: details.length })}
          </span>
        </div>

        {/* 증빙 URL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--color-text)",
            }}
          >
            {t("evidenceUrlLabel")}{" "}
            <span style={{ color: "var(--color-dim)", fontWeight: 400 }}>{t("evidenceUrlHint")}</span>
          </label>
          <input
            type="text"
            value={evidenceRaw}
            onChange={(e) => setEvidenceRaw(e.target.value)}
            placeholder="https://... , https://..."
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-dark)",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              outline: "none",
            }}
          />
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              backgroundColor: "transparent",
              color: "var(--color-dim)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || details.trim().length < 30}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor:
                details.trim().length < 30
                  ? "color-mix(in oklch, var(--color-red) 20%, transparent)"
                  : "var(--color-red)",
              color: details.trim().length < 30 ? "var(--color-dim)" : "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 15,
              cursor: submitting || details.trim().length < 30 ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? t("disputeSubmitting") : t("disputeSubmit")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── ActionArea ────────────────────────────────────────────────────────────────

function ActionArea({ booking }: { booking: BookingWithEnabler }) {
  const t = useTranslations("Bookings");
  const [btnHovered, setBtnHovered] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeFiled, setDisputeFiled] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleCancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: t("userCancelReason") }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        toast.error(body.error ?? t("cancelError"));
        return;
      }
      toast.success(t("bookingCancelled"));
      router.refresh();
    } catch {
      toast.error(t("networkError"));
    } finally {
      setCancelling(false);
    }
  }

  if (booking.status === "confirmed") {
    const entry = getSessionEntryStatus(booking.scheduled_at);
    const entryLabel = entry.canEnter
      ? t("entryJoinNow")
      : entry.kind === "hours"
      ? t("entryHoursUntil", { value: entry.value ?? 0 })
      : entry.kind === "mins"
      ? t("entryMinsUntil", { value: entry.value ?? 0 })
      : t("entryExpired");
    const href = booking.meeting_url ?? `/meeting/session-${booking.id}`;
    const colorMap = {
      accent: { bg: "var(--color-accent)", bgHover: "oklch(0.82 0.22 130)", text: "var(--color-black)" },
      amber: { bg: "color-mix(in oklch, var(--color-amber) 15%, transparent)", bgHover: "color-mix(in oklch, var(--color-amber) 25%, transparent)", text: "var(--color-amber)" },
      dim: { bg: "color-mix(in oklch, var(--color-border) 40%, transparent)", bgHover: "color-mix(in oklch, var(--color-border) 60%, transparent)", text: "var(--color-dim)" },
    };
    const c = colorMap[entry.variant];
    if (entry.canEnter) {
      return (
        <Link
          href={href}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 16,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            textDecoration: "none",
            backgroundColor: btnHovered ? c.bgHover : c.bg,
            color: c.text,
            transition: "background-color 0.15s ease",
            flexShrink: 0,
          }}
        >
          {entryLabel}
        </Link>
      );
    }
    return (
      <span
        style={{
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: 8,
          fontSize: 15,
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          backgroundColor: c.bg,
          color: c.text,
          flexShrink: 0,
        }}
      >
        {entryLabel}
      </span>
    );
  }

  if (booking.status === "pending") {
    return (
      <button
        onClick={handleCancel}
        disabled={cancelling}
        onMouseEnter={() => setBtnHovered(true)}
        onMouseLeave={() => setBtnHovered(false)}
        style={{
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: 8,
          fontSize: 16,
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          border: `1px solid ${btnHovered ? "var(--color-red)" : "var(--color-border)"}`,
          backgroundColor: btnHovered
            ? "color-mix(in oklch, var(--color-red) 10%, transparent)"
            : "transparent",
          color: btnHovered ? "var(--color-red)" : "var(--color-dim)",
          cursor: cancelling ? "not-allowed" : "pointer",
          opacity: cancelling ? 0.6 : 1,
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      >
        {cancelling ? t("cancelling") : t("cancelBooking")}
      </button>
    );
  }

  if (booking.status === "completed") {
    const alreadyReviewed = booking.reviewed || reviewDone;
    const hasDispute =
      disputeFiled ||
      (booking.dispute_status != null && booking.dispute_status !== "cancelled");

    return (
      <>
        {reviewOpen && (
          <ReviewModal
            booking={booking}
            onClose={() => setReviewOpen(false)}
            onDone={() => {
              setReviewDone(true);
              setReviewOpen(false);
            }}
          />
        )}
        {disputeOpen && (
          <DisputeModal
            booking={booking}
            onClose={() => setDisputeOpen(false)}
            onDone={() => {
              setDisputeFiled(true);
              setDisputeOpen(false);
            }}
          />
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => !alreadyReviewed && setReviewOpen(true)}
            disabled={alreadyReviewed}
            onMouseEnter={() => !alreadyReviewed && setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 8,
              fontSize: 16,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              border: alreadyReviewed
                ? "1px solid var(--color-border)"
                : `1px solid ${btnHovered ? "var(--color-accent)" : "var(--color-border)"}`,
              backgroundColor: alreadyReviewed
                ? "transparent"
                : btnHovered
                ? "color-mix(in oklch, var(--color-accent) 12%, transparent)"
                : "transparent",
              color: alreadyReviewed ? "var(--color-dim)" : btnHovered ? "var(--color-accent)" : "var(--color-dim)",
              cursor: alreadyReviewed ? "not-allowed" : "pointer",
              opacity: alreadyReviewed ? 0.6 : 1,
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
          >
            {alreadyReviewed ? t("reviewDone") : t("reviewWrite")}
          </button>

          {hasDispute ? (
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                border: "1px solid color-mix(in oklch, var(--color-amber) 40%, transparent)",
                backgroundColor: "color-mix(in oklch, var(--color-amber) 10%, transparent)",
                color: "var(--color-amber)",
                flexShrink: 0,
              }}
            >
              {t("disputeInProgress")}
            </span>
          ) : (
            <button
              onClick={() => setDisputeOpen(true)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                border: "1px solid var(--color-border)",
                backgroundColor: "transparent",
                color: "var(--color-dim)",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-red)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-red)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "color-mix(in oklch, var(--color-red) 8%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              {t("disputeSubmit")}
            </button>
          )}
        </div>
      </>
    );
  }

  if (booking.status === "cancelled" && booking.cancel_reason) {
    return (
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--color-dim)",
          fontStyle: "italic",
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={booking.cancel_reason}
      >
        {t("rejectReason", { reason: booking.cancel_reason })}
      </span>
    );
  }

  return null;
}

// ── BookingCard ───────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: BookingWithEnabler }) {
  const t = useTranslations("Bookings");
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "var(--color-card)",
        border: `1px solid ${hovered ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "border-color 0.18s ease",
        cursor: "default",
      }}
    >
      {/* 상단: 이네이블러 정보 + 상태 뱃지 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {booking.enabler_avatar_url ? (
            <Image
              src={booking.enabler_avatar_url}
              alt={booking.enabler_user_name ?? t("enablerFallback")}
              width={32}
              height={32}
              style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "var(--color-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 16,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-accent)",
              }}
            >
              {avatarInitial(booking.enabler_user_name)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 16,
                color: "var(--color-text)",
                lineHeight: 1.2,
              }}
            >
              {booking.enabler_user_name ?? t("unknown")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                color: "var(--color-dim)",
                lineHeight: 1.2,
              }}
            >
              {booking.enabler_university ?? ""}
            </span>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* 세션 타입 + 일정 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TypeBadge type={booking.type} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            color: "var(--color-dim)",
          }}
        >
          {formatDate(booking.scheduled_at, t("unscheduled"))}
        </span>
      </div>

      {/* 브리프 */}
      {booking.brief && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 17,
            color: "var(--color-text)",
            lineHeight: 1.6,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {booking.brief}
        </p>
      )}

      {/* 하단: 크레딧 + 액션 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 17,
            color: "var(--color-dim)",
          }}
        >
          {t("creditsAmount", { count: booking.credits_amount })}
        </span>
        <ActionArea booking={booking} />
      </div>
    </div>
  );
}

// ── 메인 클라이언트 컴포넌트 ──────────────────────────────────────────────────

// ── Notice 메시지 맵 ──────────────────────────────────────────────────────────

const NOTICE_MESSAGES: Record<string, { textKey: string; color: string; border: string }> = {
  enabler_pending: {
    textKey: "noticeEnablerPending",
    color: "var(--color-amber)",
    border: "color-mix(in oklch, var(--color-amber) 35%, transparent)",
  },
  too_early: {
    textKey: "noticeTooEarly",
    color: "var(--color-blue)",
    border: "color-mix(in oklch, var(--color-blue) 35%, transparent)",
  },
  session_ended: {
    textKey: "noticeSessionEnded",
    color: "var(--color-dim)",
    border: "var(--color-border)",
  },
  session_expired: {
    textKey: "noticeSessionExpired",
    color: "var(--color-dim)",
    border: "var(--color-border)",
  },
};

export default function BookingsListClient({ bookings }: { bookings: BookingWithEnabler[] }) {
  const t = useTranslations("Bookings");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  // 세션 종료 후 자동 리뷰 모달을 사용자가 닫았는지 여부 (대상 자체는 URL에서 파생)
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const noticeCfg = notice ? NOTICE_MESSAGES[notice] : null;

  // 세션 종료 후 리뷰 작성 유도: ?review=<bookingId> — completed & 미작성 예약이면 모달 대상
  const reviewTarget = searchParams.get("review");
  const autoReviewBooking = !reviewDismissed && reviewTarget
    ? bookings.find(
        (b) => b.id === reviewTarget && b.status === "completed" && !b.reviewed
      ) ?? null
    : null;

  const countByStatus = useMemo(
    () =>
      bookings.reduce<Record<string, number>>((acc, b) => {
        acc[b.status] = (acc[b.status] ?? 0) + 1;
        return acc;
      }, {}),
    [bookings]
  );

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? bookings
        : bookings.filter((b) => b.status === activeFilter),
    [bookings, activeFilter]
  );

  const pagedBookings = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function handleFilterChange(key: FilterStatus) {
    setActiveFilter(key);
    setPage(1);
  }

  // 빈 상태 분기: DB 자체 0건 vs 필터 결과 0건
  const isEmptyAll = bookings.length === 0;
  const isEmptyFiltered = filtered.length === 0 && !isEmptyAll;

  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-black)",
        padding: "40px 32px",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      {/* 세션 종료 후 자동 리뷰 모달 */}
      {autoReviewBooking && (
        <ReviewModal
          booking={autoReviewBooking}
          onClose={() => setReviewDismissed(true)}
          onDone={() => {
            setReviewDismissed(true);
            router.refresh();
          }}
        />
      )}
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 28,
            color: "var(--color-text)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {t("pageTitle")}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 16,
            color: "var(--color-dim)",
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          {t("totalCount", { count: bookings.length })}
        </p>
      </div>

      {/* Notice 배너 */}
      {noticeCfg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: `1px solid ${noticeCfg.border}`,
            backgroundColor: `color-mix(in oklch, ${noticeCfg.color} 10%, transparent)`,
            color: noticeCfg.color,
            fontFamily: "var(--font-body)",
            fontSize: 15,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {t(noticeCfg.textKey)}
        </div>
      )}

      {/* 필터 탭 — 모바일에서 화면 너비 초과 시 가로 스크롤 (잘림 방지) */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          backgroundColor: "var(--color-dark)",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        {FILTER_TABS.map(({ key, labelKey }) => {
          const isActive = activeFilter === key;
          const count = key === "all" ? bookings.length : (countByStatus[key] ?? 0);
          return (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 17,
                backgroundColor: isActive ? "var(--color-accent)" : "transparent",
                color: isActive ? "var(--color-black)" : "var(--color-dim)",
                transition: "all 0.15s ease",
              }}
            >
              {t(labelKey)}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  fontSize: 14,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  backgroundColor: isActive
                    ? "color-mix(in oklch, var(--color-black) 20%, transparent)"
                    : "var(--color-card)",
                  color: isActive ? "var(--color-black)" : "var(--color-dim)",
                  padding: "0 4px",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 빈 상태: DB에 예약 자체 없음 */}
      {isEmptyAll && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 0",
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 17,
              color: "var(--color-dim)",
              margin: 0,
            }}
          >
            {t("emptyAll")}
          </p>
          <Link
            href="/matching"
            style={{
              marginTop: 8,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 17,
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            {t("findEnablers")}
          </Link>
        </div>
      )}

      {/* 빈 상태: 필터 결과 없음 */}
      {isEmptyFiltered && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 0",
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 17,
              color: "var(--color-dim)",
              margin: 0,
            }}
          >
            {t("emptyFiltered", { status: t(STATUS_LABEL_KEYS[activeFilter as BookingStatus]) })}
          </p>
          <button
            onClick={() => handleFilterChange("all")}
            style={{
              marginTop: 8,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 17,
              color: "var(--color-accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t("viewAll")}
          </button>
        </div>
      )}

      {/* 목록 */}
      {!isEmptyAll && !isEmptyFiltered && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pagedBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
