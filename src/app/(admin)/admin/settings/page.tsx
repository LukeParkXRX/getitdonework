"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionType = "chemistry" | "standard" | "project";

interface SessionSetting {
  id: string;
  session_type: SessionType;
  label: string;
  credits_required: number;
  description: string;
  is_active: boolean;
}

interface ExpiryPolicy {
  default_days: number;
  grace_days: number;
}

interface RefundPolicy {
  id: string;
  condition: string;
  refund_pct: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_SETTINGS: SessionSetting[] = [
  { id: "1", session_type: "chemistry", credits_required: 0, label: "Chemistry Call", description: "첫 만남 — 무료 15분 세션", is_active: true },
  { id: "2", session_type: "standard",  credits_required: 2, label: "Standard Session",       description: "심화 상담 — 60분 세션",       is_active: true },
  { id: "3", session_type: "project",   credits_required: 5, label: "Project Consultation",   description: "프로젝트 단위 — 협의 세션",   is_active: true },
];

const INITIAL_EXPIRY: ExpiryPolicy = { default_days: 365, grace_days: 30 };

const INITIAL_REFUND: RefundPolicy[] = [
  { id: "r1", condition: "세션 24시간 전 취소", refund_pct: 100 },
  { id: "r2", condition: "세션 12시간 전 취소", refund_pct: 50 },
  { id: "r3", condition: "세션 12시간 이내 취소", refund_pct: 0 },
];

// ─── Shared style helpers ─────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "oklch(0.14 0.005 280 / 0.5)",
  border: "1px solid var(--color-border)",
  borderRadius: 14,
  padding: "28px 28px 24px",
  marginBottom: 24,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  fontFamily: "var(--font-display)",
  color: "var(--color-text)",
  letterSpacing: "-0.02em",
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  background: "oklch(0.14 0.005 280 / 0.6)",
  border: "1px solid var(--color-border)",
  borderRadius: 7,
  color: "var(--color-text)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  padding: "6px 10px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--color-dim)",
  fontFamily: "var(--font-display)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 6,
  display: "block",
};

const saveBtn: React.CSSProperties = {
  background: "var(--color-accent)",
  border: "none",
  borderRadius: 8,
  color: "var(--color-black)",
  cursor: "pointer",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: "0.04em",
  padding: "7px 18px",
  transition: "opacity 0.15s",
  whiteSpace: "nowrap",
};

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        cursor: "pointer",
        background: checked ? "var(--color-accent)" : "oklch(0.28 0.005 280)",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 20 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

// ─── Section A: 세션 유형별 토큰 설정 ────────────────────────────────────────

