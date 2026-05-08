"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

type NavItem = {
  icon: string;
  label: string;
  id: string;
  href: string;
};

type ActivityType = "session" | "credit" | "matching" | "alert" | "report";

type Activity = {
  type: ActivityType;
  text: string;
  time: string;
};

export type OrgInfo = {
  id: string;
  name: string;
  program_name: string;
  total_credits: number;
  invite_code: string;
  created_at: string;
};

export type MemberRow = {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
};

export type ProfileRow = {
  user_id: string;
  company_name: string;
  credit_balance: number;
};

export type BookingRow = {
  id: string;
  status: string;
  scheduled_at: string | null;
  credits_amount: number;
  startup_id: string;
  enabler_id: string;
};

export type OrgTxRow = {
  id: string;
  tx_type: string;
  amount: number;
  description: string;
  created_at: string;
};

export type DashboardKPI = {
  totalMembers: number;
  totalCreditsGranted: number;
  totalCreditsAllocated: number;
  totalSessions: number;
  completedSessions: number;
};

type Props = {
  org: OrgInfo;
  members: MemberRow[];
  profiles: ProfileRow[];
  bookings: BookingRow[];
  orgTxs: OrgTxRow[];
  kpi: DashboardKPI;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { icon: "📊", label: "대시보드", id: "dashboard", href: "/org/dashboard" },
  { icon: "🚀", label: "스타트업 관리", id: "startups", href: "/org/startups" },
  { icon: "💳", label: "크레딧 관리", id: "credits", href: "/org/credits" },
  { icon: "👥", label: "Enabler Pool", id: "enablers", href: "/org/enablers" },
  { icon: "📅", label: "세션 이력", id: "sessions", href: "/org/sessions" },
  { icon: "📄", label: "리포트", id: "reports", href: "/org/reports" },
  { icon: "⚙️", label: "설정", id: "settings", href: "/org/settings" },
];

const ACTIVITY_DOT_COLOR: Record<ActivityType, string> = {
  session: "var(--color-green)",
  credit: "var(--color-blue)",
  matching: "var(--color-accent)",
  alert: "var(--color-red)",
  report: "var(--color-dim)",
};

const STATUS_CONFIG = {
  active: { label: "정상", color: "var(--color-green)" },
  low: { label: "부족", color: "var(--color-amber)" },
  depleted: { label: "소진", color: "var(--color-red)" },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        fontSize: "12px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: "var(--color-dim)",
        padding: "10px 12px",
        textAlign: "left" as const,
        whiteSpace: "nowrap" as const,
        backgroundColor: "var(--color-dark)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {children}
    </th>
  );
}

