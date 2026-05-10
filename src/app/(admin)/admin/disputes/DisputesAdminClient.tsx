"use client";

import { useState } from "react";
import Link from "next/link";

// ── 타입 ──────────────────────────────────────────────────────────────────────

export type DisputeRow = {
  id: string;
  status: string;
  filer_role: "startup" | "enabler";
  reason: string;
  created_at: string;
  resolved_at: string | null;
  refund_amount: number | null;
  booking: {
    id: string;
    credits_amount: number;
    scheduled_at: string | null;
    type: string;
  } | null;
  filer: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

export type DisputeStats = {
  open: number;
  in_review: number;
  resolved_this_month: number;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "open", label: "접수" },
  { value: "in_review", label: "검토 중" },
  { value: "resolved", label: "처리됨" },
  { value: "all", label: "전체" },
] as const;

type TabValue = (typeof STATUS_TABS)[number]["value"];

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

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

type Props = {
  initialDisputes: DisputeRow[];
  stats: DisputeStats;
};

export default function DisputesAdminClient({ initialDisputes, stats }: Props) {
  const [disputes] = useState<DisputeRow[]>(initialDisputes);
  const [activeTab, setActiveTab] = useState<TabValue>("open");

  const filtered = disputes.filter((d) => {
    if (activeTab === "all") return true;
    if (activeTab === "resolved")
      return ["resolved_refund", "resolved_partial", "resolved_dismissed"].includes(d.status);
    return d.status === activeTab;
  });

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 24,
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          분쟁 처리
        </h1>
        <p style={{ marginTop: 6, color: "var(--color-dim)", fontSize: 14 }}>
          Booking 분쟁 신청 검토 및 환불 결정
        </p>
      </div>

      {/* 통계 띠 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          { label: "접수 대기", value: stats.open, color: "var(--color-amber)" },
          { label: "검토 중", value: stats.in_review, color: "var(--color-blue)" },
          { label: "이번 달 처리", value: stats.resolved_this_month, color: "var(--color-green)" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "18px 22px",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: s.color,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: 0,
        }}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: "8px 18px",
                border: "none",
                borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                backgroundColor: "transparent",
                color: isActive ? "var(--color-accent)" : "var(--color-dim)",
                fontFamily: "var(--font-display)",
                fontWeight: isActive ? 700 : 400,
                fontSize: 14,
                cursor: "pointer",
                transition: "color 0.15s",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "var(--color-dim)",
            fontSize: 15,
          }}
        >
          해당 분쟁이 없습니다.
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-dark)",
                }}
              >
                {["신청일", "Booking", "신청자", "사유", "상태", "액션"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      color: "var(--color-dim)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={d.id}
                  style={{
                    borderBottom:
                      i < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--color-dim)" }}>
                    {formatDate(d.created_at)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--color-accent)",
                      }}
                    >
                      #{shortId(d.booking?.id ?? d.id)}
                    </span>
                    <div style={{ fontSize: 12, color: "var(--color-dim)", marginTop: 2 }}>
                      {d.booking?.credits_amount ?? 0} 토큰
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 14, color: "var(--color-text)" }}>
                      {d.filer?.full_name ?? "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-dim)", marginTop: 2 }}>
                      {d.filer_role === "startup" ? "스타트업" : "Enabler"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--color-text)" }}>
                    {REASON_LABELS[d.reason] ?? d.reason}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        color: STATUS_COLORS[d.status] ?? "var(--color-dim)",
                        border: `1px solid ${STATUS_COLORS[d.status] ?? "var(--color-border)"}`,
                        backgroundColor: `color-mix(in oklch, ${STATUS_COLORS[d.status] ?? "var(--color-dim)"} 12%, transparent)`,
                      }}
                    >
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Link
                      href={`/admin/disputes/${d.id}`}
                      style={{
                        display: "inline-block",
                        padding: "5px 14px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text)",
                        textDecoration: "none",
                        transition: "border-color 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.borderColor =
                          "var(--color-accent)";
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-accent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.borderColor =
                          "var(--color-border)";
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text)";
                      }}
                    >
                      상세 보기
                    </Link>
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
