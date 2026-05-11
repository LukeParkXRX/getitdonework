"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast, ConfirmDialog } from "@/components/ui";

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
      showError("네트워크 오류가 발생했습니다");
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
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 28,
            color: "var(--color-text)",
            margin: "0 0 32px",
          }}
        >
          프로필 설정
        </h1>

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
                    {user.role === "startup" ? "스타트업" : user.role === "enabler" ? "인에이블러" : user.role}
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
                >
                  프로필 이미지 변경
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
                  계정 정보
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
                      가입일
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
                      인증 상태
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
                        인증됨
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
                        미인증
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
                <Section title="스타트업 정보">
                  <Field label="회사명">
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setField("companyName", e.target.value)}
                      onFocus={() => setFocusedField("companyName")}
                      onBlur={() => setFocusedField(null)}
                      style={inputStyle("companyName")}
                      placeholder="회사명을 입력하세요"
                    />
                  </Field>

                  <Field
                    label="산업 분야"
                    hint="쉼표로 구분하여 여러 분야를 입력할 수 있습니다 (예: Fintech, Payments)"
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

                  <Field label="단계">
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
                      <option value="">단계 선택</option>
                      <option value="Seed">Seed</option>
                      <option value="Pre-A">Pre-A</option>
                      <option value="Series A">Series A</option>
                      <option value="Series B">Series B</option>
                    </select>
                  </Field>

                  <Field label="미국 진출 목표">
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
                      placeholder="미국 시장에서 달성하고자 하는 목표를 구체적으로 작성해 주세요"
                    />
                  </Field>
                </Section>
              )}

              {/* Enabler: 프로필 편집 안내 */}
              {user.role === "enabler" && (
                <Section title="인에이블러 프로필">
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 15,
                      color: "var(--color-dim)",
                      margin: 0,
                    }}
                  >
                    인에이블러 프로필 상세 편집은{" "}
                    <a
                      href="/enabler-dashboard/profile"
                      style={{ color: "var(--color-accent)", textDecoration: "underline" }}
                    >
                      인에이블러 대시보드
                    </a>
                    에서 변경할 수 있습니다.
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
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    type="button"
                    style={{
                      alignSelf: "flex-start",
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      backgroundColor: "transparent",
                      color: "var(--color-text)",
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      fontSize: 16,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-border)";
                    }}
                  >
                    비밀번호 변경
                  </button>

                  <div
                    style={{
                      height: 1,
                      backgroundColor: "var(--color-border)",
                      margin: "4px 0",
                    }}
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                        fontSize: 16,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "oklch(0.55 0.2 25 / 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "transparent";
                      }}
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      {t("deleteAccount")}
                    </button>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        color: "var(--color-dim)",
                      }}
                    >
                      {t("deleteAccountDesc")}
                    </span>
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

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
        }}
        title={t("deleteAccount")}
        message={t("deleteConfirmMessage")}
        confirmText={t("deleteConfirmBtn")}
        cancelText={tc("cancel")}
        variant="danger"
      />
    </div>
  );
}