function creditStatus(balance: number, allocated: number): keyof typeof STATUS_CONFIG {
  if (balance <= 0) return "depleted";
  if (allocated > 0 && balance / allocated <= 0.2) return "low";
  return "active";
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return iso.slice(5, 10); // MM-DD
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OrgDashboardClient({
  org,
  members,
  profiles,
  bookings,
  kpi,
}: Props) {
  const pathname = usePathname();

  // 프로필 맵
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // 스타트업별 크레딧 현황 (최대 5개)
  const startupRows = members.slice(0, 5).map((m) => {
    const profile = profileMap.get(m.id);
    const balance = profile?.credit_balance ?? 0;
    const name = profile?.company_name || m.full_name || m.email;
    const status = creditStatus(balance, kpi.totalCreditsAllocated / Math.max(members.length, 1));
    return { name, balance, status };
  });

  // 최근 세션 (5건)
  const recentBookings = bookings.slice(0, 5);

  // 최근 활동 (credit_transactions → activity 형태로 변환)
  const recentActivities: Activity[] = bookings
    .filter((b) => b.status === "completed")
    .slice(0, 5)
    .map((b) => {
      const startup = memberMap.get(b.startup_id);
      const name = profileMap.get(b.startup_id)?.company_name || startup?.full_name || "스타트업";
      return {
        type: "session" as ActivityType,
        text: `${name}이 세션을 완료했습니다`,
        time: formatDate(b.scheduled_at),
      };
    });

  const remainingCredits = org.total_credits - kpi.totalCreditsAllocated;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--color-black)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: "220px",
          minWidth: "220px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--color-dark)",
          borderRight: "1px solid var(--color-border)",
          padding: "24px 12px 24px",
          overflowY: "auto",
        }}
      >
        {/* Org identity */}
        <div style={{ padding: "0 4px 20px" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              style={{
                width: "38px",
                height: "38px",
                minWidth: "38px",
                borderRadius: "50%",
                backgroundColor: "var(--color-accent)",
                color: "oklch(0.1 0 0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: "15px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {org.name}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-dim)",
                  lineHeight: 1.4,
                  marginTop: "1px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {org.program_name}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            backgroundColor: "var(--color-border)",
            marginBottom: "16px",
            marginLeft: "4px",
            marginRight: "4px",
          }}
        />

        {/* Nav items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/org/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontFamily: "var(--font-body)",
                  fontWeight: isActive ? 600 : 400,
                  backgroundColor: isActive
                    ? "var(--color-accent-dim)"
                    : "transparent",
                  color: isActive ? "var(--color-accent)" : "var(--color-dim)",
                  transition: "background-color 0.15s, color 0.15s",
                  textAlign: "left",
                  width: "100%",
                  lineHeight: 1.4,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "var(--color-card)";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "var(--color-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "var(--color-dim)";
                  }
                }}
              >
                <span style={{ fontSize: "14px", lineHeight: 1 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          padding: "28px 32px 48px",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                color: "var(--color-text)",
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
                marginBottom: "4px",
              }}
            >
              대시보드
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "var(--color-dim)",
                fontFamily: "var(--font-body)",
                lineHeight: 1.4,
              }}
            >
              프로그램 현황을 한눈에 확인하세요
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/org/credits"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "15px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                backgroundColor: "var(--color-accent)",
                border: "none",
                color: "oklch(0.1 0 0)",
                cursor: "pointer",
                lineHeight: 1.4,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              크레딧 관리
            </Link>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Card 1 — 등록 멤버 */}
          <div
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-dim)",
                marginBottom: "10px",
              }}
            >
              등록 스타트업
            </p>
            <p
              style={{
                fontSize: "28px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: "6px",
              }}
            >
              {kpi.totalMembers}
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--color-dim)",
                  marginLeft: "3px",
                }}
              >
                개
              </span>
            </p>
            {kpi.totalMembers === 0 ? (
              <p style={{ fontSize: "14px", color: "var(--color-dim)", fontWeight: 500 }}>
                초대 코드: {org.invite_code}
              </p>
            ) : (
              <p style={{ fontSize: "14px", color: "var(--color-green)", fontWeight: 500 }}>
                초대 코드: {org.invite_code}
              </p>
            )}
          </div>

          {/* Card 2 — 총 크레딧 */}
          <div
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-dim)",
                marginBottom: "10px",
              }}
            >
              배분 크레딧
            </p>
            <p
              style={{
                fontSize: "28px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: "6px",
              }}
            >
              {kpi.totalCreditsAllocated}
            </p>
            <p style={{ fontSize: "14px", color: "var(--color-blue)", fontWeight: 500 }}>
              잔여 {remainingCredits}C
            </p>
          </div>

          {/* Card 3 — 완료 세션 */}
          <div
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-dim)",
                marginBottom: "10px",
              }}
            >
              완료 세션
            </p>
            <p
              style={{
                fontSize: "28px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: "6px",
              }}
            >
              {kpi.completedSessions}
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--color-dim)",
                  marginLeft: "3px",
                }}
              >
                회
              </span>
            </p>
            <p style={{ fontSize: "14px", color: "var(--color-dim)", fontWeight: 500 }}>
              전체 {kpi.totalSessions}건 중
            </p>
          </div>

          {/* Card 4 — 총 크레딧 */}
          <div
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-dim)",
                marginBottom: "10px",
              }}
            >
              총 크레딧
            </p>
            <p
              style={{
                fontSize: "28px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-accent)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: "6px",
              }}
            >
              {org.total_credits}
            </p>
            <p style={{ fontSize: "14px", color: "var(--color-dim)", fontWeight: 500 }}>
              구매 총량
            </p>
          </div>
        </div>

        {/* ── Two Tables ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {/* Left: 스타트업별 크레딧 현황 */}
          <div
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px 14px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p
                style={{
                  fontSize: "15px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  lineHeight: 1.3,
                }}
              >
                스타트업별 크레딧 현황
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-body)",
                    color: "var(--color-dim)",
                  }}
                >
                  {members.length}개 스타트업
                </span>
                <Link
                  href="/org/credits"
                  style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-body)",
                    color: "var(--color-accent)",
                    textDecoration: "none",
                  }}
                >
                  전체 보기 →
                </Link>
              </div>
            </div>

            {startupRows.length === 0 ? (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                  color: "var(--color-dim)",
                  fontSize: "15px",
                }}
              >
                아직 등록된 멤버가 없어요.
                <br />
                초대 코드 <strong style={{ color: "var(--color-accent)" }}>{org.invite_code}</strong>로 멤버를 초대하세요.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                  }}
                >
                  <thead>
                    <tr>
                      <ColLabel>스타트업</ColLabel>
                      <ColLabel>잔여</ColLabel>
                      <ColLabel>상태</ColLabel>
                    </tr>
                  </thead>
                  <tbody>
                    {startupRows.map((row, i) => {
                      const status = STATUS_CONFIG[row.status];
                      return (
                        <tr
                          key={i}
                          style={{
                            borderBottom:
                              i < startupRows.length - 1
                                ? "1px solid var(--color-border)"
                                : "none",
                            transition: "background-color 0.1s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                              "oklch(0.24 0.008 280 / 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 12px",
                              fontSize: "15px",
                              fontFamily: "var(--font-body)",
                              fontWeight: 600,
                              color: "var(--color-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.name}
                          </td>
                          <td
                            style={{
                              padding: "12px 12px",
                              fontSize: "15px",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 700,
                              color:
                                row.balance <= 0
                                  ? "var(--color-red)"
                                  : row.balance <= 3
                                    ? "var(--color-amber)"
                                    : "var(--color-text)",
                            }}
                          >
                            {row.balance}C
                          </td>
                          <td style={{ padding: "12px 12px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontSize: "14px",
                                fontFamily: "var(--font-body)",
                                fontWeight: 500,
                                color: status.color,
                              }}
                            >
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  backgroundColor: status.color,
                                  flexShrink: 0,
                                }}
                              />
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: 최근 세션 */}
          <div
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px 14px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p
                style={{
                  fontSize: "15px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  lineHeight: 1.3,
                }}
              >
                최근 세션
              </p>
              <span
                style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-dim)",
                }}
              >
                최근 {Math.min(recentBookings.length, 5)}건
              </span>
            </div>

            {recentBookings.length === 0 ? (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                  color: "var(--color-dim)",
                  fontSize: "15px",
                }}
              >
                아직 진행된 세션이 없어요.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                  }}
                >
                  <thead>
                    <tr>
                      <ColLabel>스타트업</ColLabel>
                      <ColLabel>날짜</ColLabel>
                      <ColLabel>크레딧</ColLabel>
                      <ColLabel>상태</ColLabel>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking, i) => {
                      const startup = memberMap.get(booking.startup_id);
                      const profile = profileMap.get(booking.startup_id);
                      const name =
                        profile?.company_name ||
                        startup?.full_name ||
                        "스타트업";
                      return (
                        <tr
                          key={booking.id}
                          style={{
                            borderBottom:
                              i < recentBookings.length - 1
                                ? "1px solid var(--color-border)"
                                : "none",
                            transition: "background-color 0.1s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                              "oklch(0.24 0.008 280 / 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 12px",
                              fontSize: "15px",
                              fontFamily: "var(--font-body)",
                              fontWeight: 600,
                              color: "var(--color-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {name}
                          </td>
                          <td
                            style={{
                              padding: "12px 12px",
                              fontSize: "14px",
                              fontFamily: "var(--font-mono)",
                              color: "var(--color-dim)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatDate(booking.scheduled_at)}
                          </td>
                          <td
                            style={{
                              padding: "12px 12px",
                              fontSize: "15px",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 700,
                              color: "var(--color-text)",
                            }}
                          >
                            {booking.credits_amount}C
                          </td>
                          <td
                            style={{
                              padding: "12px 12px",
                              fontSize: "14px",
                              fontFamily: "var(--font-body)",
                              color:
                                booking.status === "completed"
                                  ? "var(--color-green)"
                                  : booking.status === "cancelled"
                                    ? "var(--color-red)"
                                    : "var(--color-amber)",
                            }}
                          >
                            {booking.status === "completed"
                              ? "완료"
                              : booking.status === "cancelled"
                                ? "취소"
                                : booking.status === "confirmed"
                                  ? "예정"
                                  : "대기"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Activity Log ── */}
        <div
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px 14px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <p
              style={{
                fontSize: "15px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: 1.3,
              }}
            >
              최근 활동
            </p>
          </div>

          {recentActivities.length === 0 ? (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: "var(--color-dim)",
                fontSize: "15px",
              }}
            >
              아직 진행된 활동이 없어요.
            </div>
          ) : (
            <div style={{ padding: "4px 0" }}>
              {recentActivities.map((activity, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 20px",
                    borderBottom:
                      i < recentActivities.length - 1
                        ? "1px solid var(--color-border)"
                        : "none",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      "oklch(0.24 0.008 280 / 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        minWidth: "7px",
                        borderRadius: "50%",
                        backgroundColor: ACTIVITY_DOT_COLOR[activity.type],
                      }}
                    />
                    <p
                      style={{
                        fontSize: "15px",
                        fontFamily: "var(--font-body)",
                        color: "var(--color-text)",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {activity.text}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontFamily: "var(--font-body)",
                      color: "var(--color-dim)",
                      whiteSpace: "nowrap",
                      marginLeft: "24px",
                      flexShrink: 0,
                    }}
                  >
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
