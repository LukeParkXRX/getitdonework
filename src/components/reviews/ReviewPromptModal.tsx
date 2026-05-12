"use client";

import { useState, useEffect } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { useAuth } from "@/lib/hooks/useAuth";

const DISMISS_KEY = "__review_dismissed_until";

type PendingBooking = {
  id: string;
  enabler_id: string;
  enabler_name: string;
  completed_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ReviewPromptModal() {
  const { profile } = useAuth();
  const [booking, setBooking] = useState<PendingBooking | null>(null);
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // startup 역할만 표시
    if (!profile || profile.role !== "startup") return;

    // 24시간 dismiss 체크
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    async function fetchPending() {
      try {
        const res = await fetch("/api/reviews/pending");
        if (!res.ok) return;
        const data = await res.json() as { booking: PendingBooking | null };
        if (data.booking) {
          setBooking(data.booking);
          setVisible(true);
        }
      } catch {
        // 무시
      }
    }

    fetchPending();
  }, [profile]);

  async function handleSubmit() {
    if (rating === 0) {
      setError("별점을 선택해주세요.");
      return;
    }
    if (!booking) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          target_id: booking.enabler_id,
          rating,
          comment,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "오류가 발생했습니다.");
        return;
      }
      setVisible(false);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setVisible(false);
  }

  if (!visible || !booking) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "oklch(0 0 0 / 0.7)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-dark)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 24px 60px oklch(0 0 0 / 0.6)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* 헤더 */}
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              marginBottom: "8px",
              fontFamily: "var(--font-display)",
            }}
          >
            세션 리뷰 요청
          </p>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "var(--color-text)",
              fontFamily: "var(--font-display)",
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            지난 세션이 어땠나요?
          </h2>
          <p
            style={{
              marginTop: "8px",
              fontSize: "14px",
              color: "var(--color-dim)",
              fontFamily: "var(--font-body)",
            }}
          >
            <strong style={{ color: "var(--color-text)" }}>{booking.enabler_name}</strong>
            {" "}· {formatDate(booking.completed_at)}
          </p>
        </div>

        {/* 별점 */}
        <div>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-dim)",
              marginBottom: "10px",
              fontFamily: "var(--font-body)",
            }}
          >
            전체 만족도
          </p>
          <StarRating
            value={rating}
            interactive
            onChange={setRating}
            size={32}
          />
        </div>

        {/* 코멘트 */}
        <div>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-dim)",
              marginBottom: "8px",
              fontFamily: "var(--font-body)",
            }}
          >
            코멘트 <span style={{ fontWeight: 400 }}>(선택)</span>
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="세션에 대한 솔직한 후기를 남겨주세요."
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              color: "var(--color-text)",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          />
        </div>

        {/* 에러 */}
        {error && (
          <p
            style={{
              fontSize: "13px",
              color: "#ef4444",
              fontFamily: "var(--font-body)",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        {/* 버튼 */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDismiss}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              color: "var(--color-dim)",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-dim)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            나중에
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 2,
              padding: "12px",
              backgroundColor: submitting ? "oklch(0.91 0.2 110 / 0.5)" : "var(--color-accent)",
              border: "none",
              borderRadius: "10px",
              color: "oklch(0.1 0 0)",
              fontSize: "14px",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
            }}
          >
            {submitting ? "제출 중..." : "리뷰 제출"}
          </button>
        </div>
      </div>
    </div>
  );
}
