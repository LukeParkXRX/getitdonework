"use client";

import { useState } from "react";
import { Modal, useToast } from "@/components/ui";
import { downloadCSV } from "@/lib/utils/csv-export";
import { createClient } from "@/lib/supabase/client";

// ─── 타입 ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "pending" | "approved" | "suspended";

export type EnablerRow = {
  userId: string;
  fullName: string;
  avatarInitial: string;
  avatarUrl: string;
  university: string;
  degreeType: string;
  status: string;
  specialties: string[];
  location: string;
  enablerScore: number;
  sessionCount: number;
  rating: number;
  reRequestRate: number;
  bio: string;
  creditRate: number;
  badgeLevel: string;
  availability: Record<string, unknown>;
  taxFormType?: "w9" | "w8ben" | "w8ben_e" | "none";
  taxFormCompleted?: boolean;
  taxFormUrl?: string | null;
};

interface ReviewAction {
  enablerName: string;
  action: "approved" | "rejected" | "suspended" | "restored";
  reason?: string;
  timestamp: string;
}

interface Props {
  initial: EnablerRow[];
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function statusLabel(status: string) {
  if (status === "pending") return "심사 대기";
  if (status === "approved") return "승인";
  if (status === "suspended") return "정지";
  return status;
}

function statusColor(status: string): React.CSSProperties {
  if (status === "pending")
    return {
      background: "rgba(245,158,11,0.15)",
      color: "var(--color-amber)",
      border: "1px solid rgba(245,158,11,0.3)",
    };
  if (status === "approved")
    return {
      background: "rgba(34,197,94,0.12)",
      color: "var(--color-green)",
      border: "1px solid rgba(34,197,94,0.25)",
    };
  return {
    background: "rgba(239,68,68,0.12)",
    color: "var(--color-red)",
    border: "1px solid rgba(239,68,68,0.25)",
  };
}

function renderStars(rating: number) {
  if (!rating) return <span style={{ color: "var(--color-dim)" }}>—</span>;
  return (
    <span style={{ color: "var(--color-gold)", fontSize: 14, whiteSpace: "nowrap" as const }}>
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
      <span
        style={{
          color: "var(--color-dim)",
          fontSize: 13,
          marginLeft: 4,
          fontFamily: "var(--font-mono)",
        }}
      >
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionBadgeStyle(action: ReviewAction["action"]): React.CSSProperties {
  if (action === "approved")
    return {
      background: "rgba(34,197,94,0.12)",
      color: "var(--color-green)",
      border: "1px solid rgba(34,197,94,0.25)",
    };
  if (action === "rejected")
    return {
      background: "rgba(239,68,68,0.12)",
      color: "var(--color-red)",
      border: "1px solid rgba(239,68,68,0.25)",
    };
  if (action === "suspended")
    return {
      background: "rgba(245,158,11,0.15)",
      color: "var(--color-amber)",
      border: "1px solid rgba(245,158,11,0.3)",
    };
  return {
    background: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "1px solid rgba(59,130,246,0.25)",
  };
}

function actionLabel(action: ReviewAction["action"]) {
  if (action === "approved") return "승인";
  if (action === "rejected") return "거절";
  if (action === "suspended") return "정지";
  return "복원";
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function EnablersAdminClient({ initial }: Props) {
  const { info, success, error: toastError } = useToast();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  // 거절 모달
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // 심사 이력
  const [reviewHistory, setReviewHistory] = useState<ReviewAction[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // 체크박스 선택
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 로컬 상태 오버라이드 적용
  const allEnablers = initial.map((e) =>
    localStatuses[e.userId] ? { ...e, status: localStatuses[e.userId] } : e
  );

  // 필터 + 검색
  const filtered = allEnablers.filter((e) => {
    const matchStatus = filter === "all" || e.status === filter;
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      e.fullName.toLowerCase().includes(q) ||
      e.specialties.some((s) => s.toLowerCase().includes(q));
    return matchStatus && matchQuery;
  });

  function handleExportCSV() {
    const headers = ["이름", "대학", "학위", "전문분야", "상태", "크레딧단가", "세션수", "평점"];
    const rows = filtered.map((e) => [
      e.fullName,
      e.university,
      e.degreeType,
      e.specialties.join(" / "),
      statusLabel(e.status),
      String(e.creditRate),
      String(e.sessionCount),
      e.rating ? e.rating.toFixed(1) : "0",
    ]);
    downloadCSV("enablers", headers, rows);
  }

  // 카운트
  const counts = {
    all: allEnablers.length,
    pending: allEnablers.filter((e) => e.status === "pending").length,
    approved: allEnablers.filter((e) => e.status === "approved").length,
    suspended: allEnablers.filter((e) => e.status === "suspended").length,
  };

  function pushHistory(entry: ReviewAction) {
    setReviewHistory((prev) => [entry, ...prev]);
  }

  // API 호출 후 성공 시 로컬 상태 갱신
  async function callPatchApi(userId: string, status: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/enablers/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toastError((data as { error?: string }).error ?? "처리 중 오류가 발생했습니다");
        return false;
      }
      return true;
    } catch {
      toastError("네트워크 오류가 발생했습니다");
      return false;
    }
  }

  async function handleAction(
    userId: string,
    action: "approve" | "reject" | "suspend" | "restore",
    reason?: string
  ) {
    const enabler = allEnablers.find((e) => e.userId === userId);
    const name = enabler?.fullName ?? userId;
    const ts = new Date().toISOString();

    if (action === "approve") {
      const ok = await callPatchApi(userId, "approved");
      if (!ok) return;
      setLocalStatuses((p) => ({ ...p, [userId]: "approved" }));
      pushHistory({ enablerName: name, action: "approved", timestamp: ts });
      success(`${name} 승인 완료`);
    }
    if (action === "reject") {
      const ok = await callPatchApi(userId, "suspended", reason);
      if (!ok) return;
      setLocalStatuses((p) => ({ ...p, [userId]: "suspended" }));
      pushHistory({ enablerName: name, action: "rejected", reason, timestamp: ts });
      success(`${name} 거절 완료`);
    }
    if (action === "suspend") {
      const ok = await callPatchApi(userId, "suspended", reason);
      if (!ok) return;
      setLocalStatuses((p) => ({ ...p, [userId]: "suspended" }));
      pushHistory({ enablerName: name, action: "suspended", reason, timestamp: ts });
      info(`${name} 정지 처리됨`);
    }
    if (action === "restore") {
      const ok = await callPatchApi(userId, "approved");
      if (!ok) return;
      setLocalStatuses((p) => ({ ...p, [userId]: "approved" }));
      pushHistory({ enablerName: name, action: "restored", timestamp: ts });
      success(`${name} 복원 완료`);
    }
  }

  // 거절 모달 확인
  async function handleRejectConfirm() {
    if (!rejectTarget || rejectReason.trim().length < 5) return;
    await handleAction(rejectTarget, "reject", rejectReason.trim());
    setRejectTarget(null);
    setRejectReason("");
  }

  // 거절 모달 열기 (reject 요청 시 인터셉트)
  function handleRejectOpen(userId: string) {
    setRejectTarget(userId);
    setRejectReason("");
  }

  // 체크박스 토글
  function toggleSelect(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  // 일괄 승인
  async function handleBulkApprove() {
    const ts = new Date().toISOString();
    const names: string[] = [];

    // 병렬 API 호출
    const results = await Promise.all(
      Array.from(selected).map(async (userId) => {
        const ok = await callPatchApi(userId, "approved");
        return { userId, ok };
      })
    );

    results.forEach(({ userId, ok }) => {
      if (!ok) return;
      const enabler = allEnablers.find((e) => e.userId === userId);
      const name = enabler?.fullName ?? userId;
      names.push(name);
      setLocalStatuses((p) => ({ ...p, [userId]: "approved" }));
      setReviewHistory((prev) => [
        { enablerName: name, action: "approved", timestamp: ts },
        ...prev,
      ]);
    });

    setSelected(new Set());
    if (names.length > 0) success(`${names.length}명 일괄 승인 완료`);
  }

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "pending", label: "심사 대기" },
    { key: "approved", label: "승인" },
    { key: "suspended", label: "정지" },
  ];

  const btnBase: React.CSSProperties = {
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        padding: "32px 36px",
        minHeight: "100vh",
        background: "var(--color-black)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* ── 헤더 ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 700,
              color: "var(--color-text)",
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            Enabler 관리
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 15,
              color: "var(--color-dim)",
              fontFamily: "var(--font-mono)",
            }}
          >
            총 {allEnablers.length}명
          </p>
        </div>

        {/* 검색 */}
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-dim)",
              fontSize: 16,
              pointerEvents: "none",
            }}
          >
            ⌕
          </span>
          <input
            type="text"
            placeholder="이름 또는 전문 분야 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "9px 14px 9px 34px",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              width: 260,
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--color-accent)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--color-border)";
            }}
          />
        </div>

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            backgroundColor: "transparent",
            color: "var(--color-dim)",
            fontSize: "12px",
            fontFamily: "var(--font-body)",
            cursor: "pointer",
          }}
        >
          Export CSV
        </button>
      </div>

      {/* ── 상태 필터 탭 ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 20,
                border: active
                  ? "1px solid rgba(163,230,53,0.4)"
                  : "1px solid var(--color-border)",
                background: active ? "rgba(163,230,53,0.1)" : "var(--color-dark)",
                color: active ? "var(--color-accent)" : "var(--color-dim)",
                fontSize: 15,
                fontFamily: "var(--font-body)",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
              <span
                style={{
                  background: active ? "rgba(163,230,53,0.2)" : "rgba(255,255,255,0.06)",
                  color: active ? "var(--color-accent)" : "var(--color-dim)",
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 일괄 승인 버튼 ── */}
      {selected.size > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={handleBulkApprove}
            style={{
              ...btnBase,
              background: "rgba(163,230,53,0.15)",
              color: "var(--color-accent)",
              borderColor: "rgba(163,230,53,0.35)",
            }}
          >
            선택 항목 일괄 승인 ({selected.size}명)
          </button>
        </div>
      )}

      {/* ── 테이블 ── */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* 테이블 헤더 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "36px 1.8fr 1.2fr 80px 80px 110px 130px 100px 170px",
            padding: "10px 20px",
            borderBottom: "1px solid var(--color-border)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {["", "이름 / 소속", "전문 분야", "스코어", "세션", "평점", "세무 정보", "상태", "액션"].map(
            (h) => (
              <span
                key={h}
                style={{
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </span>
            )
          )}
        </div>

        {/* 테이블 바디 */}
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--color-dim)",
              fontSize: 16,
            }}
          >
            검색 결과가 없습니다.
          </div>
        ) : (
          filtered.map((enabler, idx) => (
            <EnablerRowItem
              key={enabler.userId}
              enabler={enabler}
              isLast={idx === filtered.length - 1}
              expanded={expandedId === enabler.userId}
              onToggleExpand={() =>
                setExpandedId(expandedId === enabler.userId ? null : enabler.userId)
              }
              onAction={handleAction}
              onRejectOpen={handleRejectOpen}
              onInfo={info}
              selected={selected.has(enabler.userId)}
              onToggleSelect={() => toggleSelect(enabler.userId)}
              onDownloadTaxForm={async (url) => {
                try {
                  const supabase = createClient();
                  const { data, error: dlErr } = await supabase.storage
                    .from("tax-forms")
                    .createSignedUrl(url, 60);
                  if (dlErr) {
                    toastError(`세무 서류 다운로드 실패: ${dlErr.message}`);
                    return;
                  }
                  if (data?.signedUrl) {
                    window.open(data.signedUrl, "_blank");
                  }
                } catch {
                  toastError("세무 서류 다운로드 중 오류가 발생했습니다.");
                }
              }}
            />
          ))
        )}
      </div>

      {/* 결과 수 */}
      {filtered.length > 0 && (
        <p
          style={{
            marginTop: 14,
            fontSize: 14,
            color: "var(--color-dim)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {filtered.length}명 표시 중
        </p>
      )}

      {/* ── 심사 이력 ── */}
      <div
        style={{
          marginTop: 40,
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--color-card)",
        }}
      >
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            background: "transparent",
            border: "none",
            color: "var(--color-text)",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          <span>심사 이력</span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--color-dim)",
            }}
          >
            <span
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "1px 8px",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--color-dim)",
              }}
            >
              {reviewHistory.length}
            </span>
            <span style={{ fontSize: 18, transition: "transform 0.2s", transform: historyOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▾
            </span>
          </span>
        </button>

        {historyOpen && (
          <div style={{ borderTop: "1px solid var(--color-border)" }}>
            {reviewHistory.length === 0 ? (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                  color: "var(--color-dim)",
                  fontSize: 15,
                }}
              >
                아직 심사 이력이 없습니다.
              </div>
            ) : (
              <div style={{ padding: "8px 20px 20px" }}>
                {reviewHistory.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: "14px 0",
                      borderBottom:
                        i < reviewHistory.length - 1
                          ? "1px solid rgba(255,255,255,0.05)"
                          : "none",
                    }}
                  >
                    {/* 타임라인 점 */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        marginTop: 5,
                        flexShrink: 0,
                        background:
                          entry.action === "approved"
                            ? "var(--color-green)"
                            : entry.action === "rejected"
                            ? "var(--color-red)"
                            : entry.action === "suspended"
                            ? "var(--color-amber)"
                            : "#60a5fa",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "var(--color-text)",
                          }}
                        >
                          {entry.enablerName}
                        </span>
                        <span
                          style={{
                            ...actionBadgeStyle(entry.action),
                            padding: "2px 9px",
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {actionLabel(entry.action)}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--color-dim)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      {entry.reason && (
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: 14,
                            color: "var(--color-dim)",
                            lineHeight: 1.6,
                          }}
                        >
                          사유: {entry.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 거절 사유 모달 ── */}
      <Modal
        isOpen={rejectTarget !== null}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        title="Enabler 거절 사유"
        size="sm"
      >
        <div>
          <p style={{ margin: "0 0 12px", fontSize: 15, color: "var(--color-dim)", lineHeight: 1.6 }}>
            거절 사유를 입력하세요. 최소 5자 이상 작성해야 합니다.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="거절 사유를 입력하세요..."
            rows={4}
            style={{
              width: "100%",
              background: "var(--color-dark)",
              border: `1px solid ${rejectReason.trim().length > 0 && rejectReason.trim().length < 5 ? "var(--color-red)" : "var(--color-border)"}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              lineHeight: 1.6,
            }}
            onFocus={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = "var(--color-accent)";
            }}
            onBlur={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor =
                rejectReason.trim().length > 0 && rejectReason.trim().length < 5
                  ? "var(--color-red)"
                  : "var(--color-border)";
            }}
          />
          {rejectReason.trim().length > 0 && rejectReason.trim().length < 5 && (
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-red)" }}>
              최소 5자 이상 입력해 주세요.
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
            <button
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
              style={{
                ...btnBase,
                background: "transparent",
                color: "var(--color-dim)",
                borderColor: "var(--color-border)",
              }}
            >
              취소
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={rejectReason.trim().length < 5}
              style={{
                ...btnBase,
                background:
                  rejectReason.trim().length >= 5
                    ? "rgba(239,68,68,0.15)"
                    : "rgba(239,68,68,0.05)",
                color:
                  rejectReason.trim().length >= 5 ? "var(--color-red)" : "rgba(239,68,68,0.3)",
                borderColor:
                  rejectReason.trim().length >= 5
                    ? "rgba(239,68,68,0.35)"
                    : "rgba(239,68,68,0.15)",
                cursor: rejectReason.trim().length >= 5 ? "pointer" : "not-allowed",
              }}
            >
              거절 확인
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── 행 컴포넌트 ──────────────────────────────────────────────────────────────

function EnablerRowItem({
  enabler,
  isLast,
  expanded,
  onToggleExpand,
  onAction,
  onRejectOpen,
  onInfo,
  selected,
  onToggleSelect,
  onDownloadTaxForm,
}: {
  enabler: EnablerRow;
  isLast: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onAction: (userId: string, action: "approve" | "reject" | "suspend" | "restore", reason?: string) => void;
  onRejectOpen: (userId: string) => void;
  onInfo: (msg: string) => void;
  selected: boolean;
  onToggleSelect: () => void;
  onDownloadTaxForm: (url: string) => Promise<void>;
}) {
  return (
    <>
      {/* 메인 행 */}
      <div
        style={{
          borderBottom: isLast && !expanded ? "none" : "1px solid var(--color-border)",
          transition: "background 0.1s",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "36px 1.8fr 1.2fr 80px 80px 110px 130px 100px 170px",
            padding: "14px 20px",
            alignItems: "center",
          }}
        >
          {/* 체크박스 */}
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              style={{
                width: 16,
                height: 16,
                cursor: "pointer",
                accentColor: "var(--color-accent)",
              }}
            />
          </div>

          {/* 이름 / 소속 — 클릭 시 확장 */}
          <div
            onClick={onToggleExpand}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.opacity = "1";
            }}
          >
            <Avatar url={enabler.avatarUrl} initial={enabler.avatarInitial} size={36} />
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--color-text)",
                  lineHeight: 1.3,
                }}
              >
                {enabler.fullName}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-dim)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {enabler.university} · {enabler.degreeType}
              </div>
            </div>
          </div>

          {/* 전문 분야 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {enabler.specialties.slice(0, 2).map((s) => (
              <span
                key={s}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  padding: "2px 8px",
                  fontSize: 13,
                  color: "var(--color-dim)",
                  whiteSpace: "nowrap",
                }}
              >
                {s}
              </span>
            ))}
            {enabler.specialties.length > 2 && (
              <span style={{ fontSize: 13, color: "var(--color-dim)", alignSelf: "center" }}>
                +{enabler.specialties.length - 2}
              </span>
            )}
          </div>

          {/* 스코어 */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              fontWeight: 600,
              color:
                enabler.enablerScore >= 90
                  ? "var(--color-accent)"
                  : enabler.enablerScore > 0
                  ? "var(--color-text)"
                  : "var(--color-dim)",
            }}
          >
            {enabler.enablerScore > 0 ? enabler.enablerScore : "—"}
          </div>

          {/* 세션 */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              color: enabler.sessionCount > 0 ? "var(--color-text)" : "var(--color-dim)",
            }}
          >
            {enabler.sessionCount > 0 ? enabler.sessionCount : "—"}
          </div>

          {/* 평점 */}
          <div>{renderStars(enabler.rating)}</div>

          {/* 세무 정보 */}
          <div>
            {enabler.taxFormCompleted && enabler.taxFormUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    color: "var(--color-green)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {enabler.taxFormType?.toUpperCase() ?? "TAX"} 완료
                </span>
                <button
                  onClick={() => onDownloadTaxForm(enabler.taxFormUrl!)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-accent)",
                    fontSize: 12,
                    textDecoration: "underline",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  다운로드
                </button>
              </div>
            ) : (
              <span
                style={{
                  background: "rgba(239,68,68,0.12)",
                  color: "var(--color-red)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                미제출 🔴
              </span>
            )}
          </div>

          {/* 상태 배지 */}
          <div>
            <span
              style={{
                ...statusColor(enabler.status),
                padding: "3px 10px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
              }}
            >
              {statusLabel(enabler.status)}
            </span>
          </div>

          {/* 액션 버튼 */}
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 6 }}>
            <ActionButtons
              status={enabler.status}
              userId={enabler.userId}
              onAction={onAction}
              onRejectOpen={onRejectOpen}
              onInfo={onInfo}
            />
          </div>
        </div>

        {/* 확장 상세 */}
        {expanded && (
          <div
            style={{
              padding: "0 20px 18px 70px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 24,
                paddingTop: 14,
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 15,
                    color: "var(--color-text)",
                    lineHeight: 1.7,
                  }}
                >
                  {enabler.bio}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    fontSize: 14,
                    color: "var(--color-dim)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <span>📍 {enabler.location}</span>
                  <span>크레딧 {enabler.creditRate}개/회</span>
                  {enabler.reRequestRate > 0 && (
                    <span>재요청률 {enabler.reRequestRate}%</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── 아바타 ───────────────────────────────────────────────────────────────────

function Avatar({ url, initial, size }: { url: string; initial: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: "var(--color-dark)",
        border: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "var(--color-dim)",
        fontFamily: "var(--font-display)",
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={initial}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

// ─── 액션 버튼 ────────────────────────────────────────────────────────────────

function ActionButtons({
  status,
  userId,
  onAction,
  onRejectOpen,
  onInfo,
}: {
  status: string;
  userId: string;
  onAction: (userId: string, action: "approve" | "reject" | "suspend" | "restore", reason?: string) => void;
  onRejectOpen: (userId: string) => void;
  onInfo: (msg: string) => void;
}) {
  const btnBase: React.CSSProperties = {
    padding: "5px 11px",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  if (status === "pending") {
    return (
      <>
        <button
          onClick={() => onAction(userId, "approve")}
          style={{
            ...btnBase,
            background: "rgba(163,230,53,0.15)",
            color: "var(--color-accent)",
            borderColor: "rgba(163,230,53,0.35)",
          }}
        >
          승인
        </button>
        <button
          onClick={() => onRejectOpen(userId)}
          style={{
            ...btnBase,
            background: "transparent",
            color: "var(--color-red)",
            borderColor: "rgba(239,68,68,0.3)",
          }}
        >
          거절
        </button>
      </>
    );
  }

  if (status === "approved") {
    return (
      <>
        <button
          onClick={() => onInfo("백엔드 연동 후 프로필 페이지로 이동합니다")}
          style={{
            ...btnBase,
            background: "transparent",
            color: "var(--color-dim)",
            borderColor: "var(--color-border)",
          }}
        >
          프로필 보기
        </button>
        <button
          onClick={() => onAction(userId, "suspend")}
          style={{
            ...btnBase,
            background: "transparent",
            color: "var(--color-red)",
            borderColor: "rgba(239,68,68,0.3)",
          }}
        >
          정지
        </button>
      </>
    );
  }

  if (status === "suspended") {
    return (
      <button
        onClick={() => onAction(userId, "restore")}
        style={{
          ...btnBase,
          background: "transparent",
          color: "var(--color-green)",
          borderColor: "rgba(34,197,94,0.3)",
        }}
      >
        복원
      </button>
    );
  }

  return null;
}
