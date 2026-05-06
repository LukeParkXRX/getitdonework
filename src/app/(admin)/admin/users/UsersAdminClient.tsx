"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/components/ui";
import { downloadCSV } from "@/lib/utils/csv-export";

type Role = "startup" | "enabler" | "org_admin" | "super_admin";

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  orgId?: string;
  orgName?: string;
  isVerified: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<Role, string> = {
  startup: "스타트업",
  enabler: "Enabler",
  org_admin: "기관 관리자",
  super_admin: "슈퍼관리자",
};

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  startup: { bg: "oklch(0.28 0.04 240 / 0.5)", text: "var(--color-blue)" },
  enabler: { bg: "oklch(0.28 0.06 280 / 0.5)", text: "var(--color-accent)" },
  org_admin: { bg: "oklch(0.28 0.06 70 / 0.5)", text: "var(--color-amber)" },
  super_admin: { bg: "oklch(0.28 0.06 20 / 0.5)", text: "var(--color-red)" },
};

const FILTER_TABS: { key: "all" | Role; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "startup", label: "스타트업" },
  { key: "enabler", label: "Enabler" },
  { key: "org_admin", label: "기관 관리자" },
  { key: "super_admin", label: "슈퍼관리자" },
];

const ALL_ROLES: Role[] = ["startup", "enabler", "org_admin", "super_admin"];

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function Avatar({ user }: { user: UserRecord }) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--color-accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        color: "var(--color-black)",
        fontFamily: "var(--font-display)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function UsersAdminClient({ initial }: { initial: UserRecord[] }) {
  const { info, success, error: toastError } = useToast();
  const [users, setUsers] = useState<UserRecord[]>(initial);
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Role 변경 모달
  const [roleModalUser, setRoleModalUser] = useState<UserRecord | null>(null);
  const [pendingRole, setPendingRole] = useState<Role>("startup");
  const [saving, setSaving] = useState(false);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: users.length };
    for (const u of users) {
      counts[u.role] = (counts[u.role] ?? 0) + 1;
    }
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, searchQuery]);

  function handleExportCSV() {
    const headers = ["이름", "이메일", "역할", "인증여부", "기관", "가입일"];
    const rows = filtered.map((u) => [
      u.fullName,
      u.email,
      ROLE_LABELS[u.role],
      u.isVerified ? "인증" : "미인증",
      u.orgName ?? "",
      u.createdAt || "",
    ]);
    downloadCSV("users", headers, rows);
  }

  function openRoleModal(user: UserRecord) {
    setRoleModalUser(user);
    setPendingRole(user.role);
  }

  async function handleRoleSave() {
    if (!roleModalUser) return;
    if (pendingRole === roleModalUser.role) {
      setRoleModalUser(null);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${roleModalUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pendingRole }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        toastError(body.error ?? "역할 변경에 실패했습니다");
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === roleModalUser.id ? { ...u, role: pendingRole } : u
        )
      );
      success(`${roleModalUser.fullName}의 역할이 ${ROLE_LABELS[pendingRole]}로 변경되었습니다`);
      setRoleModalUser(null);
    } catch {
      toastError("네트워크 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyToggle(user: UserRecord) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: !user.isVerified }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        toastError(body.error ?? "인증 상태 변경에 실패했습니다");
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isVerified: !u.isVerified } : u
        )
      );
      success(`${user.fullName} 인증 상태가 변경되었습니다`);
    } catch {
      toastError("네트워크 오류가 발생했습니다");
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 26,
              color: "var(--color-text)",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            사용자 관리
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 15,
              color: "var(--color-dim)",
              fontFamily: "var(--font-body)",
            }}
          >
            총{" "}
            <span
              style={{
                color: "var(--color-accent)",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
              }}
            >
              {users.length}
            </span>
            명의 플랫폼 사용자
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-dim)",
              pointerEvents: "none",
            }}
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="이름, 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "9px 14px 9px 34px",
              fontSize: 15,
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              outline: "none",
              width: 240,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "var(--color-accent)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "var(--color-border)";
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

      {/* Role Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = roleFilter === tab.key;
          const count = roleCounts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: isActive
                  ? "transparent"
                  : "var(--color-border)",
                background: isActive
                  ? "oklch(0.3 0.06 280 / 0.35)"
                  : "transparent",
                color: isActive ? "var(--color-accent)" : "var(--color-dim)",
                fontSize: 15,
                fontWeight: isActive ? 600 : 400,
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                transition: "all 0.15s",
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--color-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-dim)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--color-border)";
                }
              }}
            >
              {tab.label}
              <span
                style={{
                  background: isActive
                    ? "oklch(0.55 0.18 280 / 0.25)"
                    : "var(--color-dark)",
                  color: isActive ? "var(--color-accent)" : "var(--color-dim)",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  padding: "1px 6px",
                  borderRadius: 10,
                  lineHeight: "18px",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2.2fr 1.2fr 1fr 1.2fr 1.4fr",
            background: "var(--color-dark)",
            borderBottom: "1px solid var(--color-border)",
            padding: "0 20px",
          }}
        >
          {["사용자", "이메일", "역할", "인증", "가입일", "액션"].map(
            (col) => (
              <div
                key={col}
                style={{
                  padding: "11px 0",
                  fontSize: 12,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-dim)",
                }}
              >
                {col}
              </div>
            )
          )}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--color-dim)",
              fontSize: 16,
              fontFamily: "var(--font-body)",
            }}
          >
            검색 결과가 없습니다.
          </div>
        ) : (
          filtered.map((user, idx) => (
            <UserRow
              key={user.id}
              user={user}
              isLast={idx === filtered.length - 1}
              onInfo={info}
              onRoleChange={openRoleModal}
              onVerifyToggle={handleVerifyToggle}
            />
          ))
        )}
      </div>

      {/* Pagination placeholder */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginTop: 20,
        }}
      >
        <button
          disabled
          style={{
            padding: "7px 14px",
            borderRadius: 7,
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-dim)",
            fontSize: 15,
            fontFamily: "var(--font-body)",
            cursor: "not-allowed",
            opacity: 0.45,
          }}
        >
          이전
        </button>
        <span
          style={{
            fontSize: 15,
            color: "var(--color-dim)",
            fontFamily: "var(--font-mono)",
          }}
        >
          1 / 1 페이지
        </span>
        <button
          disabled
          style={{
            padding: "7px 14px",
            borderRadius: 7,
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-dim)",
            fontSize: 15,
            fontFamily: "var(--font-body)",
            cursor: "not-allowed",
            opacity: 0.45,
          }}
        >
          다음
        </button>
      </div>

      {/* Role Change Modal */}
      {roleModalUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "oklch(0 0 0 / 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9000,
          }}
          onClick={() => !saving && setRoleModalUser(null)}
        >
          <div
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 14,
              padding: "28px 32px",
              width: 360,
              maxWidth: "90vw",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--color-text)",
                margin: "0 0 6px",
              }}
            >
              역할 변경
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "var(--color-dim)",
                margin: "0 0 20px",
                fontFamily: "var(--font-body)",
              }}
            >
              {roleModalUser.fullName} ({roleModalUser.email})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {ALL_ROLES.map((r) => {
                const isSelected = pendingRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => setPendingRole(r)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                      background: isSelected ? "oklch(0.3 0.06 280 / 0.35)" : "transparent",
                      color: isSelected ? "var(--color-accent)" : "var(--color-dim)",
                      fontSize: 15,
                      fontWeight: isSelected ? 600 : 400,
                      fontFamily: "var(--font-body)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.12s",
                    }}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setRoleModalUser(null)}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-dim)",
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                취소
              </button>
              <button
                onClick={handleRoleSave}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  border: "none",
                  background: "var(--color-accent)",
                  color: "var(--color-black)",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  isLast,
  onInfo,
  onRoleChange,
  onVerifyToggle,
}: {
  user: UserRecord;
  isLast: boolean;
  onInfo: (msg: string) => void;
  onRoleChange: (user: UserRecord) => void;
  onVerifyToggle: (user: UserRecord) => void;
}) {
  const roleStyle = ROLE_COLORS[user.role];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 2.2fr 1.2fr 1fr 1.2fr 1.4fr",
        padding: "0 20px",
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          "oklch(0.24 0.008 280 / 0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* 사용자 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 0",
        }}
      >
        <Avatar user={user} />
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user.fullName}
        </span>
      </div>

      {/* 이메일 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 0",
          paddingRight: 12,
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: "var(--color-dim)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user.email}
        </span>
      </div>

      {/* 역할 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 0",
        }}
      >
        <span
          style={{
            background: roleStyle.bg,
            color: roleStyle.text,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            letterSpacing: "0.04em",
            padding: "3px 9px",
            borderRadius: 6,
            whiteSpace: "nowrap",
          }}
        >
          {ROLE_LABELS[user.role]}
        </span>
      </div>

      {/* 인증 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "14px 0",
        }}
      >
        {user.isVerified ? (
          <>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--color-green)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 14,
                color: "var(--color-green)",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
              }}
            >
              인증됨
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: 14,
              color: "var(--color-dim)",
              fontFamily: "var(--font-body)",
            }}
          >
            미인증
          </span>
        )}
      </div>

      {/* 가입일 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 0",
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: "var(--color-dim)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {formatDate(user.createdAt)}
        </span>
      </div>

      {/* 액션 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "14px 0",
        }}
      >
        {user.role !== "super_admin" && (
          <ActionButton
            label="역할 변경"
            onClick={() => onRoleChange(user)}
          />
        )}
        <ActionButton
          label={user.isVerified ? "인증 해제" : "인증"}
          variant={user.isVerified ? "danger" : "ghost"}
          onClick={() => onVerifyToggle(user)}
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  variant = "ghost",
  onClick,
}: {
  label: string;
  variant?: "ghost" | "danger";
  onClick: () => void;
}) {
  const isDanger = variant === "danger";

  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 11px",
        borderRadius: 6,
        border: "1px solid",
        borderColor: isDanger
          ? "oklch(0.5 0.18 20 / 0.4)"
          : "var(--color-border)",
        background: "transparent",
        color: isDanger ? "var(--color-red)" : "var(--color-dim)",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "var(--font-body)",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        if (isDanger) {
          el.style.background = "oklch(0.3 0.1 20 / 0.3)";
          el.style.borderColor = "var(--color-red)";
        } else {
          el.style.background = "var(--color-dark)";
          el.style.color = "var(--color-text)";
          el.style.borderColor = "var(--color-text)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        if (isDanger) {
          el.style.background = "transparent";
          el.style.borderColor = "oklch(0.5 0.18 20 / 0.4)";
        } else {
          el.style.background = "transparent";
          el.style.color = "var(--color-dim)";
          el.style.borderColor = "var(--color-border)";
        }
      }}
    >
      {label}
    </button>
  );
}
