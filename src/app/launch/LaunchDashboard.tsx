"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  category: string;
  category_order: number;
  item_order: number;
  title_ko: string;
  title_en: string;
  description_ko: string;
  description_en: string;
  priority: "P0" | "P1" | "P2";
  needs_value: boolean;
  value_label: string | null;
  value_is_secret: boolean;
  is_complete: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string;
  value: string;
  updated_at: string;
}

interface LaunchUpdate {
  id: string;
  author_name: string;
  author_role: "korea_dev" | "us_partner";
  type: "daily" | "feedback" | "question" | "blocker" | "milestone";
  title: string;
  body: string;
  related_item_id: string | null;
  resolved: boolean;
  created_at: string;
}

interface Props {
  email: string;
  onLogout: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  P0: { bg: "oklch(0.63 0.2 25 / 0.15)", text: "oklch(0.63 0.2 25)", label: "P0 Critical" },
  P1: { bg: "oklch(0.91 0.2 110 / 0.12)", text: "var(--color-accent)", label: "P1 High" },
  P2: { bg: "oklch(0.72 0.19 155 / 0.12)", text: "oklch(0.72 0.19 155)", label: "P2 Medium" },
};

const UPDATE_TYPE_LABELS: Record<string, string> = {
  daily: "Daily",
  feedback: "Feedback",
  question: "Question",
  blocker: "Blocker",
  milestone: "Milestone",
};

const UPDATE_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  daily: { bg: "oklch(0.52 0.01 280 / 0.2)", text: "var(--color-dim)" },
  feedback: { bg: "oklch(0.65 0.15 250 / 0.15)", text: "var(--color-blue)" },
  question: { bg: "oklch(0.91 0.2 110 / 0.12)", text: "var(--color-accent)" },
  blocker: { bg: "oklch(0.63 0.2 25 / 0.15)", text: "oklch(0.63 0.2 25)" },
  milestone: { bg: "oklch(0.72 0.19 155 / 0.12)", text: "oklch(0.72 0.19 155)" },
};

