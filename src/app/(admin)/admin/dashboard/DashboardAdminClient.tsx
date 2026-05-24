"use client";

import Link from "next/link";
import SimpleLineChart from "@/components/charts/SimpleLineChart";
import SimpleBarChart from "@/components/charts/SimpleBarChart";
import OpsHealthSection from "./OpsHealthSection";

export type ChartData = { date: string; value: number }[];

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
    <span style={{
      display: "inline-block", padding: "3px 9px", borderRadius: 6,
      fontSize: 13, fontWeight: 600, fontFamily: "var(--font-display)",
      background: s.bg, color: s.color, letterSpacing: "0.03em",
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function KPICard({ label, value, valueColor, sub }: {
  label: string; value: string | number; valueColor: string; sub?: string;
}) {
  return (
    <div style={{ ...CARD, padding: "20px 22px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-dim)" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "var(--font-display)", color: valueColor, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export type BookingRow = {
  id: string; status: string; type: string; scheduledAt: string; creditsAmount: number;
};
export type OrgRow = {
  id: string; name: string; totalCredits: number; programName: string;
};
export type DashboardKPI = {
  totalUsers: number; totalEnablers: number; pendingEnablers: number;
  totalBookings: number; completedBookings: number; totalOrgs: number;
  pendingApplications: number; newInquiries: number;
  newUsers7d: number; newBookings7d: number; totalOrgCredits: number;
};

export type OpsCounts = {
  paymentPending: number;
  disputesOpen: number;
  payoutsPending: number;
  webhookFails24h: number;
};

type Props = {
  kpi: DashboardKPI;
  opsCounts: OpsCounts;
  recentBookings: BookingRow[];
  orgs: OrgRow[];
  newUsersChart: ChartData;
  sessionsChart: ChartData;
  revenueChart: ChartData;
  recentPayments: Array<{ id: string; amount_cents: number; paid_at: string; status: string }>;
};

export default function DashboardAdminClient({
  kpi, opsCounts, recentBookings, orgs,
  newUsersChart, sessionsChart, revenueChart, recentPayments,
}: Props) {
  const hasPending =
    kpi.pendingApplications > 0 || kpi.newInquiries > 0 || kpi.pendingEnablers > 0;

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text)", letterSpacing: "-0.02em", margin: 0 }}>
          플랫폼 대시보드
        </h1>
        <p style={{ fontSize: 16, color: "var(--color-dim)", margin: "6px 0 0" }}>
          전체 현황을 확인하세요
        </p>
      </div>

      {/* 운영 큐 + 시스템 상태 (최우선 운영 정보) */}
      <OpsHealthSection counts={opsCounts} />

      {/* 대기 알림 배지 */}
      {hasPending && (
        <div style={{
          ...CARD,
          padding: "16px 20px",
          marginBottom: 20,
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f87171", fontFamily: "var(--font-display)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            처리 대기
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
            {kpi.pendingApplications > 0 && (
              <Link href="/admin/applications" style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: "rgba(251,191,36,0.15)", color: "#fbbf24",
                textDecoration: "none", border: "1px solid rgba(251,191,36,0.3)",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
                Enabler 지원 {kpi.pendingApplications}건
              </Link>
            )}
            {kpi.newInquiries > 0 && (
              <Link href="/admin/inquiries" style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: "rgba(96,165,250,0.15)", color: "#60a5fa",
                textDecoration: "none", border: "1px solid rgba(96,165,250,0.3)",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa", display: "inline-block" }} />
                미응답 문의 {kpi.newInquiries}건
              </Link>
            )}
            {kpi.pendingEnablers > 0 && (
              <Link href="/admin/enablers" style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: "rgba(167,139,250,0.15)", color: "var(--color-accent)",
                textDecoration: "none", border: "1px solid rgba(167,139,250,0.3)",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
                Enabler 심사 {kpi.pendingEnablers}명
              </Link>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        <KPICard label="총 사용자"       value={kpi.totalUsers}          valueColor="var(--color-text)"   sub={`+${kpi.newUsers7d} (7일)`} />
        <KPICard label="활성 Enabler"    value={kpi.totalEnablers}       valueColor="var(--color-accent)" sub="승인 완료" />
        <KPICard label="등록 기관"        value={kpi.totalOrgs}           valueColor="#60a5fa"             sub="파트너 기관" />
        <KPICard label="총 예약"          value={kpi.totalBookings}       valueColor="#4ade80"             sub={`+${kpi.newBookings7d} (7일)`} />
        <KPICard label="총 크레딧 유통"   value={`${kpi.totalOrgCredits.toLocaleString()} C`} valueColor="#fbbf24" sub="기관 배정 합계" />
      </div>

      {/* 30일 차트 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {/* 신규 사용자 */}
        <div style={{ ...CARD, padding: "18px 20px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text)", marginBottom: 12 }}>
            신규 사용자 (30일)
          </div>
          <SimpleLineChart data={newUsersChart} height={90} color="var(--color-accent)" />
        </div>
        {/* 완료 세션 */}
        <div style={{ ...CARD, padding: "18px 20px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text)", marginBottom: 12 }}>
            완료 세션 (30일)
          </div>
          <SimpleBarChart data={sessionsChart} height={90} color="#4ade80" />
        </div>
        {/* 매출 USD */}
        <div style={{ ...CARD, padding: "18px 20px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text)", marginBottom: 12 }}>
            매출 USD (30일)
          </div>
          <SimpleLineChart data={revenueChart} height={90} color="#fbbf24" />
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* 최근 예약 테이블 */}
        <div style={CARD}>
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text)" }}>최근 예약</div>
            <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 3 }}>전체 세션 · 최신순</div>
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
                <tr><td colSpan={5} style={{ ...TABLE_CELL, textAlign: "center", color: "var(--color-dim)", fontSize: 14, padding: "32px 14px" }}>예약 데이터가 없습니다</td></tr>
              ) : (
                recentBookings.map((booking) => {
                  const date = new Date(booking.scheduledAt);
                  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
                  return (
                    <tr key={booking.id}>
                      <td style={TABLE_CELL}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--color-dim)", letterSpacing: "0.04em" }}>
                          #{booking.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td style={TABLE_CELL}><StatusBadge status={booking.status} /></td>
                      <td style={{ ...TABLE_CELL, color: "var(--color-dim)", fontSize: 14 }}>{TYPE_LABELS[booking.type] ?? booking.type}</td>
                      <td style={{ ...TABLE_CELL, color: "var(--color-dim)", fontSize: 14 }}>{dateStr}</td>
                      <td style={{ ...TABLE_CELL, textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "#fbbf24" }}>
                        {booking.creditsAmount}C
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 최근 결제 */}
        <div style={CARD}>
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text)" }}>최근 결제</div>
            <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 3 }}>credit_purchases · 최신순</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TABLE_HEADER}>결제 ID</th>
                <th style={TABLE_HEADER}>일시</th>
                <th style={TABLE_HEADER}>상태</th>
                <th style={{ ...TABLE_HEADER, textAlign: "right" }}>금액 (USD)</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr><td colSpan={4} style={{ ...TABLE_CELL, textAlign: "center", color: "var(--color-dim)", fontSize: 14, padding: "32px 14px" }}>결제 데이터가 없습니다</td></tr>
              ) : (
                recentPayments.map((p) => {
                  const date = p.paid_at ? new Date(p.paid_at) : null;
                  const dateStr = date
                    ? `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
                    : "-";
                  return (
                    <tr key={p.id}>
                      <td style={TABLE_CELL}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--color-dim)", letterSpacing: "0.04em" }}>
                          #{p.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...TABLE_CELL, color: "var(--color-dim)", fontSize: 14 }}>{dateStr}</td>
                      <td style={TABLE_CELL}>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: 6,
                          fontSize: 12, fontWeight: 600, fontFamily: "var(--font-display)",
                          background: p.status === "paid" ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)",
                          color: p.status === "paid" ? "#4ade80" : "#fbbf24",
                        }}>
                          {p.status === "paid" ? "완료" : p.status}
                        </span>
                      </td>
                      <td style={{ ...TABLE_CELL, textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#4ade80" }}>
                        ${(p.amount_cents / 100).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 기관별 크레딧 */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text)" }}>기관별 크레딧</div>
          <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 3 }}>배정 크레딧 현황</div>
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
              <tr><td colSpan={3} style={{ ...TABLE_CELL, textAlign: "center", color: "var(--color-dim)", fontSize: 14, padding: "32px 14px" }}>기관 데이터가 없습니다</td></tr>
            ) : (
              orgs.map((org) => (
                <tr key={org.id}>
                  <td style={{ ...TABLE_CELL, fontWeight: 600 }}>{org.name}</td>
                  <td style={{ ...TABLE_CELL, textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 700, color: "#60a5fa" }}>
                    {org.totalCredits.toLocaleString()}C
                  </td>
                  <td style={{ ...TABLE_CELL, fontSize: 14, color: "var(--color-dim)", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {org.programName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 플랫폼 활동 요약 */}
      <div style={{ ...CARD, padding: "20px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text)", marginBottom: 16 }}>
          플랫폼 활동 요약
        </div>
        <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-border)" }}>
          {[
            { label: "완료된 예약",      value: `${kpi.completedBookings}건`,     color: "#4ade80" },
            { label: "Enabler 심사 대기", value: `${kpi.pendingEnablers}명`,      color: "var(--color-accent)" },
            { label: "신규 지원서",       value: `${kpi.pendingApplications}건`,  color: "#fbbf24" },
            { label: "미응답 문의",       value: `${kpi.newInquiries}건`,         color: "#60a5fa" },
          ].map((item, idx, arr) => (
            <div key={item.label} style={{
              flex: 1, padding: "18px 24px",
              borderRight: idx < arr.length - 1 ? "1px solid var(--color-border)" : "none",
              background: "var(--color-dark)",
            }}>
              <div style={{ fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-dim)", marginBottom: 8 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)", color: item.color, letterSpacing: "-0.02em" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
