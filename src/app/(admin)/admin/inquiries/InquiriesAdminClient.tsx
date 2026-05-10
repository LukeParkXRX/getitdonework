"use client";

import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ui";
import { downloadCSV } from "@/lib/utils/csv-export";
import type { InquiryRow } from "./page";

const TABS = [
  { key: "new", label: "신규" },
  { key: "replied", label: "답변완료" },
  { key: "archived", label: "보관" },
  { key: "all", label: "전체" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:      { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  replied:  { bg: "rgba(34,197,94,0.15)",  color: "#4ade80" },
  archived: { bg: "rgba(107,114,128,0.15)", color: "#9ca3af" },
};

const STATUS_LABELS: Record<string, string> = {
  new: "신규", replied: "답변완료", archived: "보관",
};

const CARD: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  overflow: "hidden",
};

const TABLE_HEADER: React.CSSProperties = {
  fontSize: 12,
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-dim)",
  background: "var(--color-dark)",
  borderBottom: "1px solid var(--color-border)",
  padding: "10px 14px",
  textAlign: "left",
};

const TABLE_CELL: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 14,
  color: "var(--color-text)",
  borderBottom: "1px solid var(--color-border)",
  verticalAlign: "top",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: "rgba(255,255,255,0.08)", color: "var(--color-dim)" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 6,
      fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)",
      background: s.bg, color: s.color, letterSpacing: "0.03em",
      whiteSpace: "nowrap",
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

type DetailModal = { open: false } | { open: true; inquiry: InquiryRow };

