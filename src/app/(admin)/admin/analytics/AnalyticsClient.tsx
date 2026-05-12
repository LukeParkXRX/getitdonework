"use client";

export type FunnelTotals = {
  signups: number;
  paid_users: number;
  booking_users: number;
  bookings: number;
  completed: number;
  reviews: number;
};

export type DailyRow = {
  day: string;
  signups: number;
  purchases: number;
  bookings: number;
  completed: number;
  reviews: number;
};

type Props = {
  totals: FunnelTotals;
  daily: DailyRow[];
};

function pct(num: number, denom: number): string {
  if (denom === 0) return "—";
  return Math.round((num / denom) * 100) + "%";
}

const FUNNEL_STEPS = [
  { key: "visits",        label: "방문",   color: "#6366f1" },
  { key: "signups",       label: "가입",   color: "#8b5cf6" },
  { key: "paid_users",    label: "결제",   color: "#a78bfa" },
  { key: "booking_users", label: "예약",   color: "#c4b5fd" },
  { key: "completed",     label: "완료",   color: "#ddd6fe" },
  { key: "reviews",       label: "리뷰",   color: "#ede9fe" },
];

export default function AnalyticsClient({ totals, daily }: Props) {
  const values: Record<string, number | null> = {
    visits:        null,
    signups:       totals.signups,
    paid_users:    totals.paid_users,
    booking_users: totals.booking_users,
    completed:     totals.completed,
    reviews:       totals.reviews,
  };

  const maxVal = Math.max(
    totals.signups,
    totals.paid_users,
    totals.booking_users,
    totals.completed,
    totals.reviews,
    1
  );

  // 최근 30일 차트 데이터 (가입 기준)
  const chartMax = Math.max(...daily.map((d) => Math.max(d.signups, d.purchases, d.bookings, d.completed)), 1);

  return (
    <div style={{ maxWidth: 900 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          KPI 퍼널
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-dim)" }}>
          누적 전환 현황 · 최근 30일 일별 추이
        </p>
      </div>

      {/* 퍼널 카드 */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: "28px 32px",
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: 24,
          }}
        >
          전환 퍼널 (누적)
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FUNNEL_STEPS.map((step, i) => {
            const val      = values[step.key];
            const prevKey  = i > 0 ? FUNNEL_STEPS[i - 1].key : null;
            const prevVal  = prevKey !== null ? values[prevKey] : null;
            const isNull   = val === null;
            const barWidth = isNull ? 0 : Math.round(((val as number) / maxVal) * 100);
            const conv     =
              i > 0 && prevVal !== null && val !== null
                ? pct(val, prevVal)
                : null;

            return (
              <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* 단계 레이블 */}
                <div
                  style={{
                    width: 56,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-text)",
                    flexShrink: 0,
                    textAlign: "right",
                  }}
                >
                  {step.label}
                </div>

                {/* 막대 */}
                <div
                  style={{
                    flex: 1,
                    height: 28,
                    background: "var(--color-dark)",
                    borderRadius: 6,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {isNull ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 12,
                        fontSize: 12,
                        color: "var(--color-dim)",
                        fontStyle: "italic",
                      }}
                    >
                      GA4 연결 시 표시
                    </div>
                  ) : (
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: "100%",
                        background: step.color,
                        minWidth: (val as number) > 0 ? 4 : 0,
                        transition: "width 0.4s ease",
                      }}
                    />
                  )}
                </div>

                {/* 숫자 */}
                <div
                  style={{
                    width: 48,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--color-text)",
                    fontFamily: "var(--font-display)",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {isNull ? "—" : (val as number).toLocaleString()}
                </div>

                {/* 전환율 */}
                <div
                  style={{
                    width: 52,
                    fontSize: 12,
                    color: conv ? "var(--color-accent)" : "transparent",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {conv ?? ""}
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: "var(--color-dim)" }}>
          전환율 = 해당 단계 / 이전 단계 누적 기준
        </p>
      </div>

      {/* 요약 스탯 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          { label: "총 가입",   value: totals.signups },
          { label: "결제 유저", value: totals.paid_users },
          { label: "예약 유저", value: totals.booking_users },
          { label: "총 예약",   value: totals.bookings },
          { label: "완료",      value: totals.completed },
          { label: "리뷰",      value: totals.reviews },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--color-dim)", marginBottom: 6 }}>
              {stat.label}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: "var(--color-text)",
                letterSpacing: "-0.02em",
              }}
            >
              {stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* 일별 차트 */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: "28px 32px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: 24,
          }}
        >
          일별 추이 (최근 30일)
        </h2>

        {/* 범례 */}
        <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "가입",   color: "#8b5cf6" },
            { label: "결제",   color: "#06b6d4" },
            { label: "예약",   color: "#f59e0b" },
            { label: "완료",   color: "#10b981" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: 12, color: "var(--color-dim)" }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* 바 차트 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
            height: 160,
            overflowX: "auto",
            paddingBottom: 24,
          }}
        >
          {daily.map((row) => {
            const cols = [
              { val: row.signups,   color: "#8b5cf6" },
              { val: row.purchases, color: "#06b6d4" },
              { val: row.bookings,  color: "#f59e0b" },
              { val: row.completed, color: "#10b981" },
            ];
            return (
              <div
                key={row.day}
                title={`${row.day}\n가입 ${row.signups} / 결제 ${row.purchases} / 예약 ${row.bookings} / 완료 ${row.completed}`}
                style={{
                  flex: "0 0 auto",
                  width: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  justifyContent: "flex-end",
                  height: 136,
                }}
              >
                {cols.map((c) => {
                  const h = Math.round((c.val / chartMax) * 120);
                  return (
                    <div
                      key={c.color}
                      style={{
                        width: 4,
                        height: h,
                        background: c.color,
                        borderRadius: 2,
                        minHeight: c.val > 0 ? 2 : 0,
                      }}
                    />
                  );
                })}
                {/* 날짜 레이블 (7일 간격) */}
                {(() => {
                  const idx = daily.indexOf(row);
                  if (idx % 7 !== 0) return null;
                  return (
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--color-dim)",
                        position: "absolute",
                        marginTop: 4,
                        whiteSpace: "nowrap",
                        transform: "translateX(-50%)",
                      }}
                    >
                      {row.day.slice(5)}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* x축 날짜 */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {daily.length > 0 && (
            <>
              <span style={{ fontSize: 11, color: "var(--color-dim)" }}>
                {daily[0]?.day?.slice(5)}
              </span>
              <span style={{ fontSize: 11, color: "var(--color-dim)" }}>
                {daily[daily.length - 1]?.day?.slice(5)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
