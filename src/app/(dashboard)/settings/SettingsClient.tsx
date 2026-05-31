"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationPrefs {
  session: boolean;
  credit: boolean;
  marketing: boolean;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  notification_prefs: NotificationPrefs | null;
}

interface StartupProfileData {
  company_name: string;
  industry: string[];
  stage: string;
  us_goal: string;
}

interface SettingsClientProps {
  user: UserData;
  profile: StartupProfileData | null;
}

interface FormState {
  fullName: string;
  email: string;
  companyName: string;
  industry: string;
  stage: string;
  usGoal: string;
  notifySession: boolean;
  notifyCredit: boolean;
  notifyMarketing: boolean;
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: checked ? "var(--color-accent)" : "var(--color-border)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background-color 0.2s",
        outline: "none",
      }}
      aria-checked={checked}
      role="switch"
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 17,
          color: "var(--color-text)",
          margin: 0,
          paddingBottom: 16,
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: 15,
          color: "var(--color-text)",
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--color-dim)",
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

// ── Input styles ──────────────────────────────────────────────────────────────

const inputBaseStyle: React.CSSProperties = {
  backgroundColor: "var(--color-dark)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-text)",
  padding: "10px 14px",
  fontSize: 16,
  fontFamily: "var(--font-body)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const inputDisabledStyle: React.CSSProperties = {
  ...inputBaseStyle,
  color: "var(--color-dim)",
  cursor: "not-allowed",
  opacity: 0.7,
};

// ── Main Client Component ──────────────────────────────────────────────────────

