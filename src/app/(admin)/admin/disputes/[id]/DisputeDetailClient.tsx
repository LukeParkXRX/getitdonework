"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";

// ── 타입 ──────────────────────────────────────────────────────────────────────

type UserCard = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type BookingDetail = {
  id: string;
  credits_amount: number;
  scheduled_at: string | null;
  type: string;
  brief: string | null;
  startup: UserCard | null;
  enabler: UserCard | null;
};

export type DisputeDetail = {
  id: string;
  status: string;
  filer_role: "startup" | "enabler";
  reason: string;
  details: string | null;
  evidence_urls: string[];
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  refund_amount: number | null;
  booking: BookingDetail | null;
  filer: UserCard | null;
  resolver: { id: string; full_name: string | null } | null;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  open: "접수",
  in_review: "검토 중",
  resolved_refund: "전액 환불",
  resolved_partial: "부분 환불",
  resolved_dismissed: "기각",
  cancelled: "취소",
};

const STATUS_COLORS: Record<string, string> = {
  open: "var(--color-amber)",
  in_review: "var(--color-blue)",
  resolved_refund: "var(--color-green)",
  resolved_partial: "oklch(0.72 0.18 300)",
  resolved_dismissed: "var(--color-dim)",
  cancelled: "var(--color-red)",
};

const REASON_LABELS: Record<string, string> = {
  service_not_provided: "서비스 미제공",
  different_from_promised: "약속과 다름",
  payment_error: "결제 오류",
  other: "기타",
};