function SessionTokenSettings() {
  const { success } = useToast();
  const [rows, setRows] = useState<SessionSetting[]>(INITIAL_SETTINGS);
  const [editId, setEditId] = useState<string | null>(null);

  const update = (id: string, field: keyof SessionSetting, value: unknown) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = (id: string) => {
    setEditId(null);
    success("세션 설정이 저장되었습니다.");
  };

  const SESSION_TYPE_BADGE: Record<SessionType, { bg: string; color: string }> = {
    chemistry: { bg: "oklch(0.28 0.08 150)", color: "oklch(0.78 0.18 150)" },
    standard:  { bg: "oklch(0.28 0.08 245)", color: "oklch(0.78 0.18 245)" },
    project:   { bg: "oklch(0.32 0.1 50)",   color: "oklch(0.82 0.18 50)"  },
  };

  return (
    <section style={card}>
      <h2 style={sectionTitle}>세션 유형별 토큰 설정</h2>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr>
              {["유형", "레이블", "토큰 비용", "설명", "활성", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-dim)",
                    textAlign: "left",
                    padding: "0 12px 12px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isEditing = editId === row.id;
              const badge = SESSION_TYPE_BADGE[row.session_type];
              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: i < rows.length - 1 ? "1px solid oklch(0.22 0.005 280)" : "none",
                  }}
                >
                  {/* 유형 */}
                  <td style={{ padding: "14px 12px" }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "var(--font-display)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: 5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.session_type}
                    </span>
                  </td>

                  {/* 레이블 */}
                  <td style={{ padding: "14px 12px", minWidth: 160 }}>
                    {isEditing ? (
                      <input
                        style={inputStyle}
                        value={row.label}
                        onChange={(e) => update(row.id, "label", e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => setEditId(row.id)}
                        style={{
                          fontSize: 14,
                          color: "var(--color-text)",
                          cursor: "pointer",
                          borderBottom: "1px dashed oklch(0.4 0.005 280)",
                          paddingBottom: 1,
                        }}
                      >
                        {row.label}
                      </span>
                    )}
                  </td>

                  {/* 토큰 비용 */}
                  <td style={{ padding: "14px 12px", width: 120 }}>
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        style={{ ...inputStyle, width: 80 }}
                        value={row.credits_required}
                        onChange={(e) => update(row.id, "credits_required", Math.max(0, parseInt(e.target.value) || 0))}
                      />
                    ) : (
                      <span
                        onClick={() => setEditId(row.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 14,
                          fontWeight: 600,
                          color: row.credits_required === 0 ? "oklch(0.72 0.18 150)" : "var(--color-accent)",
                          cursor: "pointer",
                        }}
                      >
                        {row.credits_required === 0 ? "무료" : `${row.credits_required} 크레딧`}
                      </span>
                    )}
                  </td>

                  {/* 설명 */}
                  <td style={{ padding: "14px 12px", minWidth: 200 }}>
                    {isEditing ? (
                      <input
                        style={inputStyle}
                        value={row.description}
                        onChange={(e) => update(row.id, "description", e.target.value)}
                      />
                    ) : (
                      <span
                        onClick={() => setEditId(row.id)}
                        style={{
                          fontSize: 13,
                          color: "var(--color-dim)",
                          cursor: "pointer",
                          borderBottom: "1px dashed oklch(0.3 0.005 280)",
                          paddingBottom: 1,
                        }}
                      >
                        {row.description}
                      </span>
                    )}
                  </td>

                  {/* 활성 */}
                  <td style={{ padding: "14px 12px" }}>
                    <Toggle
                      checked={row.is_active}
                      onChange={(v) => update(row.id, "is_active", v)}
                    />
                  </td>

                  {/* 저장 */}
                  <td style={{ padding: "14px 12px" }}>
                    {isEditing ? (
                      <button
                        style={saveBtn}
                        onClick={() => handleSave(row.id)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                      >
                        저장
                      </button>
                    ) : (
                      <button
                        style={{
                          ...saveBtn,
                          background: "transparent",
                          color: "var(--color-dim)",
                          border: "1px solid var(--color-border)",
                        }}
                        onClick={() => setEditId(row.id)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)"; }}
                      >
                        편집
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Section B: 토큰 유효기간 정책 ───────────────────────────────────────────

function ExpiryPolicySettings() {
  const { success } = useToast();
  const [policy, setPolicy] = useState<ExpiryPolicy>(INITIAL_EXPIRY);

  const handleSave = () => {
    success("유효기간 정책이 저장되었습니다.");
  };

  return (
    <section style={card}>
      <h2 style={sectionTitle}>토큰 유효기간 정책</h2>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
        {/* Default expiry */}
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <label style={labelStyle}>기본 유효기간</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={1}
              style={{ ...inputStyle, width: 90 }}
              value={policy.default_days}
              onChange={(e) =>
                setPolicy((p) => ({ ...p, default_days: Math.max(1, parseInt(e.target.value) || 1) }))
              }
            />
            <span style={{ fontSize: 13, color: "var(--color-dim)", whiteSpace: "nowrap" }}>일</span>
          </div>
        </div>

        {/* Grace period */}
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <label style={labelStyle}>Grace Period</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={0}
              style={{ ...inputStyle, width: 90 }}
              value={policy.grace_days}
              onChange={(e) =>
                setPolicy((p) => ({ ...p, grace_days: Math.max(0, parseInt(e.target.value) || 0) }))
              }
            />
            <span style={{ fontSize: 13, color: "var(--color-dim)", whiteSpace: "nowrap" }}>일</span>
          </div>
        </div>

        <div style={{ paddingBottom: 2 }}>
          <button
            style={saveBtn}
            onClick={handleSave}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            저장
          </button>
        </div>
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 13,
          color: "var(--color-dim)",
          padding: "10px 14px",
          background: "oklch(0.18 0.008 245 / 0.4)",
          borderLeft: "3px solid var(--color-accent)",
          borderRadius: "0 6px 6px 0",
        }}
      >
        유효기간이 지난 토큰은 grace period 이후 자동 만료됩니다
      </p>
    </section>
  );
}

// ─── Section C: 환불 정책 ─────────────────────────────────────────────────────

function RefundPolicySettings() {
  const { success } = useToast();
  const [rows, setRows] = useState<RefundPolicy[]>(INITIAL_REFUND);
  const [editId, setEditId] = useState<string | null>(null);

  const update = (id: string, field: keyof RefundPolicy, value: unknown) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = () => {
    setEditId(null);
    success("환불 정책이 저장되었습니다.");
  };

  const getRefundColor = (pct: number) => {
    if (pct >= 100) return "oklch(0.72 0.18 150)";
    if (pct >= 50)  return "oklch(0.78 0.18 70)";
    return "oklch(0.65 0.22 25)";
  };

  return (
    <section style={card}>
      <h2 style={sectionTitle}>환불 정책</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row) => {
          const isEditing = editId === row.id;
          return (
            <div
              key={row.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 16px",
                background: "oklch(0.11 0.005 280 / 0.5)",
                borderRadius: 10,
                border: "1px solid var(--color-border)",
                flexWrap: "wrap",
              }}
            >
              {/* Condition */}
              <div style={{ flex: "1 1 220px", minWidth: 180 }}>
                {isEditing ? (
                  <>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>조건</label>
                    <input
                      style={inputStyle}
                      value={row.condition}
                      onChange={(e) => update(row.id, "condition", e.target.value)}
                      autoFocus
                    />
                  </>
                ) : (
                  <span
                    onClick={() => setEditId(row.id)}
                    style={{
                      fontSize: 14,
                      color: "var(--color-text)",
                      cursor: "pointer",
                      borderBottom: "1px dashed oklch(0.4 0.005 280)",
                      paddingBottom: 1,
                    }}
                  >
                    {row.condition}
                  </span>
                )}
              </div>

              {/* Refund % */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {isEditing ? (
                  <>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>환불률</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      style={{ ...inputStyle, width: 70 }}
                      value={row.refund_pct}
                      onChange={(e) =>
                        update(row.id, "refund_pct", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))
                      }
                    />
                    <span style={{ fontSize: 13, color: "var(--color-dim)" }}>%</span>
                  </>
                ) : (
                  <span
                    onClick={() => setEditId(row.id)}
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      color: getRefundColor(row.refund_pct),
                      cursor: "pointer",
                      minWidth: 70,
                    }}
                  >
                    {row.refund_pct === 0 ? "환불 불가" : `${row.refund_pct}% 환불`}
                  </span>
                )}
              </div>

              {/* Save / Edit button */}
              <div style={{ flexShrink: 0 }}>
                {isEditing ? (
                  <button
                    style={saveBtn}
                    onClick={handleSave}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                  >
                    저장
                  </button>
                ) : (
                  <button
                    style={{
                      ...saveBtn,
                      background: "transparent",
                      color: "var(--color-dim)",
                      border: "1px solid var(--color-border)",
                    }}
                    onClick={() => setEditId(row.id)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)"; }}
                  >
                    편집
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 12,
          color: "var(--color-dim)",
        }}
      >
        환불 정책은 세션 예약 시 사용자에게 고지되며, 변경 시 기존 예약에는 소급 적용되지 않습니다.
      </p>
    </section>
  );
}

