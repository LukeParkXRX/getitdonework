"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type EnablerInfo = { id: string; full_name: string | null; email: string | null } | null;

export type Invoice = {
  id: string;
  enabler_id: string;
  period_start: string;
  period_end: string;
  total_credits: number;
  total_net: number;
  status: "pending" | "approved" | "cancelled";
  approved_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  enabler: EnablerInfo;
};

type Stats = { total: number; pending: number; approved: number };
type Props = { initialInvoices: Invoice[]; stats: Stats };

function formatKrw(n: number) {
  return Number(n).toLocaleString("ko-KR") + "원";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
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

export default function PayoutsAdminClient({ initialInvoices, stats }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  const filtered = statusFilter === "all"
    ? invoices
    : invoices.filter((inv) => inv.status === statusFilter);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenMsg(null);
    try {
      const res = await fetch("/api/admin/payouts/generate", { method: "POST" });
      const json = await res.json() as { results?: unknown[]; period_start?: string; period_end?: string; error?: string };
      if (!res.ok) { setGenMsg("오류: " + (json.error ?? "알 수 없는 오류")); return; }
      const count = Array.isArray(json.results) ? json.results.length : 0;
      setGenMsg(`완료: ${json.period_start} ~ ${json.period_end} 기간 인보이스 ${count}건 생성`);
      // 목록 새로고침
      const listRes = await fetch("/api/admin/payouts");
      const listJson = await listRes.json() as { invoices?: Invoice[] };
      if (listJson.invoices) setInvoices(listJson.invoices);
    } catch {
      setGenMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  }, []);

  const statBoxStyle: React.CSSProperties = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    padding: "20px 24px",
    minWidth: 140,
  };

  return (
    <div style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", margin: 0 }}>
            정산 인보이스
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 4, marginBottom: 0 }}>
            Enabler 수익 정산 인보이스 목록
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            background: generating ? "var(--color-muted)" : "var(--color-accent)",
            color: "var(--color-black)",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "var(--font-display)",
            cursor: generating ? "not-allowed" : "pointer",
          }}
        >
          {generating ? "생성 중..." : "전월 인보이스 생성"}
        </button>
      </div>

      {genMsg && (
        <div style={{
          background: genMsg.startsWith("오류") ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
          border: `1px solid ${genMsg.startsWith("오류") ? "#ef4444" : "#22c55e"}`,
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 20,
          fontSize: 14,
          color: "var(--color-text)",
        }}>
          {genMsg}
        </div>
      )}

      {/* 통계 */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={statBoxStyle}>
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 6 }}>전체</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>{stats.total}</div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 6 }}>승인 대기</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-warning, #f59e0b)" }}>
            {stats.pending}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 6 }}>승인 완료</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-success, #22c55e)" }}>
            {stats.approved}
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "all", label: "전체" },
          { key: "pending", label: "승인 대기" },
          { key: "approved", label: "승인 완료" },
          { key: "cancelled", label: "취소됨" },
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

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <div style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "48px 32px",
          textAlign: "center",
          color: "var(--color-muted)",
        }}>
          인보이스가 없습니다.
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
                {["Enabler", "정산 기간", "크레딧", "지급액", "상태", "생성일", ""].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
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
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {inv.enabler?.full_name ?? "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
                      {inv.enabler?.email ?? "-"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--color-text)" }}>
                    {formatDate(inv.period_start)} ~ {formatDate(inv.period_end)}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>
                    {Number(inv.total_credits).toLocaleString("ko-KR")} C
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>
                    {formatKrw(inv.total_net)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      background: `${statusColor(inv.status)}22`,
                      color: statusColor(inv.status),
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--color-muted)" }}>
                    {formatDate(inv.created_at)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Link
                      href={`/admin/payouts/${inv.id}`}
                      style={{
                        fontSize: 13,
                        color: "var(--color-accent)",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      상세
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