export default function InquiriesAdminClient({
  inquiries,
}: {
  inquiries: InquiryRow[];
}) {
  const [tab, setTab] = useState<Tab>("new");
  const [list, setList] = useState<InquiryRow[]>(inquiries);
  const [detail, setDetail] = useState<DetailModal>({ open: false });
  const [isPending, startTransition] = useTransition();

  const filtered = list.filter((q) => tab === "all" || q.status === tab);

  async function doAction(id: string, action: "mark_replied" | "archive" | "reopen") {
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "오류가 발생했습니다");
      return null;
    }
    const data = await res.json();
    return data.status as string;
  }

  function updateStatus(id: string, newStatus: string) {
    setList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
    );
    if (detail.open && detail.inquiry.id === id) {
      setDetail({ open: true, inquiry: { ...detail.inquiry, status: newStatus } });
    }
  }

  function handleAction(id: string, action: "mark_replied" | "archive" | "reopen") {
    startTransition(async () => {
      const newStatus = await doAction(id, action);
      if (newStatus) updateStatus(id, newStatus);
    });
  }

  const newCount = list.filter((q) => q.status === "new").length;

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)",
            color: "var(--color-text)", letterSpacing: "-0.02em", margin: 0,
          }}>
            문의함
          </h1>
          <p style={{ fontSize: 15, color: "var(--color-dim)", margin: "6px 0 0" }}>
            사이트로 들어온 일반 문의를 확인하고 처리하세요
          </p>
        </div>
        <button
          onClick={() => {
            const headers = ["이름", "회사", "이메일", "유형", "내용(100자)", "상태", "접수일"];
            const csvRows = list.map((q) => [
              q.name,
              q.company ?? "",
              q.email,
              q.inquiry_type ?? "",
              q.message.slice(0, 100),
              STATUS_LABELS[q.status] ?? q.status,
              q.created_at,
            ]);
            downloadCSV("contact_inquiries", headers, csvRows);
          }}
          style={{
            padding: "9px 18px",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-text)",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--font-display)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          CSV 내보내기
        </button>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--color-border)" }}>
        {TABS.map((t) => {
          const count = t.key === "all" ? list.length : list.filter((q) => q.status === t.key).length;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "9px 16px", border: "none", borderRadius: "8px 8px 0 0",
                background: isActive ? "var(--color-card)" : "transparent",
                color: isActive ? "var(--color-text)" : "var(--color-dim)",
                fontWeight: isActive ? 700 : 400,
                fontSize: 14, fontFamily: "var(--font-display)", cursor: "pointer",
                borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {t.label}
              {count > 0 && (
                <span style={{
                  background: t.key === "new" && count > 0 ? "#ef4444" : "var(--color-border)",
                  color: t.key === "new" && count > 0 ? "#fff" : "var(--color-dim)",
                  fontSize: 11, fontWeight: 700, borderRadius: 10,
                  padding: "1px 6px", minWidth: 18, textAlign: "center",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 테이블 */}
      <div style={CARD}>
        {filtered.length === 0 ? (
          <EmptyState
            title={tab === "new" ? "새 문의가 없습니다" : "해당 항목이 없습니다"}
            description="조건에 맞는 문의가 없습니다."
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TABLE_HEADER}>일시</th>
                <th style={TABLE_HEADER}>이름 / 회사</th>
                <th style={TABLE_HEADER}>이메일</th>
                <th style={TABLE_HEADER}>유형</th>
                <th style={TABLE_HEADER}>내용 미리보기</th>
                <th style={TABLE_HEADER}>상태</th>
                <th style={{ ...TABLE_HEADER, textAlign: "right" }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => {
                const date = new Date(q.created_at);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
                return (
                  <tr key={q.id}>
                    <td style={{ ...TABLE_CELL, color: "var(--color-dim)", fontSize: 13, whiteSpace: "nowrap" }}>
                      {dateStr}
                    </td>
                    <td style={TABLE_CELL}>
                      <div style={{ fontWeight: 600 }}>{q.name}</div>
                      {q.company && (
                        <div style={{ fontSize: 12, color: "var(--color-dim)", marginTop: 2 }}>{q.company}</div>
                      )}
                    </td>
                    <td style={{ ...TABLE_CELL, fontSize: 13, color: "var(--color-dim)" }}>{q.email}</td>
                    <td style={{ ...TABLE_CELL, fontSize: 13, color: "var(--color-dim)" }}>
                      {q.inquiry_type ?? "-"}
                    </td>
                    <td style={{ ...TABLE_CELL, maxWidth: 220 }}>
                      <div style={{
                        fontSize: 13, color: "var(--color-dim)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {q.message}
                      </div>
                    </td>
                    <td style={TABLE_CELL}>
                      <StatusBadge status={q.status} />
                    </td>
                    <td style={{ ...TABLE_CELL, textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setDetail({ open: true, inquiry: q })}
                          style={{
                            padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                            border: "1px solid var(--color-border)", background: "transparent",
                            color: "var(--color-dim)", cursor: "pointer",
                          }}
                        >
                          상세
                        </button>
                        {q.status === "new" && (
                          <button
                            onClick={() => handleAction(q.id, "mark_replied")}
                            disabled={isPending}
                            style={{
                              padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                              border: "none", background: "rgba(34,197,94,0.15)",
                              color: "#4ade80", cursor: "pointer",
                            }}
                          >
                            답변완료
                          </button>
                        )}
                        {q.status !== "archived" && (
                          <button
                            onClick={() => handleAction(q.id, "archive")}
                            disabled={isPending}
                            style={{
                              padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                              border: "none", background: "var(--color-dark)",
                              color: "var(--color-dim)", cursor: "pointer",
                            }}
                          >
                            보관
                          </button>
                        )}
                        {q.status === "archived" && (
                          <button
                            onClick={() => handleAction(q.id, "reopen")}
                            disabled={isPending}
                            style={{
                              padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                              border: "none", background: "var(--color-dark)",
                              color: "var(--color-dim)", cursor: "pointer",
                            }}
                          >
                            재오픈
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 상세 모달 */}
      {detail.open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetail({ open: false }); }}
        >
          <div style={{
            background: "var(--color-card)", borderRadius: 16,
            border: "1px solid var(--color-border)",
            padding: "28px 28px 24px", width: 520, maxWidth: "100%",
            maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
                  {detail.inquiry.name}
                  {detail.inquiry.company && <span style={{ fontWeight: 400, color: "var(--color-dim)", fontSize: 15 }}> · {detail.inquiry.company}</span>}
                </h2>
                <div style={{ fontSize: 13, color: "var(--color-dim)" }}>
                  {detail.inquiry.email} · {new Date(detail.inquiry.created_at).toLocaleString("ko-KR")}
                </div>
              </div>
              <StatusBadge status={detail.inquiry.status} />
            </div>

            {detail.inquiry.inquiry_type && (
              <div style={{ marginBottom: 12, fontSize: 13 }}>
                <span style={{ color: "var(--color-dim)", marginRight: 8 }}>유형</span>
                <strong>{detail.inquiry.inquiry_type}</strong>
              </div>
            )}

            <div style={{
              background: "var(--color-dark)", borderRadius: 10, padding: "16px 18px",
              fontSize: 14, lineHeight: 1.8, color: "var(--color-text)",
              whiteSpace: "pre-wrap", marginBottom: 20,
            }}>
              {detail.inquiry.message}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={`mailto:${detail.inquiry.email}?subject=Re: ${encodeURIComponent(detail.inquiry.inquiry_type ?? "문의")}`}
                style={{
                  padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  background: "var(--color-accent)", color: "var(--color-black)",
                  textDecoration: "none", fontFamily: "var(--font-display)",
                }}
              >
                이메일로 답변
              </a>
              {detail.inquiry.status === "new" && (
                <button
                  onClick={() => handleAction(detail.inquiry.id, "mark_replied")}
                  disabled={isPending}
                  style={{
                    padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                    border: "none", background: "rgba(34,197,94,0.15)",
                    color: "#4ade80", cursor: "pointer",
                  }}
                >
                  답변 완료로 표시
                </button>
              )}
              {detail.inquiry.status !== "archived" && (
                <button
                  onClick={() => handleAction(detail.inquiry.id, "archive")}
                  disabled={isPending}
                  style={{
                    padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: "1px solid var(--color-border)", background: "transparent",
                    color: "var(--color-dim)", cursor: "pointer",
                  }}
                >
                  보관
                </button>
              )}
              <button
                onClick={() => setDetail({ open: false })}
                style={{
                  padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  border: "1px solid var(--color-border)", background: "transparent",
                  color: "var(--color-dim)", cursor: "pointer",
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