const TYPE_LABELS: Record<string, string> = {
  chemistry: "케미스트리",
  standard: "스탠다드",
  project: "프로젝트",
};

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 15,
          color: "var(--color-dim)",
          margin: "0 0 16px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function UserInfoCard({ user, role }: { user: UserCard | null; role: string }) {
  if (!user)
    return (
      <div style={{ color: "var(--color-dim)", fontSize: 14 }}>정보 없음</div>
    );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "var(--color-dark)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          color: "var(--color-accent)",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.full_name ?? role}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          (user.full_name ?? role).charAt(0).toUpperCase()
        )}
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--color-text)",
          }}
        >
          {user.full_name ?? "-"}
        </div>
        <div style={{ fontSize: 13, color: "var(--color-dim)" }}>{user.email}</div>
        <div
          style={{
            fontSize: 11,
            color: "var(--color-accent)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginTop: 2,
          }}
        >
          {role}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function DisputeDetailClient({
  dispute: initialDispute,
}: {
  dispute: DisputeDetail;
}) {
  const [dispute, setDispute] = useState<DisputeDetail>(initialDispute);
  const [refundAmount, setRefundAmount] = useState<number>(
    dispute.booking?.credits_amount ?? 0
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const isResolved = [
    "resolved_refund",
    "resolved_partial",
    "resolved_dismissed",
    "cancelled",
  ].includes(dispute.status);

  const maxRefund = dispute.booking?.credits_amount ?? 0;

  async function handleMarkInReview() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/disputes/${dispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_in_review" }),
      });
      const json = (await res.json()) as { dispute?: DisputeDetail; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "처리 실패");
        return;
      }
      toast.success("검토 시작으로 상태가 변경되었습니다.");
      if (json.dispute) setDispute((prev) => ({ ...prev, status: "in_review" }));
      router.refresh();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve() {
    if (!notes.trim()) {
      toast.error("결정 사유를 입력해주세요.");
      return;
    }
    if (refundAmount < 0 || refundAmount > maxRefund) {
      toast.error(`환불 금액은 0 ~ ${maxRefund} 사이여야 합니다.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/disputes/${dispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          refundAmount,
          notes: notes.trim(),
        }),
      });
      const json = (await res.json()) as { dispute?: DisputeDetail; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "처리 실패");
        return;
      }
      const label =
        refundAmount === maxRefund
          ? "전액 환불"
          : refundAmount > 0
          ? `부분 환불 (${refundAmount} 토큰)`
          : "기각";
      toast.success(`분쟁이 처리되었습니다: ${label}`);
      if (json.dispute) setDispute(json.dispute);
      router.refresh();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", fontFamily: "var(--font-body)" }}>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 22,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            분쟁 #{shortId(dispute.id)}
          </h1>
          <p style={{ marginTop: 4, color: "var(--color-dim)", fontSize: 13 }}>
            신청일: {formatDate(dispute.created_at)}
          </p>
        </div>
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: STATUS_COLORS[dispute.status] ?? "var(--color-dim)",
            border: `1px solid ${STATUS_COLORS[dispute.status] ?? "var(--color-border)"}`,
            backgroundColor: `color-mix(in oklch, ${STATUS_COLORS[dispute.status] ?? "var(--color-dim)"} 12%, transparent)`,
          }}
        >
          {STATUS_LABELS[dispute.status] ?? dispute.status}
        </span>
      </div>

      {/* 분쟁 정보 */}
      <SectionCard title="분쟁 내용">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="사유" value={REASON_LABELS[dispute.reason] ?? dispute.reason} />
          {dispute.details && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-dim)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}
              >
                상세 내용
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-dark)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {dispute.details}
              </div>
            </div>
          )}
          {dispute.evidence_urls.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-dim)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}
              >
                증빙 자료
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {dispute.evidence_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: "var(--color-accent)",
                      textDecoration: "underline",
                      wordBreak: "break-all",
                    }}
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Booking 요약 */}
      <SectionCard title="Booking 정보">
        {dispute.booking ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Row label="Booking ID" value={`#${shortId(dispute.booking.id)}`} mono />
            <Row label="세션 유형" value={TYPE_LABELS[dispute.booking.type] ?? dispute.booking.type} />
            <Row label="크레딧" value={`${dispute.booking.credits_amount} 토큰`} />
            <Row
              label="예약일"
              value={dispute.booking.scheduled_at ? formatDate(dispute.booking.scheduled_at) : "-"}
            />
            {dispute.booking.brief && (
              <Row label="Brief" value={dispute.booking.brief} />
            )}
          </div>
        ) : (
          <div style={{ color: "var(--color-dim)", fontSize: 14 }}>Booking 정보 없음</div>
        )}
      </SectionCard>

      {/* 양측 사용자 */}
      <SectionCard title="양측 당사자">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-dim)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              스타트업
            </div>
            <UserInfoCard user={dispute.booking?.startup ?? null} role="Startup" />
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-dim)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              Enabler
            </div>
            <UserInfoCard user={dispute.booking?.enabler ?? null} role="Enabler" />
          </div>
        </div>
        <div
          style={{
            marginTop: 16,
            padding: "8px 12px",
            borderRadius: 8,
            backgroundColor: "color-mix(in oklch, var(--color-accent) 8%, transparent)",
            fontSize: 13,
            color: "var(--color-accent)",
          }}
        >
          신청자:{" "}
          <strong>
            {dispute.filer?.full_name ?? "-"} ({dispute.filer_role === "startup" ? "스타트업" : "Enabler"})
          </strong>
        </div>
      </SectionCard>

      {/* 이미 처리된 경우 결과 표시 */}
      {isResolved && (
        <SectionCard title="처리 결과">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Row label="결정" value={STATUS_LABELS[dispute.status] ?? dispute.status} />
            {dispute.refund_amount != null && (
              <Row label="환불 토큰" value={`${dispute.refund_amount} 토큰`} />
            )}
            {dispute.resolution_notes && (
              <Row label="사유" value={dispute.resolution_notes} />
            )}
            {dispute.resolved_at && (
              <Row label="처리일" value={formatDate(dispute.resolved_at)} />
            )}
            {dispute.resolver && (
              <Row label="처리자" value={dispute.resolver.full_name ?? "-"} />
            )}
          </div>
        </SectionCard>
      )}

      {/* 액션 영역 (미처리 상태에서만) */}
      {!isResolved && (
        <SectionCard title="관리자 처리">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 검토 시작 */}
            {dispute.status === "open" && (
              <div>
                <button
                  onClick={handleMarkInReview}
                  disabled={submitting}
                  style={{
                    padding: "9px 22px",
                    borderRadius: 8,
                    border: "1px solid var(--color-blue)",
                    backgroundColor: "color-mix(in oklch, var(--color-blue) 12%, transparent)",
                    color: "var(--color-blue)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "처리 중..." : "검토 시작"}
                </button>
                <p style={{ marginTop: 8, fontSize: 13, color: "var(--color-dim)" }}>
                  상태를 &quot;검토 중&quot;으로 변경합니다. 양측에 통보되지 않습니다.
                </p>
              </div>
            )}

            {/* 환불 결정 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--color-text)",
                    marginBottom: 8,
                  }}
                >
                  환불 금액 (0 = 기각, {maxRefund} = 전액 환불)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="number"
                    min={0}
                    max={maxRefund}
                    value={refundAmount}
                    onChange={(e) =>
                      setRefundAmount(
                        Math.max(0, Math.min(maxRefund, parseInt(e.target.value) || 0))
                      )
                    }
                    style={{
                      width: 120,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-dark)",
                      color: "var(--color-text)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 15,
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: 13, color: "var(--color-dim)" }}>
                    / {maxRefund} 토큰
                  </span>
                  <button
                    onClick={() => setRefundAmount(maxRefund)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--color-border)",
                      backgroundColor: "transparent",
                      color: "var(--color-dim)",
                      fontSize: 12,
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    전액
                  </button>
                  <button
                    onClick={() => setRefundAmount(0)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--color-border)",
                      backgroundColor: "transparent",
                      color: "var(--color-dim)",
                      fontSize: 12,
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    기각
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--color-text)",
                    marginBottom: 8,
                  }}
                >
                  결정 사유 <span style={{ color: "var(--color-red)" }}>*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
                  placeholder="환불/기각 결정 사유를 입력하세요. 양측 사용자에게 전달됩니다."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-dark)",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleResolve}
                  disabled={submitting || !notes.trim()}
                  style={{
                    padding: "9px 24px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor:
                      !notes.trim()
                        ? "var(--color-dark)"
                        : refundAmount === 0
                        ? "var(--color-red)"
                        : "var(--color-accent)",
                    color: !notes.trim() ? "var(--color-dim)" : "var(--color-black)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: submitting || !notes.trim() ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting
                    ? "처리 중..."
                    : refundAmount === 0
                    ? "기각 확정"
                    : refundAmount === maxRefund
                    ? "전액 환불 확정"
                    : `부분 환불 확정 (${refundAmount}T)`}
                </button>
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ── Row 헬퍼 ─────────────────────────────────────────────────────────────────

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          fontSize: 12,
          color: "var(--color-dim)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          minWidth: 90,
          paddingTop: 1,
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--color-text)",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
