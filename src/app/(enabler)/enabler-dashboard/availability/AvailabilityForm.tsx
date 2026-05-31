"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_TIMEZONE = "America/New_York";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];
type DaySlot = { enabled: boolean; slots: string[] };

export type Availability = {
  weekly: Record<DayKey, DaySlot>;
  timezone: string;
  notes: string;
};

const SLOT_PATTERN = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--color-dark)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  padding: "10px 12px",
  color: "var(--color-text)",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
  width: "100%",
  outline: "none",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  padding: "20px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-dim)",
  marginBottom: "8px",
};

export default function AvailabilityForm({ initial }: { initial: Availability }) {
  const router = useRouter();
  const [weekly, setWeekly] = useState<Record<DayKey, DaySlot>>(initial.weekly);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [notes, setNotes] = useState(initial.notes);

  // Auto-detect the browser timezone as the initial value when nothing was
  // saved yet (the server falls back to DEFAULT_TIMEZONE in that case).
  const autoDetected = useRef(false);
  useEffect(() => {
    if (autoDetected.current) return;
    autoDetected.current = true;
    if (initial.timezone !== DEFAULT_TIMEZONE) return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && detected !== initial.timezone) {
      setTimezone(detected);
    }
  }, [initial.timezone]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function toggleDay(day: DayKey) {
    setWeekly((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  }

  function addSlot(day: DayKey) {
    setWeekly((prev) => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, ""] },
    }));
  }

  function updateSlot(day: DayKey, idx: number, value: string) {
    setWeekly((prev) => {
      const next = [...prev[day].slots];
      next[idx] = value;
      return { ...prev, [day]: { ...prev[day], slots: next } };
    });
  }

  function removeSlot(day: DayKey, idx: number) {
    setWeekly((prev) => ({
      ...prev,
      [day]: { ...prev[day], slots: prev[day].slots.filter((_, i) => i !== idx) },
    }));
  }

  async function handleSave() {
    // 검증
    for (const { key, label } of DAYS) {
      if (!weekly[key].enabled) continue;
      for (const slot of weekly[key].slots) {
        const trimmed = slot.trim();
        if (trimmed && !SLOT_PATTERN.test(trimmed)) {
          setMessage({ type: "err", text: `${label}: "${trimmed}" is invalid (e.g., 09:00-12:00)` });
          return;
        }
      }
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/users/me/enabler/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekly, timezone, notes }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Save failed (${res.status})`);
      }
      setMessage({ type: "ok", text: "Saved" });
      // 저장 성공 → 대시보드로 복귀 (저장됐다는 인지 + 화면 빠져나오기)
      router.push("/enabler-dashboard");
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error while saving" });
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {DAYS.map(({ key, label }) => {
        const day = weekly[key];
        return (
          <div key={key} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: day.enabled ? "16px" : 0 }}>
              <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-display)" }}>{label}</span>
              <button
                type="button"
                onClick={() => toggleDay(key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: day.enabled ? "var(--color-accent)" : "var(--color-border)",
                  backgroundColor: day.enabled ? "var(--color-accent)" : "transparent",
                  color: day.enabled ? "oklch(0.1 0 0)" : "var(--color-dim)",
                  fontSize: "12px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {day.enabled ? "On" : "Off"}
              </button>
            </div>
            {day.enabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {day.slots.length === 0 && (
                  <p style={{ color: "var(--color-dim)", fontSize: "13px", margin: 0 }}>No time ranges yet. Add one below.</p>
                )}
                {day.slots.map((slot, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="09:00-12:00"
                      value={slot}
                      onChange={(e) => updateSlot(key, idx, e.target.value)}
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(key, idx)}
                      aria-label="Remove time range"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "transparent",
                        color: "var(--color-dim)",
                        cursor: "pointer",
                        fontSize: "16px",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSlot(key)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px dashed var(--color-border)",
                    backgroundColor: "transparent",
                    color: "var(--color-dim)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                  }}
                >
                  + Add time range
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div style={cardStyle}>
        <label style={labelStyle}>Timezone</label>
        <input
          type="text"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="e.g., America/New_York"
          style={inputStyle}
        />
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>Notes</label>
        <textarea
          rows={3}
          maxLength={300}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes for startups (max 300 characters)"
          style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-body)" }}
        />
      </div>

      {message && (
        <div
          role="status"
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            backgroundColor: message.type === "ok" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${message.type === "ok" ? "var(--color-green)" : "var(--color-red)"}`,
            color: message.type === "ok" ? "var(--color-green)" : "var(--color-red)",
            fontSize: "13px",
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
        <button
          type="button"
          onClick={() => router.push("/enabler-dashboard")}
          disabled={saving}
          style={{
            padding: "10px 22px",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            backgroundColor: "transparent",
            color: "var(--color-text)",
            fontSize: "14px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 22px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "var(--color-accent)",
            color: "oklch(0.1 0 0)",
            fontSize: "14px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