export default function SettingsClient({ user, profile }: SettingsClientProps) {
  const t = useTranslations("Settings");
  const tc = useTranslations("Common");
  const { success, error: showError } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 계정 삭제 관련 state
  const [deletionScheduledFor, setDeletionScheduledFor] = useState<string | null>(null);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false);

  // 삭제 요청 현황 로드
  useEffect(() => {
    fetch("/api/users/me/delete")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { scheduled_for?: string } | null) => {
        if (data?.scheduled_for) setDeletionScheduledFor(data.scheduled_for);
      })
      .catch(() => null);
  }, []);

  async function handleDownloadData() {
    setDownloadingData(true);
    try {
      const res = await fetch("/api/users/me/data");
      if (!res.ok) { showError(t("downloadDataError")); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      success(t("downloadDataSuccess"));
    } catch {
      showError(t("downloadDataException"));
    } finally {
      setDownloadingData(false);
    }
  }

  async function handleRequestDeletion() {
    if (deleteEmailInput !== user.email) {
      showError(t("emailMismatch"));
      return;
    }
    setDeletionLoading(true);
    try {
      const res = await fetch("/api/users/me/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason || undefined }),
      });
      if (!res.ok) { showError(t("deletionRequestError")); return; }
      const data = (await res.json()) as { scheduled_for: string };
      setDeletionScheduledFor(data.scheduled_for);
      setDeleteConfirmOpen(false);
      setDeleteEmailInput("");
      setDeleteReason("");
      success(t("deletionRequestSuccess"));
    } catch {
      showError(t("genericError"));
    } finally {
      setDeletionLoading(false);
    }
  }

  async function handleCancelDeletion() {
    setDeletionLoading(true);
    try {
      const res = await fetch("/api/users/me/delete", { method: "DELETE" });
      if (!res.ok) { showError(t("cancelDeletionError")); return; }
      setDeletionScheduledFor(null);
      success(t("cancelDeletionSuccess"));
    } catch {
      showError(t("genericError"));
    } finally {
      setDeletionLoading(false);
    }
  }

  const initialForm: FormState = {
    fullName: user.full_name,
    email: user.email,
    companyName: profile?.company_name ?? "",
    industry: (profile?.industry ?? []).join(", "),
    stage: profile?.stage ?? "",
    usGoal: profile?.us_goal ?? "",
    notifySession: user.notification_prefs?.session ?? true,
    notifyCredit: user.notification_prefs?.credit ?? true,
    notifyMarketing: user.notification_prefs?.marketing ?? false,
  };

  const [form, setForm] = useState<FormState>(initialForm);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          ...(user.role === "startup" && {
            companyName: form.companyName,
            industry: form.industry,
            stage: form.stage,
            usGoal: form.usGoal,
          }),
          notificationPrefs: {
            session: form.notifySession,
            credit: form.notifyCredit,
            marketing: form.notifyMarketing,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        showError(body.error ?? t("saveError"));
        return;
      }
      success(t("saveSuccess"));
    } catch {
      showError(t("networkError"));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm(initialForm);
  }

  function inputStyle(fieldName: string): React.CSSProperties {
    return {
      ...inputBaseStyle,
      borderColor:
        focusedField === fieldName
          ? "var(--color-accent)"
          : "var(--color-border)",
      transition: "border-color 0.15s",
    };
  }

  const joinedDate = new Date(user.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-black)",
      }}
    >
      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "40px 24px 120px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 28,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            {t("pageTitle")}
          </h1>
          <Link
            href="/settings/security"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-dim)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              backgroundColor: "var(--color-dark)",
              transition: "color 0.15s",
            }}
          >
            {t("securitySettings")}
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Left-right layout */}
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            {/* ── Left: Profile card ──────────────────────────────────────── */}
            <div
              style={{
                width: 340,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Avatar card */}
              <div
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-dark)",
                    border: "2px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 24,
                    color: "var(--color-accent)",
                  }}
                >
                  {user.full_name.charAt(0).toUpperCase()}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 18,
                      color: "var(--color-text)",
                    }}
                  >
                    {user.full_name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 15,
                      color: "var(--color-dim)",
                    }}
                  >
                    {user.email}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 4,
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--color-accent)",
                      backgroundColor: "oklch(0.87 0.2 130 / 0.12)",
                      padding: "2px 10px",
                      borderRadius: 9999,
                    }}
                  >
                    {user.role === "startup" ? t("roleStartup") : user.role === "enabler" ? t("roleEnabler") : user.role}
                  </span>
                </div>

                <button
                  type="button"
                  disabled
                  style={{
                    marginTop: 4,
                    width: "100%",
                    padding: "9px 0",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    backgroundColor: "transparent",
                    color: "var(--color-dim)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: 15,
                    cursor: "not-allowed",
                    opacity: 0.5,
                  }}
                  title={t("changeProfileImageSoon")}
                >
                  {t("changeProfileImageSoon")}
                </button>
              </div>

              {/* Account info card */}
              <div
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--color-text)",
                    margin: 0,
                  }}
                >
                  {t("accountInfo")}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        color: "var(--color-dim)",
                      }}
                    >
                      {t("joinedDate")}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 14,
                        color: "var(--color-text)",
                      }}
                    >
                      {joinedDate}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        color: "var(--color-dim)",
                      }}
                    >
                      {t("verificationStatus")}
                    </span>
                    {user.is_verified ? (
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--color-green)",
                          backgroundColor: "oklch(0.72 0.2 145 / 0.12)",
                          padding: "2px 8px",
                          borderRadius: 9999,
                        }}
                      >
                        {t("verified")}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "var(--color-dim)",
                          backgroundColor: "var(--color-dark)",
                          padding: "2px 8px",
                          borderRadius: 9999,
                        }}
                      >
                        {t("notVerified")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Edit forms ───────────────────────────────────────── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Section 1: 기본 정보 */}
              <Section title={t("profileSection")}>
                <Field label={t("fullName")}>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    onFocus={() => setFocusedField("fullName")}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle("fullName")}
                    placeholder={t("fullNamePlaceholder")}
                  />
                </Field>
                <Field
                  label={t("email")}
                  hint={t("emailHint")}
                >
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    style={inputDisabledStyle}
                  />
                </Field>
              </Section>

              {/* Section 2: 스타트업 정보 (startup role only) */}
              {user.role === "startup" && (
                <Section title={t("startupSection")}>
                  <Field label={t("companyName")}>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setField("companyName", e.target.value)}
                      onFocus={() => setFocusedField("companyName")}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle("companyName")}
                      placeholder={t("companyNamePlaceholder")}
                    />
                  </Field>

                  <Field
                    label={t("industryField")}
                    hint={t("industryHint")}
                  >
                    <input
                      type="text"
                      value={form.industry}
                      onChange={(e) => setField("industry", e.target.value)}
                      onFocus={() => setFocusedField("industry")}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle("industry")}
                      placeholder="Fintech, Payments"
                    />
                    {/* Tag preview */}
                    {form.industry.trim() && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                        {form.industry
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontFamily: "var(--font-body)",
                                fontWeight: 500,
                                fontSize: 13,
                                color: "var(--color-dim)",
                                backgroundColor: "var(--color-dark)",
                                border: "1px solid var(--color-border)",
                                padding: "2px 9px",
                                borderRadius: 9999,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
                  </Field>

                  <Field label={t("stage")}>
                    <select
                      value={form.stage}
                      onChange={(e) => setField("stage", e.target.value)}
                      onFocus={() => setFocusedField("stage")}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        ...inputStyle("stage"),
                        appearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                        paddingRight: 36,
                        cursor: "pointer",
                      }}
                    >
                      <option value="">{t("stagePlaceholder")}</option>
                      <option value="Seed">Seed</option>
                      <option value="Pre-A">Pre-A</option>
                      <option value="Series A">Series A</option>
                      <option value="Series B">Series B</option>
                    </select>
                  </Field>

                  <Field label={t("usGoalLabel")}>
                    <textarea
                      value={form.usGoal}
                      onChange={(e) => setField("usGoal", e.target.value)}
                      onFocus={() => setFocusedField("usGoal")}
                      onBlur={() => setFocusedField(null)}
                      rows={4}
                      style={{
                        ...inputStyle("usGoal"),
                        resize: "vertical",
                        lineHeight: 1.6,
                      }}
                      placeholder={t("usGoalPlaceholder")}
                    />
                  </Field>
                </Section>
              )}

              {/* Enabler: 프로필 편집 안내 */}
              {user.role === "enabler" && (
                <Section title={t("enablerSection")}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 15,
                      color: "var(--color-dim)",
                      margin: 0,
                    }}
                  >
                    {t("enablerProfileNotePrefix")}{" "}
                    <a
                      href="/enabler-dashboard/profile"
                      style={{ color: "var(--color-accent)", textDecoration: "underline" }}
                    >
                      {t("enablerDashboardLink")}
                    </a>
                    {t("enablerProfileNoteSuffix")}
                  </p>
                </Section>
              )}

              {/* Section 3: 알림 설정 */}
              <Section title={t("notificationSection")}>
                {[
                  {
                    key: "notifySession" as const,
                    label: t("notifySession"),
                    desc: t("notifySessionDesc"),
                  },
                  {
                    key: "notifyCredit" as const,
                    label: t("notifyCredit"),
                    desc: t("notifyCreditDesc"),
                  },
                  {
                    key: "notifyMarketing" as const,
                    label: t("notifyMarketing"),
                    desc: t("notifyMarketingDesc"),
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: 16,
                          color: "var(--color-text)",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 14,
                          color: "var(--color-dim)",
                        }}
                      >
                        {desc}
                      </span>
                    </div>
                    <Toggle
                      checked={form[key]}
                      onChange={(v) => setField(key, v)}
                    />
                  </div>
                ))}
              </Section>

              {/* Section 4: 계정 */}
              <Section title={t("dangerSection")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* 데이터 다운로드 */}
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-dim)", margin: "0 0 8px" }}>
                      {t("downloadDataDesc")}
                    </p>
                    <button
                      type="button"
                      disabled={downloadingData}
                      onClick={handleDownloadData}
                      style={{
                        alignSelf: "flex-start",
                        padding: "9px 18px",
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        backgroundColor: "transparent",
                        color: "var(--color-text)",
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        fontSize: 15,
                        cursor: downloadingData ? "not-allowed" : "pointer",
                        opacity: downloadingData ? 0.6 : 1,
                      }}
                    >
                      {downloadingData ? t("downloading") : t("downloadDataBtn")}
                    </button>
                  </div>

                  <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

                  {/* 2단계 인증 안내 */}
                  <div>
                    <p style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--color-text)",
                      margin: "0 0 4px",
                    }}>
                      {t("twoFactorTitle")}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-dim)", margin: 0, lineHeight: 1.6 }}>
                      {t("twoFactorDesc")}
                      <br />
                      <span style={{ color: "oklch(0.5 0 0)" }}>{t("twoFactorNote")}</span>
                    </p>
                  </div>

                  <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

                  {/* 계정 삭제 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {deletionScheduledFor ? (
                      <>
                        <div style={{
                          padding: "12px 16px",
                          borderRadius: 8,
                          backgroundColor: "oklch(0.55 0.2 25 / 0.08)",
                          border: "1px solid oklch(0.55 0.2 25 / 0.3)",
                        }}>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-red)", margin: "0 0 4px", fontWeight: 600 }}>
                            {t("deletionScheduledTitle")}
                          </p>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-dim)", margin: 0 }}>
                            {t("deletionScheduledOn", { date: new Date(deletionScheduledFor).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) })}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={deletionLoading}
                          onClick={handleCancelDeletion}
                          style={{
                            alignSelf: "flex-start",
                            padding: "9px 18px",
                            borderRadius: 8,
                            border: "1px solid var(--color-border)",
                            backgroundColor: "transparent",
                            color: "var(--color-text)",
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            fontSize: 15,
                            cursor: deletionLoading ? "not-allowed" : "pointer",
                            opacity: deletionLoading ? 0.6 : 1,
                          }}
                        >
                          {deletionLoading ? t("processing") : t("cancelDeletionBtn")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          style={{
                            alignSelf: "flex-start",
                            padding: "9px 18px",
                            borderRadius: 8,
                            border: "1px solid oklch(0.55 0.2 25 / 0.4)",
                            backgroundColor: "transparent",
                            color: "var(--color-red)",
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            fontSize: 15,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.55 0.2 25 / 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                          }}
                          onClick={() => setDeleteConfirmOpen(true)}
                        >
                          {t("deleteAccount")}
                        </button>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-dim)" }}>
                          {t("deleteAccountGracePeriod")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Section>
            </div>
          </div>

          {/* ── Bottom action bar ─────────────────────────────────────────── */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              backgroundColor: "var(--color-dark)",
              borderTop: "1px solid var(--color-border)",
              padding: "16px 24px",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                backgroundColor: "transparent",
                color: "var(--color-text)",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 16,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 28px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-black)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? tc("saving") : t("saveChanges")}
            </button>
          </div>
        </form>
      </main>

      {/* 계정 삭제 확인 모달 — 이메일 직접 입력 */}
      {deleteConfirmOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              backgroundColor: "oklch(0.08 0 0 / 0.75)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => { setDeleteConfirmOpen(false); setDeleteEmailInput(""); setDeleteReason(""); }}
          />
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 16px",
            }}
          >
            <div
              style={{
                maxWidth: 480,
                width: "100%",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 16,
                padding: "32px 28px",
                fontFamily: "var(--font-body)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--color-red)", margin: "0 0 12px" }}>
                {t("deleteModalTitle")}
              </h2>
              <p style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.6, margin: "0 0 20px" }}>
                {t.rich("deleteModalDesc", {
                  strong: (chunks) => <strong style={{ color: "var(--color-text)" }}>{chunks}</strong>,
                  br: () => <br />,
                })}
              </p>

              <label style={{ display: "block", marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "var(--color-dim)", display: "block", marginBottom: 6 }}>
                  {t.rich("confirmEmailLabel", {
                    email: user.email,
                    strong: (chunks) => <strong style={{ color: "var(--color-text)" }}>{chunks}</strong>,
                  })}
                </span>
                <input
                  type="email"
                  value={deleteEmailInput}
                  onChange={(e) => setDeleteEmailInput(e.target.value)}
                  placeholder={user.email}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-dark)",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ display: "block", marginBottom: 24 }}>
                <span style={{ fontSize: 13, color: "var(--color-dim)", display: "block", marginBottom: 6 }}>
                  {t("deleteReasonLabel")}
                </span>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder={t("deleteReasonPlaceholder")}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-dark)",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => { setDeleteConfirmOpen(false); setDeleteEmailInput(""); setDeleteReason(""); }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    backgroundColor: "transparent",
                    color: "var(--color-dim)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  {tc("cancel")}
                </button>
                <button
                  type="button"
                  disabled={deleteEmailInput !== user.email || deletionLoading}
                  onClick={handleRequestDeletion}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: deleteEmailInput === user.email ? "var(--color-red)" : "var(--color-border)",
                    color: deleteEmailInput === user.email ? "#fff" : "var(--color-dim)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: deleteEmailInput !== user.email || deletionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {deletionLoading ? t("processing") : t("deleteConfirmBtn")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
