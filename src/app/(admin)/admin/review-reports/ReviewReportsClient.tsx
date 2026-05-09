"use client";

import { useState, useCallback } from "react";
import type { ReportRow, Stats } from "./page";

const REASON_LABELS: Record<string, string> = {
  spam: "스팸",
  hate: "욕설·혐오",
  false_info: "허위 정보",
  privacy: "사적 정보 포함",
  etc: "기타",
};

const STATUS_TABS = [
  { value: "pending", label: "대기" },
  { value: "resolved", label: "처리됨" },
  { value: "dismissed", label: "기각" },
  { value: "all", label: "전체" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["value"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max = 80) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function StarBadge({ rating }: { rating: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "12px",
        color: "var(--color-gold, #f59e0b)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
      }}
    >
      ★ {rating}
    </span>
  );
}

type Props = {
  initialReports: ReportRow[];
  stats: Stats;
};

export default function ReviewReportsClient({ initialReports, stats }: Props) {
  const [reports, setReports] = useState<ReportRow[]>(initialReports);
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = reports.filter((r) => activeTab === "all" || r.status === activeTab);

  const handleAction = useCallback(
    async (reportId: string, action: "hide_review" | "dismiss") => {
      setLoadingId(reportId);
      try {
        const res = await fetch(`/api/admin/review-reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const json = await res.json();
        if (!res.ok) {
          alert(json.error ?? "처리 실패");
          return;
        }
        // 로컬 상태 반영
        const resolvedAt = new Date().toISOString();
        setReports((prev) =>
          prev.map((r) => {
            if (action === "hide_review" && r.review?.id === prev.find((x) => x.id === reportId)?.review?.id) {
              // 같은 리뷰의 모든 pending 신고 resolved 처리
              if (r.status === "pending") {
                return { ...r, status: "resolved", resolved_at: resolvedAt };
              }
            }
            if (r.id === reportId && action === "dismiss") {
              return { ...r, status: "dismissed", resolved_at: resolvedAt };
            }
            return r;
          })
        );
      } finally {
        setLoadingId(null);
      }
    },
    []
  );

  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1100px",
        margin: "0 auto",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* 헤더 */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "24px",
            color: "var(--color-text)",
            marginBottom: "8px",
          }}
        >
          신고 검토
        </h1>
        {/* 통계 띠 */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "12px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span style={{ fontSize: "22px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-accent)" }}>
              {stats.pending}
            </span>
            <span style={{ fontSize: "12px", color: "var(--color-dim)" }}>검토 대기</span>
          </div>
          <div
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "12px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span style={{ fontSize: "22px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)" }}>
              {stats.resolvedThisWeek}
            </span>
            <span style={{ fontSize: "12px", color: "var(--color-dim)" }}>최근 7일 처리</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "20px",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "0",
        }}
      >
        {STATUS_TABS.map((tab) => {
          const count = tab.value === "all" ? reports.length : reports.filter((r) => r.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: "8px 16px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.value ? "2px solid var(--color-accent)" : "2px solid transparent",
                color: activeTab === tab.value ? "var(--color-text)" : "var(--color-dim)",
                fontFamily: "var(--font-display)",
                fontWeight: activeTab === tab.value ? 700 : 400,
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "-1px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  style={{
                    background: tab.value === "pending" ? "var(--color-accent)" : "var(--color-border)",
                    color: tab.value === "pending" ? "var(--color-black)" : "var(--color-dim)",
                    borderRadius: "10px",
                    padding: "1px 7px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 리스트 */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "var(--color-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "15px",
          }}
        >
          검토 대기 신고가 없습니다
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((report) => (
            <div
              key={report.id}
              style={{
                background: "var(--color-dark)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                {/* 리뷰 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Enabler 이름 */}
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "15px",
                        color: "var(--color-text)",
                      }}
                    >
                      {report.review?.target?.full_name ?? "알 수 없음"}
                    </span>

                    {report.review && <StarBadge rating={report.review.rating} />}

                    {/* report_count 배지 */}
                    {(report.review?.report_count ?? 0) > 1 && (
                      <span
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          color: "#ef4444",
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: "10px",
                          padding: "1px 8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        총 {report.review?.report_count}건 신고
                      </span>
                    )}

                    {/* 숨김 상태 배지 */}
                    {report.review?.hidden_at && (
                      <span
                        style={{
                          background: "rgba(100,100,100,0.2)",
                          color: "var(--color-dim)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "10px",
                          padding: "1px 8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        숨김 처리됨
                      </span>
                    )}

                    <span style={{ fontSize: "12px", color: "var(--color-dim)" }}>
                      작성자: {report.review?.author?.full_name ?? "알 수 없음"}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--color-dim)" }}>
                      {report.review?.created_at ? formatDate(report.review.created_at) : ""}
                    </span>
                  </div>

                  {/* 리뷰 본문 */}
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--color-text)",
                      lineHeight: 1.6,
                      marginBottom: "12px",
                      padding: "10px 14px",
                      background: "var(--color-card)",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {truncate(report.review?.comment ?? "", 120)}
                  </p>

                  {/* 신고 정보 */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "13px",
                      color: "var(--color-dim)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      신고 사유:{" "}
                      <strong style={{ color: "var(--color-text)" }}>
                        {REASON_LABELS[report.reason] ?? report.reason}
                      </strong>
                    </span>
                    <span>
                      신고자:{" "}
                      <strong style={{ color: "var(--color-text)" }}>
                        {report.reporter?.full_name ?? report.reporter?.email ?? "알 수 없음"}
                      </strong>
                    </span>
                    <span>{formatDate(report.created_at)}</span>
                    {report.details && (
                      <span style={{ color: "var(--color-dim)" }}>
                        &ldquo;{truncate(report.details, 60)}&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                {report.status === "pending" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => handleAction(report.id, "hide_review")}
                      disabled={loadingId === report.id || !!report.review?.hidden_at}
                      style={{
                        padding: "9px 16px",
                        background: report.review?.hidden_at ? "var(--color-border)" : "#ef4444",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: report.review?.hidden_at ? "not-allowed" : "pointer",
                        opacity: loadingId === report.id ? 0.6 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {report.review?.hidden_at ? "이미 숨김" : "숨김 처리"}
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "dismiss")}
                      disabled={loadingId === report.id}
                      style={{
                        padding: "9px 16px",
                        background: "transparent",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        color: "var(--color-dim)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        opacity: loadingId === report.id ? 0.6 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      기각
                    </button>
                  </div>
                )}

                {/* 처리 완료 상태 */}
                {report.status !== "pending" && (
                  <div
                    style={{
                      flexShrink: 0,
                      fontSize: "12px",
                      color: "var(--color-dim)",
                      textAlign: "right",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "10px",
                        background: report.status === "resolved" ? "rgba(34,197,94,0.1)" : "rgba(100,100,100,0.15)",
                        color: report.status === "resolved" ? "#22c55e" : "var(--color-dim)",
                        fontWeight: 700,
                        fontFamily: "var(--font-display)",
                        fontSize: "12px",
                      }}
                    >
                      {report.status === "resolved" ? "처리됨" : "기각됨"}
                    </span>
                    {report.resolved_at && (
                      <div style={{ marginTop: "4px", fontSize: "11px" }}>
                        {formatDate(report.resolved_at)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
