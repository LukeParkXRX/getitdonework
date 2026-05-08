"use client";

import { useState } from "react";

type BookingInfo = {
  id: string;
  type: string;
  scheduled_at: string | null;
  credits_amount: number | null;
} | null;

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

type Summary = {
  totalCredits: number;
  totalNet: number;
  pendingNet: number;
};

type Props = { earnings: Earning[]; summary: Summary };

function formatKrw(n: number) {
  return Number(n).toLocaleString("ko-KR") + "원";
}

function formatDatetime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function sessionTypeLabel(t: string) {
  if (t === "chemistry") return "케미스트리";
  if (t === "standard") return "스탠다드";
  if (t === "project") return "프로젝트";
  return t;
}

function statusLabel(s: string) {
  if (s === "accrued") return "정산 대기";
  if (s === "invoiced") return "인보이스됨";
  if (s === "reversed") return "환불 취소";
  return s;
}

function statusColor(s: string) {
  if (s === "accrued") return "var(--color-warning, #f59e0b)";
  if (s === "invoiced") return "var(--color-success, #22c55e)";
  return "var(--color-muted, #6b7280)";
}

export default function EarningsClient({ earnings, summary }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all"
    ? earnings
    : earnings.filter((e) => e.status === statusFilter);

  const statBoxStyle: React.CSSProperties = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    padding: "20px 24px",
    flex: 1,
    minWidth: 160,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-black)",
      color: "var(--color-text)",
      fontFamily: "var(--font-body)",
      padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            margin: 0,
          }}>
            수익 내역
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 4 }}>
            세션별 정산 수익 및 지급 현황
          </p>
        </div>

        {/* 누적 통계 */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              총 누적 크레딧
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)" }}>
              {Number(summary.totalCredits).toLocaleString("ko-KR")} C
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              총 누적 지급액
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-accent)" }}>
              {formatKrw(summary.totalNet)}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              정산 대기 중
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-warning, #f59e0b)" }}>
              {formatKrw(summary.pendingNet)}
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { key: "all", label: "전체" },
            { key: "accrued", label: "정산 대기" },
            { key: "invoiced", label: "인보이스됨" },
            { key: "reversed", label: "환불 취소" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                background: statusFilter === key ? "var(--color-accent)" : "var(--color-card)",
                color: statusFilter === key ? "var(--color-black)" : "var(--color-text)",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: statusFilter === key ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 빈 상태 */}
        {filtered.length === 0 ? (
          <div style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "56px 32px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💰</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {statusFilter === "all" ? "아직 수익 내역이 없습니다" : "해당 상태의 내역이 없습니다"}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
              {statusFilter === "all"
                ? "세션이 확정되면 수익이 자동으로 적립됩니다."
                : "다른 필터를 선택해 보세요."}
            </div>
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
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      opacity: e.status === "reversed" ? 0.5 : 1,
                    }}
                  >
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
                    <td style={{
                      padding: "12px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: e.status === "reversed" ? "line-through" : "none",
                    }}>
                      {formatKrw(e.net_amount)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        background: `${statusColor(e.status)}22`,
                        color: statusColor(e.status),
                        borderRadius: 6,
                        padding: "3px 9px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        {statusLabel(e.status)}
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
    </div>
  );
}