const AUTHOR_ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  korea_dev: { bg: "oklch(0.65 0.15 195 / 0.15)", text: "oklch(0.75 0.15 195)", label: "Korea Dev" },
  us_partner: { bg: "oklch(0.78 0.15 55 / 0.15)", text: "oklch(0.78 0.15 55)", label: "US Partner" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByCategory(items: ChecklistItem[]): Map<string, ChecklistItem[]> {
  const map = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const existing = map.get(item.category);
    if (existing) existing.push(item);
    else map.set(item.category, [item]);
  }
  return map;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function buildMarkdown(checklist: ChecklistItem[], lang: "ko" | "en"): string {
  const grouped = groupByCategory(checklist);
  const lines: string[] = [
    "# Launch Readiness Checklist",
    `*Generated: ${new Date().toLocaleString("ko-KR")}*`,
    "",
  ];
  for (const [category, items] of grouped) {
    const done = items.filter((i) => i.is_complete).length;
    lines.push(`## ${category} (${done}/${items.length})`);
    for (const item of items) {
      const check = item.is_complete ? "x" : " ";
      const title = lang === "ko" ? item.title_ko : item.title_en;
      lines.push(`- [${check}] **[${item.priority}]** ${title}`);
      if (item.notes) lines.push(`  > ${item.notes}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// ── A. Welcome Card ──────────────────────────────────────────────────────────

interface WelcomeCardProps {
  lang: "ko" | "en";
  onDismiss: () => void;
}

function WelcomeCard({ lang, onDismiss }: WelcomeCardProps) {
  const steps = [
    {
      icon: "✓",
      en: "Check items as you complete",
      ko: "항목 완료 시 체크박스 클릭",
    },
    {
      icon: "✏️",
      en: "Fill required info",
      ko: "EIN, API key 등 입력",
    },
    {
      icon: "💬",
      en: "Post questions in feed",
      ko: "우측 피드에 질문/블로커 작성",
    },
    {
      icon: "🤝",
      en: "Korea dev sees changes live",
      ko: "한국 개발팀이 실시간으로 봄",
    },
  ];

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--radius-lg)",
        border: "1px solid oklch(0.91 0.2 110 / 0.25)",
        background:
          "linear-gradient(135deg, oklch(0.91 0.2 110 / 0.08) 0%, oklch(0.72 0.19 155 / 0.06) 50%, oklch(0.18 0.01 280) 100%)",
        padding: "20px 24px",
        overflow: "hidden",
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="닫기"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 28,
          height: 28,
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-dark)",
          color: "var(--color-dim)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          lineHeight: 1,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)";
        }}
      >
        ×
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "16px 32px", alignItems: "start" }} className="welcome-grid">
        {/* Left: title */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--color-accent)",
              marginBottom: 4,
            }}
          >
            👋 Welcome to Launch Dashboard
          </div>
          <div style={{ fontSize: "13px", color: "oklch(0.65 0.01 280)", lineHeight: 1.5 }}>
            {lang === "ko"
              ? "1분 가이드 · How to use in 1 minute"
              : "How to use in 1 minute · 1분 가이드"}
          </div>
        </div>

        {/* Right: steps */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="welcome-steps">
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "oklch(0.15 0.005 280 / 0.6)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: "16px" }}>{step.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text)", lineHeight: 1.4 }}>
                {lang === "ko" ? step.ko : step.en}
              </div>
              <div style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)", lineHeight: 1.4 }}>
                {lang === "ko" ? step.en : step.ko}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onDismiss}
          style={{
            padding: "8px 20px",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-black)",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          {lang === "ko" ? "시작합니다 · Got it, let's start!" : "Got it, let's start! · 시작합니다"}
        </button>
      </div>
    </div>
  );
}

// ── B. Next Actions ───────────────────────────────────────────────────────────

interface NextActionsProps {
  checklist: ChecklistItem[];
  lang: "ko" | "en";
}

function NextActions({ checklist, lang }: NextActionsProps) {
  const pending = checklist.filter((i) => i.priority === "P0" && !i.is_complete).slice(0, 3);

  const handleJump = (id: string) => {
    const el = document.getElementById(`checklist-item-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (pending.length === 0) {
    return (
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid oklch(0.72 0.19 155 / 0.3)",
          backgroundColor: "oklch(0.72 0.19 155 / 0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: "20px" }}>🎉</span>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "oklch(0.72 0.19 155)" }}>
            {lang === "ko" ? "P0 항목 전부 완료!" : "All P0 items done!"}
          </div>
          <div style={{ fontSize: "13px", color: "oklch(0.65 0.01 280)", marginTop: 2 }}>
            {lang === "ko" ? "아래 P1 항목으로 이동하세요." : "Move to P1 items below."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--color-dim)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 10,
        }}
      >
        🎯 {lang === "ko" ? "다음 우선순위 · Next Actions" : "Next Actions · 다음 우선순위"}{" "}
        <span style={{ color: "oklch(0.63 0.2 25)", fontWeight: 700 }}>({pending.length} items)</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="next-actions-grid">
        {pending.map((item) => {
          const title = lang === "ko" ? item.title_ko : item.title_en;
          const desc = lang === "ko" ? item.description_ko : item.description_en;
          const altTitle = lang === "ko" ? item.title_en : item.title_ko;
          const catLabel = item.category.split(".")[1]?.trim() ?? item.category;

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "14px 14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                transition: "border-color 0.15s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.63 0.2 25 / 0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PriorityBadge priority="P0" />
                <span style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)" }}>{catLabel}</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, color: "var(--color-text)", lineHeight: 1.35 }}>
                {title}
              </div>
              <div style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)" }}>{altTitle}</div>
              {desc && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text)",
                    lineHeight: 1.55,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {desc}
                </div>
              )}
              <div style={{ marginTop: "auto", paddingTop: 6 }}>
                <button
                  onClick={() => handleJump(item.id)}
                  style={{
                    padding: "4px 10px",
                    backgroundColor: "transparent",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-full)",
                    color: "var(--color-accent)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.91 0.2 110 / 0.1)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                  }}
                >
                  Jump to →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "P0" | "P1" | "P2" }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 7px",
        borderRadius: "var(--radius-full)",
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        letterSpacing: "0.04em",
        backgroundColor: s.bg,
        color: s.text,
        flexShrink: 0,
      }}
    >
      {priority}
    </span>
  );
}

