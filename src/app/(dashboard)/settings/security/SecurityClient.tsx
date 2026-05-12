"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui";
import { parseDeviceFromUA, parseBrowserFromUA } from "@/lib/user-activity";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivityLog {
  id: string;
  activity_type: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  two_factor_enabled: boolean;
  two_factor_method: string | null;
}

interface SecurityClientProps {
  user: UserData;
  activityLogs: ActivityLog[];
}

// ── Utils ─────────────────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  login_success: "로그인 성공",
  login_failed: "로그인 실패",
  logout: "로그아웃",
  password_changed: "비밀번호 변경",
  email_changed: "이메일 변경",
  "2fa_enabled": "2FA 활성화",
  "2fa_disabled": "2FA 비활성화",
  profile_updated: "프로필 업데이트",
  data_downloaded: "데이터 다운로드",
  account_deletion_requested: "계정 삭제 요청",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ELEVATED_ROLES = ["super_admin", "org_admin"];

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: checked ? "var(--color-accent)" : "var(--color-border)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background-color 0.2s",
        outline: "none",
        opacity: disabled ? 0.6 : 1,
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

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SecurityClient({ user, activityLogs }: SecurityClientProps) {
  const { success, error: showError } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.two_factor_enabled);
  const [toggling, setToggling] = useState(false);

  const isElevated = ELEVATED_ROLES.includes(user.role);

  async function handleToggle2FA(enable: boolean) {
    setToggling(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        showError(json.error ?? "2FA 설정 실패");
        return;
      }
      setTwoFactorEnabled(enable);
      success(enable ? "2FA가 활성화되었습니다." : "2FA가 비활성화되었습니다.");
    } catch {
      showError("네트워크 오류가 발생했습니다.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)" }}>
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 120px" }}>

        {/* Header + nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <Link
            href="/settings"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--color-dim)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← 설정
          </Link>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 28,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            보안 설정
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── 2FA 섹션 ─────────────────────────────────────────────────── */}
          <Section title="2단계 인증 (2FA)">

            {isElevated && (
              <div
                style={{
                  backgroundColor: "#fefce8",
                  border: "1px solid #fbbf24",
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  color: "#92400e",
                  lineHeight: 1.6,
                }}
              >
                <strong>권장:</strong> 관리자 계정은 2FA 활성화를 강력히 권장합니다. 계정 탈취 시 서비스 전체에 영향을 미칩니다.
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: 15,
                    color: "var(--color-text)",
                  }}
                >
                  이메일 OTP 인증
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "var(--color-dim)",
                  }}
                >
                  {twoFactorEnabled
                    ? "활성화됨 — 로그인 시 이메일로 6자리 코드 발송"
                    : "비활성화됨"}
                </span>
              </div>
              <Toggle
                checked={twoFactorEnabled}
                onChange={handleToggle2FA}
                disabled={toggling}
              />
            </div>

            <div
              style={{
                backgroundColor: "var(--color-dark)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "12px 16px",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--color-dim)",
                lineHeight: 1.6,
              }}
            >
              현재 이메일 OTP 방식을 지원합니다. 활성화하면 다음 로그인부터 이메일로 6자리 코드를 받아 입력해야 합니다.
              {/* TODO(Sprint 43): 실제 로그인 흐름에 OTP 검증 단계 통합 */}
            </div>
          </Section>

          {/* ── 최근 활동 ────────────────────────────────────────────────── */}
          <Section title="최근 활동">
            {activityLogs.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  color: "var(--color-dim)",
                  margin: 0,
                  textAlign: "center",
                  padding: "24px 0",
                }}
              >
                기록된 활동이 없습니다.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr>
                      {["일시", "활동", "IP", "디바이스"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            color: "var(--color-dim)",
                            fontWeight: 600,
                            fontSize: 13,
                            borderBottom: "1px solid var(--color-border)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => {
                      const device = parseDeviceFromUA(log.user_agent);
                      const browser = parseBrowserFromUA(log.user_agent);
                      const isSuspicious =
                        log.activity_type === "login_failed" ||
                        log.activity_type === "account_deletion_requested";
                      return (
                        <tr
                          key={log.id}
                          style={{
                            backgroundColor: isSuspicious
                              ? "rgba(239,68,68,0.06)"
                              : "transparent",
                          }}
                        >
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "var(--color-dim)",
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid var(--color-border)",
                              fontSize: 13,
                            }}
                          >
                            {formatDate(log.created_at)}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: isSuspicious ? "#ef4444" : "var(--color-text)",
                              fontWeight: isSuspicious ? 600 : 400,
                              borderBottom: "1px solid var(--color-border)",
                            }}
                          >
                            {ACTIVITY_LABELS[log.activity_type] ?? log.activity_type}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "var(--color-dim)",
                              fontFamily: "monospace",
                              fontSize: 13,
                              borderBottom: "1px solid var(--color-border)",
                            }}
                          >
                            {log.ip_address ?? "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "var(--color-dim)",
                              borderBottom: "1px solid var(--color-border)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {device} · {browser}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ── 계정 보안 안내 ───────────────────────────────────────────── */}
          <Section title="계정 보안">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--color-dim)",
                lineHeight: 1.7,
              }}
            >
              <p style={{ margin: 0 }}>
                의심스러운 활동이 감지되면 즉시 비밀번호를 변경하고 2FA를 활성화하세요.
              </p>
              <p style={{ margin: 0 }}>
                다른 기기에서 로그인한 경우 위 활동 로그에서 확인할 수 있습니다. 본인이 아닌 로그인이 있다면{" "}
                <a
                  href="mailto:hello@getitdonework.com"
                  style={{ color: "var(--color-text)", textDecoration: "underline" }}
                >
                  support에 즉시 문의
                </a>
                해 주세요.
              </p>
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}
