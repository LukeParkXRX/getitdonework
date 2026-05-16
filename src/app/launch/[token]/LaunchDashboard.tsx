"use client";

import { useState, useCallback, useRef } from "react";

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
  token: string;
  initialChecklist: ChecklistItem[];
  initialUpdates: LaunchUpdate[];
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
  token: string;
  onUpdate: (updated: ChecklistItem) => void;
}

function ItemCard({ item, lang, token, onUpdate }: ItemCardProps) {
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
        const res = await fetch(`/api/launch/${token}/checklist/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const json = (await res.json()) as { item: ChecklistItem };
          onUpdate(json.item);
        }
      } finally {
        setSaving(false);
      }
    },
    [token, item.id, onUpdate]
  );

  const handleToggle = () => {
    const newVal = !item.is_complete;
    // Optimistic update
    onUpdate({ ...item, is_complete: newVal, completed_at: newVal ? new Date().toISOString() : null });
    void patchItem({ is_complete: newVal, completed_by: "US Partner" });
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
            <span style={{ fontSize: "12px", color: "var(--color-dim)" }}>{altTitle}</span>
            {saving && (
              <span style={{ fontSize: "11px", color: "var(--color-dim)" }}>저장 중...</span>
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
                color: "var(--color-dim)",
                fontSize: "11px",
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
              <span style={{ fontSize: "11px", color: "oklch(0.72 0.19 155)" }}>
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
            <p style={{ fontSize: "13px", color: "var(--color-dim)", marginBottom: 10, lineHeight: 1.5, margin: "0 0 10px 0" }}>
              {description}
            </p>
          )}

          {/* Value field */}
          {item.needs_value && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: "11px", color: "var(--color-dim)", display: "block", marginBottom: 4, fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {item.value_label ?? "Value"}
                {item.value_is_secret && (
                  <span style={{ marginLeft: 6, color: "oklch(0.63 0.2 25)", fontSize: "10px" }}>SECRET</span>
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
                    padding: "7px 10px",
                    fontSize: "13px",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-mono)",
                    outline: "none",
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
            <label style={{ fontSize: "11px", color: "var(--color-dim)", display: "block", marginBottom: 4, fontFamily: "var(--font-display)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
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
                padding: "7px 10px",
                fontSize: "13px",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
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
  token: string;
  onResolve: (id: string) => void;
  highlight?: boolean;
}

function UpdateCard({ update, token, onResolve, highlight }: UpdateCardProps) {
  const [resolving, setResolving] = useState(false);
  const roleStyle = AUTHOR_ROLE_STYLES[update.author_role];
  const typeStyle = UPDATE_TYPE_STYLES[update.type];

  const handleResolve = async () => {
    setResolving(true);
    try {
      const res = await fetch(`/api/launch/${token}/updates/${update.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      });
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
        <span style={{ fontSize: "11px", color: "var(--color-dim)", marginLeft: "auto" }}>
          {formatRelativeTime(update.created_at)}
        </span>
      </div>

      <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, marginBottom: 6, color: "var(--color-text)" }}>
        {update.title}
      </div>

      <div
        style={{ fontSize: "13px", color: "var(--color-dim)", lineHeight: 1.55, whiteSpace: "pre-wrap", marginBottom: 10 }}
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
  token: string;
  onCreated: (update: LaunchUpdate) => void;
}

function NewUpdateForm({ token, onCreated }: NewUpdateFormProps) {
  const [authorRole, setAuthorRole] = useState<"korea_dev" | "us_partner">("us_partner");
  const [authorName, setAuthorName] = useState("US Partner");
  const [type, setType] = useState<"daily" | "feedback" | "question" | "blocker" | "milestone">("feedback");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRoleChange = (role: "korea_dev" | "us_partner") => {
    setAuthorRole(role);
    setAuthorName(role === "korea_dev" ? "Korea Dev (Claude)" : "US Partner");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/launch/${token}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author_name: authorName, author_role: authorRole, type, title, body }),
      });
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
    padding: "7px 10px",
    fontSize: "13px",
    color: "var(--color-text)",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--color-text)", marginBottom: 2 }}>
        새 업데이트 작성
      </div>

      {/* Author role */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["us_partner", "korea_dev"] as const).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => handleRoleChange(role)}
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

export function LaunchDashboard({ token, initialChecklist, initialUpdates }: Props) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [updates, setUpdates] = useState<LaunchUpdate[]>(initialUpdates);
  const [lang, setLang] = useState<"ko" | "en">("en");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [copyDone, setCopyDone] = useState(false);

  const grouped = groupByCategory(checklist);
  const totalCount = checklist.length;
  const doneCount = checklist.filter((i) => i.is_complete).length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const lastActivity = updates.length > 0 ? updates[0].created_at : null;

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
          <span style={{ fontSize: "13px", color: "var(--color-dim)" }}>Launch Dashboard</span>
          {lastActivity && (
            <>
              <span style={{ color: "var(--color-border)" }}>·</span>
              <span style={{ fontSize: "12px", color: "var(--color-dim)" }}>
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

          {/* Progress counter */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--color-text)" }}>
              {doneCount}
            </span>
            <span style={{ fontSize: "13px", color: "var(--color-dim)" }}>/ {totalCount}</span>
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
        </div>
      </header>

      {/* ── Hero Progress Section ── */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--color-border)" }}>
        {/* Overall bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--color-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Overall Progress
            </span>
            <span style={{ fontSize: "13px", color: "var(--color-dim)" }}>{doneCount} of {totalCount} complete</span>
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
                  <span style={{ fontSize: "11px", color: "var(--color-dim)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                    {cat.split(".")[1]?.trim() ?? cat}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--color-dim)" }}>{catDone}/{items.length}</span>
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
          {Array.from(grouped.entries()).map(([cat, items]) => {
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
                      color: allDone ? "oklch(0.72 0.19 155)" : "var(--color-dim)",
                    }}
                  >
                    {catDone}/{items.length}
                  </span>
                  <span style={{ marginLeft: "auto", color: "var(--color-dim)", fontSize: "13px" }}>
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
                        token={token}
                        onUpdate={handleItemUpdate}
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
            <NewUpdateForm token={token} onCreated={handleUpdateCreated} />
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
                  <UpdateCard key={u.id} update={u} token={token} onResolve={handleResolve} highlight />
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
                  color: "var(--color-dim)",
                  fontSize: "13px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px dashed var(--color-border)",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: 8 }}>📭</div>
                아직 업데이트가 없습니다.
                <br />
                <span style={{ fontSize: "12px" }}>첫 메시지를 남겨보세요!</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentUpdates.map((u) => (
                  <UpdateCard key={u.id} update={u} token={token} onResolve={handleResolve} />
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
        }
      `}</style>
    </div>
  );
}