// ─── Section D: 테스트 패널 어드민 Override ──────────────────────────────────

function TestPanelToggle() {
  const { success } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabled(localStorage.getItem("__admin_test_mode") === "on");
    setMounted(true);
  }, []);

  const handleToggle = (next: boolean) => {
    setEnabled(next);
    if (next) {
      localStorage.setItem("__admin_test_mode", "on");
      success("테스트 패널 활성화됨 — 로그인 페이지를 새로고침하면 패널이 표시됩니다.");
    } else {
      localStorage.removeItem("__admin_test_mode");
      success("테스트 패널 비활성화됨.");
    }
  };

  if (!mounted) return null;

  const isProd =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  return (
    <section style={card}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ ...sectionTitle, marginBottom: 6 }}>테스트 로그인 패널</h2>
          <p style={{ fontSize: 13, color: "var(--color-dim)", margin: 0, lineHeight: 1.6 }}>
            로그인 페이지에 시드 계정 퀵로그인 패널을 표시합니다.
            <br />
            이 브라우저에만 적용되며 다른 사용자에게는 영향 없습니다.
          </p>
          {isProd && (
            <p
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "oklch(0.72 0.18 60)",
                padding: "7px 12px",
                background: "oklch(0.55 0.15 60 / 0.08)",
                borderLeft: "3px solid oklch(0.55 0.15 60 / 0.5)",
                borderRadius: "0 6px 6px 0",
              }}
            >
              운영 환경 — 기본적으로 패널이 차단되어 있습니다. 이 토글로 이 브라우저에서만 임시 해제 가능합니다.
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, paddingTop: 2 }}>
          <span
            style={{
              fontSize: 12,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: enabled ? "oklch(0.72 0.18 150)" : "var(--color-dim)",
              letterSpacing: "0.04em",
            }}
          >
            {enabled ? "ON" : "OFF"}
          </span>
          <Toggle checked={enabled} onChange={handleToggle} />
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            color: "var(--color-text)",
            letterSpacing: "-0.03em",
            margin: 0,
            marginBottom: 6,
          }}
        >
          시스템 설정
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-dim)", margin: 0 }}>
          크레딧 비용, 유효기간 정책, 환불 정책을 관리합니다. super_admin 전용 페이지입니다.
        </p>
      </div>

      {/* Sections */}
      <TestPanelToggle />
      <SessionTokenSettings />
      <ExpiryPolicySettings />
      <RefundPolicySettings />
    </div>
  );
}
