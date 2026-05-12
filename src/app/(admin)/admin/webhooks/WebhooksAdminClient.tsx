"use client";

import { useState } from "react";
import type { WebhookEvent } from "./page";

type Stats = {
  processed: number;
  failed: number;
  ignored: number;
  received: number;
};

type Props = {
  events: WebhookEvent[];
  stats: Stats;
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  processed: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "처리됨" },
  failed:    { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "실패" },
  ignored:   { bg: "rgba(107,114,128,0.15)",color: "#9ca3af", label: "무시됨" },
  received:  { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "수신됨" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day:   "2-digit",
    hour:  "2-digit",
    minute:"2-digit",
    second:"2-digit",
    hour12: false,
  });
}

export default function WebhooksAdminClient({ events, stats }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = filterStatus === "all"
    ? events
    : events.filter((e) => e.status === filterStatus);

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          Webhook 모니터링
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-dim)" }}>
          최근 100건 수신 이력 · Stripe
        </p>
      </div>

      {/* 통계 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          { key: "processed", label: "처리됨", color: "#10b981" },
          { key: "failed",    label: "실패",   color: "#ef4444" },
          { key: "ignored",   label: "무시됨", color: "#9ca3af" },
          { key: "received",  label: "수신됨", color: "#f59e0b" },
        ].map((s) => (
          <div
            key={s.key}
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "16px 20px",
              cursor: "pointer",
              outline: filterStatus === s.key ? `2px solid ${s.color}` : "none",
            }}
            onClick={() =>
              setFilterStatus((prev) => (prev === s.key ? "all" : s.key))
            }
          >
            <div style={{ fontSize: 12, color: "var(--color-dim)", marginBottom: 6 }}>
              {s.label}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: s.color,
                letterSpacing: "-0.02em",
              }}
            >
              {stats[s.key as keyof Stats]}
            </div>
          </div>
        ))}
      </div>

      {/* 필터 리셋 */}
      {filterStatus !== "all" && (
        <button
          onClick={() => setFilterStatus("all")}
          style={{
            fontSize: 12,
            color: "var(--color-accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 12,
            padding: 0,
          }}
        >
          필터 해제 (전체 보기)
        </button>
      )}

      {/* 테이블 */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "48px 32px",
            textAlign: "center",
            color: "var(--color-dim)",
            fontSize: 14,
          }}
        >
          {events.length === 0
            ? "아직 webhook이 수신되지 않았습니다 (Stripe 키 설정 후 활성)"
            : "해당 상태의 이벤트가 없습니다."}
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* 컬럼 헤더 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 70px 1fr 90px 70px",
              gap: 12,
              padding: "10px 20px",
              borderBottom: "1px solid var(--color-border)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-dim)",
              fontFamily: "var(--font-display)",
            }}
          >
            <span>일시</span>
            <span>Provider</span>
            <span>Event Type</span>
            <span>상태</span>
            <span style={{ textAlign: "right" }}>처리시간</span>
          </div>

          {/* 행 */}
          {filtered.map((evt) => {
            const style = STATUS_STYLE[evt.status] ?? STATUS_STYLE.received;
            const isOpen = expanded === evt.id;

            return (
              <div key={evt.id}>
                <div
                  onClick={() => setExpanded(isOpen ? null : evt.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 70px 1fr 90px 70px",
                    gap: 12,
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: evt.status === "failed" || evt.payload_summary ? "pointer" : "default",
                    background: isOpen ? "var(--color-dark)" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen)
                      (e.currentTarget as HTMLElement).style.background = "var(--color-dark)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen)
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--color-dim)", fontFamily: "var(--font-display)" }}>
                    {formatDate(evt.created_at)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--color-text)" }}>
                    {evt.provider}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-text)",
                      fontFamily: "var(--font-display)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {evt.event_type}
                  </span>
                  <span>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: style.bg,
                        color: style.color,
                        fontFamily: "var(--font-display)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {style.label}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-dim)",
                      textAlign: "right",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {evt.processing_ms != null ? `${evt.processing_ms}ms` : "—"}
                  </span>
                </div>

                {/* 확장 패널 */}
                {isOpen && (
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid var(--color-border)",
                      background: "var(--color-dark)",
                    }}
                  >
                    {evt.error_message && (
                      <div
                        style={{
                          marginBottom: 12,
                          padding: "10px 14px",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#ef4444",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        오류: {evt.error_message}
                      </div>
                    )}
                    {evt.event_id && (
                      <div style={{ fontSize: 12, color: "var(--color-dim)", marginBottom: 8 }}>
                        Event ID: <span style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>{evt.event_id}</span>
                      </div>
                    )}
                    {evt.payload_summary && (
                      <pre
                        style={{
                          fontSize: 12,
                          color: "var(--color-text)",
                          background: "var(--color-black)",
                          padding: "12px 16px",
                          borderRadius: 8,
                          overflowX: "auto",
                          fontFamily: "var(--font-display)",
                          margin: 0,
                        }}
                      >
                        {JSON.stringify(evt.payload_summary, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
