"use client";

import { useState, useTransition } from "react";
import type { ApplicationRow } from "./page";

const TABS = [
  { key: "pending", label: "대기중" },
  { key: "approved", label: "승인" },
  { key: "rejected", label: "거절" },
  { key: "all", label: "전체" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  approved: { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
  rejected: { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  reviewed: { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa" },
};

const CARD: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  overflow: "hidden",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: "rgba(255,255,255,0.08)", color: "var(--color-dim)" };
  const labels: Record<string, string> = {
    pending: "대기중", approved: "승인", rejected: "거절", reviewed: "검토완료",
  };
  return (
    <span style={{
      display: "inline-block", padding: "3px 9px", borderRadius: 6,
      fontSize: 13, fontWeight: 600, fontFamily: "var(--font-display)",
      background: s.bg, color: s.color, letterSpacing: "0.03em",
    }}>
      {labels[status] ?? status}
    </span>
  );
}

type RejectModalState = { open: false } | { open: true; id: string; name: string };

export default function ApplicationsAdminClient({
  applications,
}: {
  applications: ApplicationRow[];
}) {
  const [tab, setTab] = useState<Tab>("pending");
  const [list, setList] = useState<ApplicationRow[]>(applications);
  const [rejectModal, setRejectModal] = useState<RejectModalState>({ open: false });
  const [rejectNotes, setRejectNotes] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = list
    .filter((a) => tab === "all" || a.status === tab)
    .sort((a, b) => {
      // pending 우선
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  async function doAction(id: string, action: "approve" | "reject", notes?: string) {
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "오류가 발생했습니다");
      return false;
    }
    return true;
  }

  function handleApprove(app: ApplicationRow) {
    if (
      !confirm(
        `"${app.name}"님을 Enabler로 승인하고 가입 안내 이메일을 발송합니다.\n계속하시겠습니까?`
      )
    )
      return;
    startTransition(async () => {
      const ok = await doAction(app.id, "approve");
      if (ok) {
        setList((prev) =>
          prev.map((a) =>
            a.id === app.id ? { ...a, status: "approved" } : a
          )
        );
      }
    });
  }

  function handleOpenReject(app: ApplicationRow) {
    setRejectNotes("");
    setRejectModal({ open: true, id: app.id, name: app.name });
  }

  function handleRejectConfirm() {
    if (!rejectModal.open) return;
    const { id, name } = rejectModal;
    startTransition(async () => {
      const ok = await doAction(id, "reject", rejectNotes || undefined);
      if (ok) {
        setList((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "rejected", notes: rejectNotes || null } : a))
        );
        setRejectModal({ open: false });
      }
    });
  }

  const detail = detailId ? list.find((a) => a.id === detailId) : null;

  const pendingCount = list.filter((a) => a.status === "pending").length;

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)",
          color: "var(--color-text)", letterSpacing: "-0.02em", margin: 0,
        }}>
          Enabler 지원 검토
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-dim)", margin: "6px 0 0" }}>
          신규 Enabler 지원서를 검토하고 승인·거절하세요
        </p>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--color-border)", paddingBottom: 0 }}>
        {TABS.map((t) => {
          const count = t.key === "all" ? list.length : list.filter((a) => a.status === t.key).length;
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
                  background: t.key === "pending" && count > 0 ? "#ef4444" : "var(--color-border)",
                  color: t.key === "pending" && count > 0 ? "#fff" : "var(--color-dim)",
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

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div style={{
          ...CARD, padding: "48px 24px", textAlign: "center",
          color: "var(--color-dim)", fontSize: 15,
        }}>
          {tab === "pending" ? "대기 중인 지원서가 없습니다" : "해당 항목이 없습니다"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((app) => (
            <div key={app.id} style={CARD}>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  {/* 좌측 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 17, fontWeight: 700, fontFamily: "var(--font-display)",
                        color: "var(--color-text)",
                      }}>
                        {app.name}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>
                    <div style={{ fontSize: 14, color: "var(--color-dim)", marginBottom: 4 }}>
                      {app.email}
                      {app.university && <span> · {app.university}{app.degree_type ? ` (${app.degree_type})` : ""}</span>}
                      {app.location && <span> · {app.location}</span>}
                    </div>
                    {app.specialties && app.specialties.length > 0 && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                        {app.specialties.map((s) => (
                          <span key={s} style={{
                            background: "var(--color-dark)", border: "1px solid var(--color-border)",
                            borderRadius: 6, padding: "2px 8px", fontSize: 12,
                            color: "var(--color-text)", fontFamily: "var(--font-display)",
                          }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {app.bio && (
                      <div style={{
                        fontSize: 14, color: "var(--color-dim)", lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                        maxWidth: 600,
                      }}>
                        {app.bio}
                      </div>
                    )}
                  </div>

                  {/* 우측 */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    {app.credit_rate != null && (
                      <div style={{
                        fontSize: 15, fontWeight: 700, fontFamily: "var(--font-display)",
                        color: "#fbbf24",
                      }}>
                        ${app.credit_rate}/hr
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "var(--color-dim)" }}>
                      {new Date(app.created_at).toLocaleDateString("ko-KR")}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <button
                        onClick={() => setDetailId(detailId === app.id ? null : app.id)}
                        style={{
                          padding: "6px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                          border: "1px solid var(--color-border)", background: "transparent",
                          color: "var(--color-dim)", cursor: "pointer", fontFamily: "var(--font-display)",
                        }}
                      >
                        상세
                      </button>
                      {app.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(app)}
                            disabled={isPending}
                            style={{
                              padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 700,
                              border: "none", background: "rgba(34,197,94,0.2)",
                              color: "#4ade80", cursor: "pointer", fontFamily: "var(--font-display)",
                            }}
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleOpenReject(app)}
                            disabled={isPending}
                            style={{
                              padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 700,
                              border: "none", background: "rgba(239,68,68,0.15)",
                              color: "#f87171", cursor: "pointer", fontFamily: "var(--font-display)",
                            }}
                          >
                            거절
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 상세 패널 */}
                {detailId === app.id && (
                  <div style={{
                    marginTop: 16, paddingTop: 16,
                    borderTop: "1px solid var(--color-border)",
                    fontSize: 14, color: "var(--color-text)", lineHeight: 1.7,
                  }}>
                    {app.bio && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, color: "var(--color-dim)", marginRight: 8 }}>Bio</span>
                        {app.bio}
                      </div>
                    )}
                    {app.notes && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, color: "var(--color-dim)", marginRight: 8 }}>검토 메모</span>
                        {app.notes}
                      </div>
                    )}
                    {app.reviewed_at && (
                      <div style={{ color: "var(--color-dim)", fontSize: 13 }}>
                        검토일: {new Date(app.reviewed_at).toLocaleString("ko-KR")}
                      </div>
                    )}
                    {app.photo_url && (
                      <div style={{ marginTop: 10 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={app.photo_url}
                          alt={app.name}
                          style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 거절 모달 */}
      {rejectModal.open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setRejectModal({ open: false }); }}
        >
          <div style={{
            background: "var(--color-card)", borderRadius: 16,
            border: "1px solid var(--color-border)",
            padding: "28px 28px 24px", width: 440, maxWidth: "90vw",
          }}>
            <h2 style={{
              margin: "0 0 6px", fontSize: 18, fontWeight: 700,
              fontFamily: "var(--font-display)", color: "var(--color-text)",
            }}>
              지원 거절
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--color-dim)" }}>
              <strong>{rejectModal.name}</strong>님에게 거절 이메일이 발송됩니다.
            </p>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-dim)", display: "block", marginBottom: 6 }}>
              거절 사유 (선택, 이메일에 포함됩니다)
            </label>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={4}
              placeholder="사유를 입력하면 신청자에게 전달됩니다..."
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1px solid var(--color-border)", background: "var(--color-dark)",
                color: "var(--color-text)", fontSize: 14, resize: "vertical",
                fontFamily: "var(--font-body)", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                onClick={() => setRejectModal({ open: false })}
                style={{
                  padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  border: "1px solid var(--color-border)", background: "transparent",
                  color: "var(--color-dim)", cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={isPending}
                style={{
                  padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  border: "none", background: "rgba(239,68,68,0.2)",
                  color: "#f87171", cursor: "pointer",
                }}
              >
                {isPending ? "처리 중..." : "거절 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