function CategoryProgress({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.is_complete).length;
  const pct = items.length > 0 ? (done / items.length) * 100 : 0;
  return (
    <div style={{ width: "100%", height: 4, backgroundColor: "var(--color-border)", borderRadius: 2, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, var(--color-accent), oklch(0.85 0.22 130))",
          borderRadius: 2,
          transition: "width 0.4s var(--ease-out-expo)",
        }}
      />
    </div>
  );
}

// ─── Checklist Item Card ──────────────────────────────────────────────────────

interface ItemCardProps {
  item: ChecklistItem;
  lang: "ko" | "en";
  email: string;
  onUpdate: (updated: ChecklistItem) => void;
  onUnauthorized: () => void;
}

function ItemCard({ item, lang, email, onUpdate, onUnauthorized }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [localNotes, setLocalNotes] = useState(item.notes);
  const [localValue, setLocalValue] = useState(item.value);
  const [saving, setSaving] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const patchItem = useCallback(
    async (payload: Record<string, unknown>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/launch/checklist/${item.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${email}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.status === 401) {
          onUnauthorized();
          return;
        }
        if (res.ok) {
          const json = (await res.json()) as { item: ChecklistItem };
          onUpdate(json.item);
        }
      } finally {
        setSaving(false);
      }
    },
    [email, item.id, onUpdate, onUnauthorized]
  );

  const handleToggle = () => {
    const newVal = !item.is_complete;
    onUpdate({ ...item, is_complete: newVal, completed_at: newVal ? new Date().toISOString() : null });
    void patchItem({ is_complete: newVal, completed_by: email });
  };

  const handleNotesBlur = () => {
    if (localNotes !== item.notes) {
      void patchItem({ notes: localNotes });
    }
  };

  const handleValueBlur = () => {
    if (localValue !== item.value) {
      void patchItem({ value: localValue });
    }
  };

  const title = lang === "ko" ? item.title_ko : item.title_en;
  const altTitle = lang === "ko" ? item.title_en : item.title_ko;
  const description = lang === "ko" ? item.description_ko : item.description_en;

  return (
    <div
      id={`checklist-item-${item.id}`}
      style={{
        backgroundColor: "var(--color-card)",
        border: `1px solid ${item.is_complete ? "oklch(0.72 0.19 155 / 0.3)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "14px 16px",
        opacity: item.is_complete ? 0.65 : 1,
        transition: "opacity 0.2s, border-color 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = item.is_complete
          ? "oklch(0.72 0.19 155 / 0.5)"
          : "var(--color-accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = item.is_complete
          ? "oklch(0.72 0.19 155 / 0.3)"
          : "var(--color-border)";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          aria-label={item.is_complete ? "완료 취소" : "완료 처리"}
          style={{
            width: 22,
            height: 22,
            minWidth: 22,
            borderRadius: "var(--radius-sm)",
            border: `2px solid ${item.is_complete ? "oklch(0.72 0.19 155)" : "var(--color-border)"}`,
            backgroundColor: item.is_complete ? "oklch(0.72 0.19 155)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {item.is_complete && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5L4.5 8.5L11 1" stroke="var(--color-black)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Title area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", cursor: "pointer" }}
            onClick={() => setExpanded((v) => !v)}
          >
            <PriorityBadge priority={item.priority} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-text)",
                textDecoration: item.is_complete ? "line-through" : "none",
              }}
            >
              {title}
            </span>
            <span style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)" }}>{altTitle}</span>
            {saving && (
              <span style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)" }}>저장 중...</span>
            )}
          </div>

          {/* Expand toggle hint */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "oklch(0.65 0.01 280)",
                fontSize: "12px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              {expanded ? "접기" : "펼치기"}
            </button>
            {item.is_complete && item.completed_at && (
              <span style={{ fontSize: "12px", color: "oklch(0.72 0.19 155)" }}>
                ✓ {formatRelativeTime(item.completed_at)}
                {item.completed_by ? ` — ${item.completed_by}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
          {description && (
            <p style={{ fontSize: "14px", color: "var(--color-text)", marginBottom: 10, lineHeight: 1.6, margin: "0 0 10px 0", fontWeight: 450 }}>
              {description}
            </p>
          )}

          {/* Value field */}
          {item.needs_value && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)", display: "block", marginBottom: 4, fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.value_label ?? "Value"}
                {item.value_is_secret && (
                  <span style={{ marginLeft: 6, color: "oklch(0.63 0.2 25)", fontSize: "11px" }}>SECRET</span>
                )}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type={item.value_is_secret && !showSecret ? "password" : "text"}
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onBlur={handleValueBlur}
                  placeholder={item.value_label ?? "입력..."}
                  style={{
                    flex: 1,
                    backgroundColor: "var(--color-dark)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "8px 10px",
                    fontSize: "14px",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-mono)",
                    outline: "none",
                    lineHeight: 1.5,
                  }}
                />
                {item.value_is_secret && (
                  <button
                    onClick={() => setShowSecret((v) => !v)}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "var(--color-dark)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--color-dim)",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {showSecret ? "숨기기" : "보기"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)", display: "block", marginBottom: 4, fontFamily: "var(--font-display)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Notes / 메모
            </label>
            <textarea
              ref={notesRef}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="메모를 입력하세요..."
              rows={2}
              style={{
                width: "100%",
                backgroundColor: "var(--color-dark)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "8px 10px",
                fontSize: "14px",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Update Card ──────────────────────────────────────────────────────────────

interface UpdateCardProps {
  update: LaunchUpdate;
  email: string;
  onResolve: (id: string) => void;
  onUnauthorized: () => void;
  highlight?: boolean;
}

function UpdateCard({ update, email, onResolve, onUnauthorized, highlight }: UpdateCardProps) {
  const [resolving, setResolving] = useState(false);
  const roleStyle = AUTHOR_ROLE_STYLES[update.author_role];
  const typeStyle = UPDATE_TYPE_STYLES[update.type];

  const handleResolve = async () => {
    setResolving(true);
    try {
      const res = await fetch(`/api/launch/updates/${update.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
        body: JSON.stringify({ resolved: true }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) onResolve(update.id);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: highlight ? "oklch(0.63 0.2 25 / 0.06)" : "var(--color-card)",
        border: `1px solid ${highlight ? "oklch(0.63 0.2 25 / 0.25)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "14px 16px",
      }}
    >
      {/* Author + type row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            fontSize: "11px",
            fontWeight: 700,
            backgroundColor: roleStyle.bg,
            color: roleStyle.text,
            fontFamily: "var(--font-display)",
          }}
        >
          {roleStyle.label}
        </span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: typeStyle.bg,
            color: typeStyle.text,
          }}
        >
          {UPDATE_TYPE_LABELS[update.type]}
        </span>
        <span style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)", marginLeft: "auto" }}>
          {formatRelativeTime(update.created_at)}
        </span>
      </div>

      <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, marginBottom: 6, color: "var(--color-text)" }}>
        {update.title}
      </div>

      <div
        style={{ fontSize: "14px", color: "var(--color-text)", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 10, fontWeight: 450 }}
      >
        {update.body}
      </div>

      {!update.resolved && update.type !== "milestone" && (
        <button
          onClick={() => void handleResolve()}
          disabled={resolving}
          style={{
            padding: "4px 12px",
            backgroundColor: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-full)",
            color: "var(--color-dim)",
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.72 0.19 155)";
            (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.72 0.19 155)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)";
          }}
        >
          {resolving ? "처리 중..." : "✓ Resolve"}
        </button>
      )}

      {update.resolved && (
        <span style={{ fontSize: "12px", color: "oklch(0.72 0.19 155)" }}>✓ Resolved</span>
      )}
    </div>
  );
}

// ─── New Update Form ──────────────────────────────────────────────────────────

interface NewUpdateFormProps {
  email: string;
  onCreated: (update: LaunchUpdate) => void;
  onUnauthorized: () => void;
}

function emailToName(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function defaultRoleFromEmail(email: string): "korea_dev" | "us_partner" {
  return email.endsWith("@xrx.studio") ? "korea_dev" : "us_partner";
}

function NewUpdateForm({ email, onCreated, onUnauthorized }: NewUpdateFormProps) {
  const [authorRole, setAuthorRole] = useState<"korea_dev" | "us_partner">(
    defaultRoleFromEmail(email)
  );
  const [type, setType] = useState<"daily" | "feedback" | "question" | "blocker" | "milestone">("feedback");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/launch/updates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
        body: JSON.stringify({ author_role: authorRole, type, title, body }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (res.ok) {
        const json = (await res.json()) as { update: LaunchUpdate };
        onCreated(json.update);
        setTitle("");
        setBody("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    backgroundColor: "var(--color-dark)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "8px 10px",
    fontSize: "14px",
    color: "var(--color-text)",
    outline: "none",
    cursor: "pointer",
    lineHeight: 1.5,
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, color: "var(--color-text)", marginBottom: 2 }}>
        새 업데이트 작성
      </div>

      {/* Posting as */}
      <div style={{ fontSize: "13px", color: "oklch(0.65 0.01 280)", padding: "6px 10px", backgroundColor: "var(--color-dark)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
        Posting as: <span style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>{emailToName(email)}</span>
        <span style={{ color: "var(--color-border)", margin: "0 4px" }}>·</span>
        <span style={{ color: AUTHOR_ROLE_STYLES[authorRole].text }}>{AUTHOR_ROLE_STYLES[authorRole].label}</span>
      </div>

      {/* Author role */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["us_partner", "korea_dev"] as const).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setAuthorRole(role)}
            style={{
              flex: 1,
              padding: "6px 0",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${authorRole === role ? AUTHOR_ROLE_STYLES[role].text : "var(--color-border)"}`,
              backgroundColor: authorRole === role ? AUTHOR_ROLE_STYLES[role].bg : "transparent",
              color: authorRole === role ? AUTHOR_ROLE_STYLES[role].text : "var(--color-dim)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {AUTHOR_ROLE_STYLES[role].label}
          </button>
        ))}
      </div>

      {/* Type */}
      <select value={type} onChange={(e) => setType(e.target.value as typeof type)} style={selectStyle}>
        <option value="feedback">Feedback</option>
        <option value="question">Question</option>
        <option value="blocker">Blocker</option>
        <option value="daily">Daily Update</option>
        <option value="milestone">Milestone</option>
      </select>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 / Title"
        required
        style={{ ...selectStyle, padding: "8px 10px" }}
      />

      {/* Body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="내용을 입력하세요... (줄바꿈 지원)"
        rows={4}
        required
        style={{
          ...selectStyle,
          resize: "vertical",
          fontFamily: "var(--font-body)",
          lineHeight: 1.5,
          boxSizing: "border-box",
          width: "100%",
        }}
      />

      <button
        type="submit"
        disabled={submitting || !title.trim() || !body.trim()}
        style={{
          padding: "9px 16px",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-black)",
          border: "none",
          borderRadius: "var(--radius-md)",
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting || !title.trim() || !body.trim() ? 0.5 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {submitting ? "전송 중..." : "전송 →"}
      </button>
    </form>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function LaunchDashboard({ email, onLogout }: Props) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [updates, setUpdates] = useState<LaunchUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"ko" | "en">("en");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [copyDone, setCopyDone] = useState(false);
  // A. Welcome card
  const [showWelcome, setShowWelcome] = useState(false);
  // C. Need Input filter
  const [needInputMode, setNeedInputMode] = useState(false);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("launch-dashboard-email");
    window.location.reload();
  }, []);

  // A. Welcome card: localStorage flag 확인
  useEffect(() => {
    const welcomed = localStorage.getItem("launch-dashboard-welcomed");
    if (welcomed !== "true") setShowWelcome(true);
  }, []);

  const handleDismissWelcome = () => {
    localStorage.setItem("launch-dashboard-welcomed", "true");
    setShowWelcome(false);
  };

  useEffect(() => {
    void fetch("/api/launch/state", {
      headers: { Authorization: `Bearer ${email}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) {
          const json = (await res.json()) as { checklist: ChecklistItem[]; updates: LaunchUpdate[] };
          setChecklist(json.checklist);
          setUpdates(json.updates);
        }
      })
      .finally(() => setLoading(false));
  }, [email, handleUnauthorized]);

  const grouped = groupByCategory(checklist);
  const totalCount = checklist.length;
  const doneCount = checklist.filter((i) => i.is_complete).length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const lastActivity = updates.length > 0 ? updates[0].created_at : null;

  // C. Need Input 필터 파생값
  const needInputItems = checklist.filter(
    (i) => i.needs_value === true && (!i.value || i.value.trim() === "") && !i.is_complete
  );
  const needInputCount = needInputItems.length;

  // C. 필터 모드에 따른 카테고리 그룹
  const displayedGrouped = needInputMode ? groupByCategory(needInputItems) : grouped;

  // D. ETA 계산
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentlyCompleted = checklist.filter(
    (i) => i.completed_at && new Date(i.completed_at).getTime() >= sevenDaysAgo
  ).length;
  const remaining = checklist.filter((i) => !i.is_complete).length;

  let etaText: string;
  if (remaining === 0) {
    etaText = "🎉 Ready to launch!";
  } else if (recentlyCompleted === 0) {
    etaText = lang === "ko"
      ? "📅 페이스를 설정해야 출시일 예측 가능"
      : "📅 Set a pace to estimate launch date";
  } else {
    const pace = recentlyCompleted / 7; // items/day
    const etaDays = Math.ceil(remaining / pace);
    const pacePerWeek = Math.round(pace * 7);
    etaText = lang === "ko"
      ? `📅 약 ${etaDays}일 후 출시 (${pacePerWeek}개/주 페이스)`
      : `📅 ~${etaDays} days to launch (${pacePerWeek} items/week pace)`;
  }

  const openQuestions = updates.filter(
    (u) => !u.resolved && (u.type === "question" || u.type === "blocker")
  );
  const recentUpdates = updates.filter(
    (u) => u.resolved || (u.type !== "question" && u.type !== "blocker")
  );

  const handleItemUpdate = useCallback((updated: ChecklistItem) => {
    setChecklist((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const handleUpdateCreated = useCallback((update: LaunchUpdate) => {
    setUpdates((prev) => [update, ...prev]);
  }, []);

  const handleResolve = useCallback((id: string) => {
    setUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, resolved: true } : u)));
  }, []);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleCopyMarkdown = async () => {
    const md = buildMarkdown(checklist, lang);
    await navigator.clipboard.writeText(md);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-black)" }}>
        <div style={{ color: "var(--color-dim)", fontSize: "14px", fontFamily: "var(--font-display)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)", color: "var(--color-text)" }}>
      {/* ── Top Bar ── */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "sticky",
          top: 0,
          backgroundColor: "var(--color-black)",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--color-accent)" }}>
            Get It Done at Work
          </span>
          <span style={{ color: "var(--color-border)" }}>·</span>
          <span style={{ fontSize: "14px", color: "oklch(0.65 0.01 280)" }}>Launch Dashboard</span>
          {lastActivity && (
            <>
              <span style={{ color: "var(--color-border)" }}>·</span>
              <span style={{ fontSize: "13px", color: "oklch(0.65 0.01 280)" }}>
                Last activity {formatRelativeTime(lastActivity)}
              </span>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* KO/EN toggle */}
          <div style={{ display: "flex", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
            {(["en", "ko"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: "4px 12px",
                  backgroundColor: lang === l ? "var(--color-accent)" : "transparent",
                  color: lang === l ? "var(--color-black)" : "var(--color-dim)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  transition: "all 0.15s",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Copy markdown */}
          <button
            onClick={() => void handleCopyMarkdown()}
            style={{
              padding: "5px 12px",
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: copyDone ? "oklch(0.72 0.19 155)" : "var(--color-dim)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {copyDone ? "✓ Copied!" : "Copy as MD"}
          </button>

          {/* Progress counter + ETA */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--color-text)" }}>
                {doneCount}
              </span>
              <span style={{ fontSize: "14px", color: "oklch(0.65 0.01 280)" }}>/ {totalCount}</span>
              <span
                style={{
                  marginLeft: 4,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: pct === 100 ? "oklch(0.72 0.19 155)" : "var(--color-accent)",
                }}
              >
                {pct}%
              </span>
            </div>
            {/* D. ETA */}
            <div style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)", whiteSpace: "nowrap" }}>
              {etaText}
            </div>
          </div>

          {/* Signed in as */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "var(--radius-full)",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: email.endsWith("@xrx.studio")
                  ? AUTHOR_ROLE_STYLES.korea_dev.bg
                  : AUTHOR_ROLE_STYLES.us_partner.bg,
                color: email.endsWith("@xrx.studio")
                  ? AUTHOR_ROLE_STYLES.korea_dev.text
                  : AUTHOR_ROLE_STYLES.us_partner.text,
                fontFamily: "var(--font-display)",
              }}
            >
              {email.endsWith("@xrx.studio") ? "Korea Dev" : "US Partner"}
            </span>
            <span style={{ fontSize: "13px", color: "oklch(0.65 0.01 280)", fontFamily: "var(--font-mono)" }}>
              {email}
            </span>
          </div>

          {/* Sign out */}
          <button
            onClick={onLogout}
            style={{
              padding: "5px 12px",
              backgroundColor: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-dim)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.63 0.2 25 / 0.6)";
              (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.63 0.2 25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)";
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── A. Welcome Card ── */}
      {showWelcome && (
        <div style={{ padding: "16px 24px 0" }}>
          <WelcomeCard lang={lang} onDismiss={handleDismissWelcome} />
        </div>
      )}

      {/* ── B. Next Actions ── */}
      {!loading && checklist.length > 0 && (
        <div style={{ padding: "16px 24px 0" }}>
          <NextActions checklist={checklist} lang={lang} />
        </div>
      )}

      {/* ── Hero Progress Section ── */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--color-border)" }}>
        {/* Overall bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "oklch(0.65 0.01 280)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Overall Progress
            </span>
            <span style={{ fontSize: "13px", color: "oklch(0.65 0.01 280)" }}>{doneCount} of {totalCount} complete</span>
          </div>
          <div style={{ height: 6, backgroundColor: "var(--color-border)", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "linear-gradient(90deg, var(--color-accent), oklch(0.85 0.22 130))",
                borderRadius: 3,
                transition: "width 0.5s var(--ease-out-expo)",
              }}
            />
          </div>
        </div>

        {/* Category bars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "10px 16px",
            paddingBottom: 16,
          }}
        >
          {Array.from(grouped.entries()).map(([cat, items]) => {
            const catDone = items.filter((i) => i.is_complete).length;
            return (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                    {cat.split(".")[1]?.trim() ?? cat}
                  </span>
                  <span style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)" }}>{catDone}/{items.length}</span>
                </div>
                <CategoryProgress items={items} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 7fr) minmax(0, 3fr)",
          gap: 0,
          minHeight: "calc(100vh - 160px)",
        }}
        className="launch-grid"
      >
        {/* ── Left: Checklist ── */}
        <div
          style={{
            padding: "20px 24px",
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* C. Need Input filter pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {(["all", "needInput"] as const).map((mode) => {
              const isActive = (mode === "needInput") === needInputMode;
              const label =
                mode === "all"
                  ? lang === "ko" ? "전체 · All" : "All · 전체"
                  : lang === "ko"
                  ? `입력 필요 · Need Input (${needInputCount})`
                  : `Need Input · 입력 필요 (${needInputCount})`;
              return (
                <button
                  key={mode}
                  onClick={() => {
                    const next = mode === "needInput";
                    setNeedInputMode(next);
                    if (next) {
                      // 모든 카테고리 expand
                      setCollapsedCategories(new Set());
                    }
                  }}
                  style={{
                    padding: "5px 14px",
                    borderRadius: "var(--radius-full)",
                    border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                    backgroundColor: isActive ? "var(--color-accent)" : "var(--color-card)",
                    color: isActive ? "var(--color-black)" : "var(--color-dim)",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font-display)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)";
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* C. Need Input 빈 결과 */}
          {needInputMode && needInputCount === 0 && (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "oklch(0.72 0.19 155)",
                fontSize: "14px",
                borderRadius: "var(--radius-lg)",
                border: "1px dashed oklch(0.72 0.19 155 / 0.3)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
              }}
            >
              🎉 {lang === "ko" ? "모든 필수 정보가 입력되었습니다!" : "All required info filled!"}
            </div>
          )}

          {Array.from(displayedGrouped.entries()).map(([cat, items]) => {
            const collapsed = collapsedCategories.has(cat);
            const catDone = items.filter((i) => i.is_complete).length;
            const allDone = catDone === items.length;

            return (
              <section key={cat}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginBottom: collapsed ? 0 : 10,
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: allDone ? "oklch(0.72 0.19 155)" : "var(--color-text)",
                      transition: "color 0.2s",
                    }}
                  >
                    {allDone ? "✓ " : ""}{cat}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: allDone ? "oklch(0.72 0.19 155 / 0.12)" : "var(--color-border)",
                      color: allDone ? "oklch(0.72 0.19 155)" : "oklch(0.65 0.01 280)",
                    }}
                  >
                    {catDone}/{items.length}
                  </span>
                  <span style={{ marginLeft: "auto", color: "oklch(0.65 0.01 280)", fontSize: "13px" }}>
                    {collapsed ? "▶" : "▼"}
                  </span>
                </button>

                {/* Items */}
                {!collapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        lang={lang}
                        email={email}
                        onUpdate={handleItemUpdate}
                        onUnauthorized={handleUnauthorized}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* ── Right: Updates Feed ── */}
        <div
          style={{
            padding: "20px 20px",
            position: "sticky",
            top: 56,
            height: "calc(100vh - 56px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* New update form */}
          <div
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
            }}
          >
            <NewUpdateForm email={email} onCreated={handleUpdateCreated} onUnauthorized={handleUnauthorized} />
          </div>

          {/* Open questions / blockers */}
          {openQuestions.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "oklch(0.63 0.2 25)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                ⚠ Open Questions & Blockers ({openQuestions.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {openQuestions.map((u) => (
                  <UpdateCard key={u.id} update={u} email={email} onResolve={handleResolve} onUnauthorized={handleUnauthorized} highlight />
                ))}
              </div>
            </div>
          )}

          {/* Recent updates */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--color-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Recent Updates
            </div>
            {recentUpdates.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "oklch(0.65 0.01 280)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  borderRadius: "var(--radius-lg)",
                  border: "1px dashed var(--color-border)",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: 8 }}>📭</div>
                아직 업데이트가 없습니다.
                <br />
                <span style={{ fontSize: "13px" }}>첫 메시지를 남겨보세요!</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentUpdates.map((u) => (
                  <UpdateCard key={u.id} update={u} email={email} onResolve={handleResolve} onUnauthorized={handleUnauthorized} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        @media (max-width: 1024px) {
          .launch-grid {
            grid-template-columns: 1fr !important;
          }
          .welcome-grid {
            grid-template-columns: 1fr !important;
          }
          .welcome-steps {
            grid-template-columns: 1fr 1fr !important;
          }
          .next-actions-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .welcome-steps {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
