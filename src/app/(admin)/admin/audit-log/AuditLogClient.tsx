"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui";
import { downloadCSV } from "@/lib/utils/csv-export";
import type { AuditLogRow } from "./page";

const CARD: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  overflow: "hidden",
};

const ALL = "all";

function shortId(id: string | null) {
  if (!id) return "-";
  return id.length > 8 ? id.slice(0, 8) + "…" : id;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function MetadataPreview({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata) return <span style={{ color: "var(--color-dim)" }}>-</span>;
  const str = JSON.stringify(metadata);
  const preview = str.length > 80 ? str.slice(0, 80) + "…" : str;
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 11,
        color: "var(--color-dim)",
        wordBreak: "break-all",
      }}
      title={str}
    >
      {preview}
    </span>
  );
}

export default function AuditLogClient({ logs }: { logs: AuditLogRow[] }) {
  const [actionFilter, setActionFilter] = useState(ALL);
  const [targetTypeFilter, setTargetTypeFilter] = useState(ALL);

  const actions = Array.from(new Set(logs.map((l) => l.action))).sort();
  const targetTypes = Array.from(new Set(logs.map((l) => l.target_type))).sort();

  const filtered = logs.filter((l) => {
    if (actionFilter !== ALL && l.action !== actionFilter) return false;
    if (targetTypeFilter !== ALL && l.target_type !== targetTypeFilter) return false;
    return true;
  });

  function handleExport() {
    const headers = ["일시", "운영자", "이메일", "action", "target_type", "target_id", "metadata"];
    const rows = filtered.map((l) => [
      formatDate(l.created_at),
      l.actor?.full_name ?? "-",
      l.actor?.email ?? "-",
      l.action,
      l.target_type,
      l.target_id ?? "-",
      l.metadata ? JSON.stringify(l.metadata) : "-",
    ]);
    downloadCSV("admin_audit_log", headers, rows);
  }

  const selectStyle: React.CSSProperties = {
    background: "var(--color-dark)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    color: "var(--color-text)",
    fontSize: 13,
    padding: "6px 10px",
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
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
            관리자 활동 로그
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-dim)", margin: "4px 0 0" }}>
            최근 200건 표시
          </p>
        </div>

        <button
          onClick={handleExport}
          style={{
            padding: "8px 16px",
            background: "var(--color-accent)",
            color: "var(--color-black)",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            cursor: "pointer",
          }}
        >
          CSV 내보내기
        </button>
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={selectStyle}
        >
          <option value={ALL}>action 전체</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          style={selectStyle}
        >
          <option value={ALL}>target_type 전체</option>
          {targetTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <span
          style={{
            fontSize: 13,
            color: "var(--color-dim)",
            alignSelf: "center",
          }}
        >
          {filtered.length}건
        </span>
      </div>

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <EmptyState
          title="활동 로그가 없습니다"
          description="조건에 맞는 운영자 활동 기록이 없습니다."
        />
      ) : (
        <div style={CARD}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                color: "var(--color-text)",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--color-dark)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {[
                    "일시",
                    "운영자",
                    "action",
                    "target_type",
                    "target_id",
                    "metadata",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontWeight: 600,
                        fontFamily: "var(--font-display)",
                        color: "var(--color-dim)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        whiteSpace: "nowrap",
                        color: "var(--color-dim)",
                        fontSize: 12,
                      }}
                    >
                      {formatDate(log.created_at)}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600 }}>
                        {log.actor?.full_name ?? "-"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-dim)" }}>
                        {log.actor?.email ?? "-"}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          background: "rgba(96,165,250,0.12)",
                          color: "#60a5fa",
                          borderRadius: 4,
                          fontSize: 11,
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        whiteSpace: "nowrap",
                        color: "var(--color-dim)",
                        fontSize: 12,
                      }}
                    >
                      {log.target_type}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "var(--color-dim)",
                        whiteSpace: "nowrap",
                      }}
                      title={log.target_id ?? ""}
                    >
                      {shortId(log.target_id)}
                    </td>
                    <td style={{ padding: "10px 14px", maxWidth: 260 }}>
                      <MetadataPreview metadata={log.metadata} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
