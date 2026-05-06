"use client";

import Link from "next/link";

const TABLE_HEADER: React.CSSProperties = {
  fontSize: 12,
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-dim)",
  background: "var(--color-dark)",
  borderBottom: "1px solid var(--color-border)",
  padding: "10px 14px",
  textAlign: "left",
};

const TABLE_CELL: React.CSSProperties = {
  padding: "11px 14px",
  fontSize: 15,
  color: "var(--color-text)",
  borderBottom: "1px solid var(--color-border)",
  verticalAlign: "middle",
};

const CARD: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  overflow: "hidden",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  confirmed: { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
  completed: { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
  cancelled: { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
};

const STATUS_LABELS: Record<string, string> = {
  pending:   "대기중",
  confirmed: "확정",
  completed: "완료",
  cancelled: "취소",
};

const TYPE_LABELS: Record<string, string> = {
  chemistry: "케미스트리",
  standard:  "스탠다드",
  project:   "프로젝트",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: "rgba(255,255,255,0.1)", color: "var(--color-dim)" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "var(--font-display)",
        background: s.bg,
        color: s.color,
        letterSpacing: "0.03em",
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function KPICard({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string;
  value: string | number;
  valueColor: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        ...CARD,
        padding: "20px 22px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-dim)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: valueColor,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

export type BookingRow = {
  id: string;
  status: string;
  type: string;
  scheduledAt: string;
  creditsAmount: number;
};

export type OrgRow = {
  id: string;
  name: string;
  totalCredits: number;
  programName: string;
};

export type DashboardKPI = {
  totalUsers: number;
  totalEnablers: number;
  pendingEnablers: number;
  totalBookings: number;
  completedBookings: number;
  totalOrgs: number;
  pendingApplications: number;
  newInquiries: number;
  newUsers7d: number;
  newBookings7d: number;
  totalOrgCredits: number;
};

type Props = {
  kpi: DashboardKPI;
  recentBookings: BookingRow[];
  orgs: OrgRow[];
};

export default function DashboardAdminClient({ kpi, recentBookings, orgs }: Props) {
  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          플랫폼 대시보드
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--color-dim)",
            margin: "6px 0 0",
          }}
        >
          전체 현황을 확인하세요
        </p>
      </div>

      {/* Alert Banners */}
      {(kpi.pendingEnablers > 0 || kpi.newInquiries > 0) && (
        <div style={{ marginBottom: 20 }}>
          {kpi.pendingEnablers > 0 && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid oklch(0.75 0.15 85 / 0.3)",
                backgroundColor: "oklch(0.75 0.15 85 / 0.05)",
                color: "oklch(0.75 0.15 85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                marginBottom: "8px",
              }}
            >
              <span>{kpi.pendingEnablers}명의 Enabler가 심사 대기 중입니다</span>
              <Link
                href="/admin/enablers"
                style={{
                  color: "oklch(0.75 0.15 85)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: "var(--font-display)",
                  whiteSpace: "nowrap",
                }}
              >
                심사하기 →
              </Link>
            </div>
          )}
          {kpi.newInquiries > 0 && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid oklch(0.75 0.15 85 / 0.3)",
                backgroundColor: "oklch(0.75 0.15 85 / 0.05)",
                color: "oklch(0.75 0.15 85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                marginBottom: "8px",
              }}
            >
              <span>새 문의 {kpi.newInquiries}건이 답변 대기 중입니다</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <KPICard
          label="총 사용자"
          value={kpi.totalUsers}
          valueColor="var(--color-text)"
          sub={`+${kpi.newUsers7d} (7일)`}
        />
        <KPICard
          label="활성 Enabler"
          value={kpi.totalEnablers}
          valueColor="var(--color-accent)"
          sub="승인 완료"
        />
        <KPICard
          label="등록 기관"
          value={kpi.totalOrgs}
          valueColor="#60a5fa"
          sub="파트너 기관"
        />
        <KPICard
          label="총 예약"
          value={kpi.totalBookings}
          valueColor="#4ade80"
          sub={`+${kpi.newBookings7d} (7일)`}
        />
        <KPICard
          label="총 크레딧 유통"
          value={`${kpi.totalOrgCredits.toLocaleString()} C`}
          valueColor="#fbbf24"
          sub="기관 배정 합계"
        />
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* 최근 예약 테이블 */}
        <div style={CARD}>
          <div
            style={{
              padding: "16px 20px 14px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: "var(--color-text)",
              }}
            >
              최근 예약
            </div>
            <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 3 }}>
              전체 세션 · 최신순
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TABLE_HEADER}>예약 ID</th>
                <th style={TABLE_HEADER}>상태</th>
                <th style={TABLE_HEADER}>타입</th>
                <th style={TABLE_HEADER}>일정</th>
                <th style={{ ...TABLE_HEADER, textAlign: "right" }}>크레딧</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      ...TABLE_CELL,
                      textAlign: "center",
                      color: "var(--color-dim)",
                      fontSize: 14,
                      padding: "32px 14px",
                    }}
                  >
                    예약 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => {
                  const date = new Date(booking.scheduledAt);
                  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
                  return (
                    <tr key={booking.id}>
                      <td style={TABLE_CELL}>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 14,
                            color: "var(--color-dim)",
                            letterSpacing: "0.04em",
                          }}
                        >
                          #{booking.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td style={TABLE_CELL}>
                        <StatusBadge status={booking.status} />
                      </td>
                      <td style={{ ...TABLE_CELL, color: "var(--color-dim)", fontSize: 14 }}>
                        {TYPE_LABELS[booking.type] ?? booking.type}
                      </td>
                      <td style={{ ...TABLE_CELL, color: "var(--color-dim)", fontSize: 14 }}>
                        {dateStr}
                      </td>
                      <td
                        style={{
                          ...TABLE_CELL,
                          textAlign: "right",
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: 15,
                          color: "#fbbf24",
                        }}
                      >
                        {booking.creditsAmount}C
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 기관별 크레딧 테이블 */}
        <div style={CARD}>
          <div
            style={{
              padding: "16px 20px 14px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: "var(--color-text)",
              }}
            >
              기관별 크레딧
            </div>
            <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 3 }}>
              배정 크레딧 현황
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TABLE_HEADER}>기관명</th>
                <th style={{ ...TABLE_HEADER, textAlign: "right" }}>총 크레딧</th>
                <th style={TABLE_HEADER}>프로그램</th>
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      ...TABLE_CELL,
                      textAlign: "center",
                      color: "var(--color-dim)",
                      fontSize: 14,
                      padding: "32px 14px",
                    }}
                  >
                    기관 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.id}>
                    <td style={{ ...TABLE_CELL, fontWeight: 600 }}>{org.name}</td>
                    <td
                      style={{
                        ...TABLE_CELL,
                        textAlign: "right",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        color: "#60a5fa",
                      }}
                    >
                      {org.totalCredits.toLocaleString()}C
                    </td>
                    <td
                      style={{
                        ...TABLE_CELL,
                        fontSize: 14,
                        color: "var(--color-dim)",
                        maxWidth: 160,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {org.programName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 플랫폼 활동 요약 */}
      <div
        style={{
          ...CARD,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: "var(--color-text)",
            marginBottom: 16,
          }}
        >
          플랫폼 활동 요약
        </div>
        <div
          style={{
            display: "flex",
            gap: 0,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--color-border)",
          }}
        >
          {[
            {
              label: "완료된 예약",
              value: `${kpi.completedBookings}건`,
              color: "#4ade80",
            },
            {
              label: "Enabler 심사 대기",
              value: `${kpi.pendingEnablers}명`,
              color: "var(--color-accent)",
            },
            {
              label: "신규 지원서",
              value: `${kpi.pendingApplications}건`,
              color: "#fbbf24",
            },
          ].map((item, idx, arr) => (
            <div
              key={item.label}
              style={{
                flex: 1,
                padding: "18px 24px",
                borderRight: idx < arr.length - 1 ? "1px solid var(--color-border)" : "none",
                background: "var(--color-dark)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-dim)",
                  marginBottom: 8,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: item.color,
                  letterSpacing: "-0.02em",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
