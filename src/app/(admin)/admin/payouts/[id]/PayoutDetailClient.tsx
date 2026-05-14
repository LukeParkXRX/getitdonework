"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type EnablerInfo = { id: string; full_name: string | null; email: string | null } | null;
type BookingInfo = { id: string; type: string; scheduled_at: string | null; credits_amount: number | null } | null;

export type InvoiceDetail = {
  id: string;
  enabler_id: string;
  period_start: string;
  period_end: string;
  total_credits: number;
  total_net: number;
  status: "pending" | "approved" | "cancelled";
  approved_by: string | null;
  approved_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  enabler: EnablerInfo;
};

export type Earning = {
  id: string;
  booking_id: string;
  credits_earned: number;
  fee_pct: number;
  net_amount: number;
  credit_rate: number;
  status: string;
  accrued_at: string;
  booking: BookingInfo;
};

type Props = {
  invoice: InvoiceDetail;
  earnings: Earning[];
  payoutAccountStatus?: string | null;
};

function formatKrw(n: number) {
  return Number(n).toLocaleString("ko-KR") + "원";
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

function formatDatetime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusColor(s: string) {
  if (s === "pending") return "var(--color-warning, #f59e0b)";
  if (s === "approved") return "var(--color-success, #22c55e)";
  return "var(--color-muted, #6b7280)";
}

function statusLabel(s: string) {
  if (s === "pending") return "승인 대기";
  if (s === "approved") return "승인 완료";
  return "취소됨";
}

function earningStatusLabel(s: string) {
  if (s === "accrued") return "적립됨";
  if (s === "invoiced") return "인보이스됨";
  if (s === "reversed") return "역전됨";
  return s;
}

function sessionTypeLabel(t: string) {
  if (t === "chemistry") return "케미스트리";
  if (t === "standard") return "스탠다드";
  if (t === "project") return "프로젝트";
  return t;
}

export default function PayoutDetailClient({ invoice, earnings, payoutAccountStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payouts/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? "오류가 발생했습니다."); return; }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payouts/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", cancel_reason: cancelReason || undefined }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? "오류가 발생했습니다."); return; }
      setShowCancel(false);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    padding: "20px 24px",
    marginBottom: 20,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--color-muted)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--color-text)",
  };

  return (
    <div style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      {/* 뒤로가기 + 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/admin/payouts"
          style={{ fontSize: 13, color: "var(--color-muted)", textDecoration: "none" }}
        >
          &larr; 정산 목록
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", margin: 0 }}>
            인보이스 상세
          </h1>
          <span style={{
            background: `${statusColor(invoice.status)}22`,
            color: statusColor(invoice.status),
            borderRadius: 6,
            padding: "3px 12px",
            fontSize: 13,
            fontWeight: 700,
          }}>
            {statusLabel(invoice.status)}
          </span>

          {/* PDF 다운로드 */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <a
              href={`/api/admin/payouts/${invoice.id}/pdf`}
              download
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-black)",
                textDecoration: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              PDF 다운로드
            </a>
            <Link
              href={`/admin/payouts/${invoice.id}/invoice`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid var(--color-border)",
                color: "var(--color-dim, var(--color-muted))",
                textDecoration: "none",
              }}
            >
              인쇄 뷰
            </Link>
          </div>
        </div>
      </div>

      {/* Enabler Connect 계정 미완료 경고 */}
      {invoice.status === "pending" && payoutAccountStatus !== "active" && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 20,
          fontSize: 14,
          color: "#ef4444",
        }}>
          이 Enabler는 Stripe Connect 정산 계정이 미완료 상태입니다
          {payoutAccountStatus ? ` (${payoutAccountStatus})` : " (계정 없음)"}.
          승인 시 실 송금 없이 dry-run으로 처리됩니다.
        </div>
      )}

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.12)",
          border: "1px solid #ef4444",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 20,
          fontSize: 14,
          color: "#ef4444",
        }}>
          {error}
        </div>
      )}

      {/* 요약 카드 */}
      <div style={cardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
          <div>
            <div style={labelStyle}>Enabler</div>
            <div style={valueStyle}>{invoice.enabler?.full_name ?? "-"}</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
              {invoice.enabler?.email ?? "-"}
            </div>
          </div>
          <div>
            <div style={labelStyle}>정산 기간</div>
            <div style={valueStyle}>{formatDate(invoice.period_start)} ~ {formatDate(invoice.period_end)}</div>
          </div>
          <div>
            <div style={labelStyle}>총 크레딧</div>
            <div style={valueStyle}>{Number(invoice.total_credits).toLocaleString("ko-KR")} C</div>
          </div>
          <div>
            <div style={labelStyle}>총 지급액</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-accent)" }}>
              {formatKrw(invoice.total_net)}
            </div>
          </div>
          <div>
            <div style={labelStyle}>생성일</div>
            <div style={valueStyle}>{formatDatetime(invoice.created_at)}</div>
          </div>
          {invoice.approved_at && (
            <div>
              <div style={labelStyle}>승인일</div>
              <div style={valueStyle}>{formatDatetime(invoice.approved_at)}</div>
            </div>
          )}
          {invoice.cancel_reason && (
            <div>
              <div style={labelStyle}>취소 사유</div>
              <div style={valueStyle}>{invoice.cancel_reason}</div>
            </div>
          )}
        </div>
      </div>

      {/* 승인/취소 버튼 */}
      {invoice.status === "pending" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              background: loading ? "var(--color-muted)" : "var(--color-accent)",
              color: "var(--color-black)",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "var(--font-display)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "처리 중..." : "승인"}
          </button>
          <button
            onClick={() => setShowCancel((v) => !v)}
            disabled={loading}
            style={{
              background: "var(--color-card)",
              color: "var(--color-error, #ef4444)",
              border: "1px solid var(--color-error, #ef4444)",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            취소
          </button>
        </div>
      )}

      {/* 취소 폼 */}
      {showCancel && invoice.status === "pending" && (
        <div style={{ ...cardStyle, marginBottom: 24, borderColor: "var(--color-error, #ef4444)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>취소 사유 (선택)</div>
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="취소 사유를 입력하세요"
            style={{
              width: "100%",
              background: "var(--color-black)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 14,
              color: "var(--color-text)",
              boxSizing: "border-box",
              marginBottom: 12,
            }}
          />
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              background: "var(--color-error, #ef4444)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 20px",
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            취소 확정
          </button>
        </div>
      )}

      {/* 세션별 수익 테이블 */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>세션별 수익 내역</h2>
      {earnings.length === 0 ? (
        <div style={{
          ...cardStyle,
          textAlign: "center",
          color: "var(--color-muted)",
          padding: "40px 32px",
        }}>
          세션 수익 내역이 없습니다.
        </div>
      ) : (
        <div style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["세션 유형", "일정", "크레딧", "단가", "수수료", "지급액", "상태", "적립일"].map((h) => (
                  <th key={h} style={{
                    padding: "11px 14px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--color-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {earnings.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>
                    {sessionTypeLabel(e.booking?.type ?? "-")}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--color-muted)" }}>
                    {formatDatetime(e.booking?.scheduled_at ?? null)}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13 }}>
                    {Number(e.credits_earned).toLocaleString("ko-KR")} C
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13 }}>
                    {Number(e.credit_rate).toLocaleString("ko-KR")}원/C
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13 }}>
                    {Number(e.fee_pct)}%
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700 }}>
                    {formatKrw(e.net_amount)}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 11, color: "var(--color-muted)" }}>
                      {earningStatusLabel(e.status)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--color-muted)" }}>
                    {formatDatetime(e.accrued_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
