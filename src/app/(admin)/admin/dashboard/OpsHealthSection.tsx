"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface OpsCounts {
  paymentPending: number;
  disputesOpen: number;
  payoutsPending: number;
  webhookFails24h: number;
}

interface HealthCheck {
  status: "ok" | "warning" | "error";
  [k: string]: unknown;
}

interface HealthReport {
  status: "ok" | "degraded" | "error";
  checks: Record<string, HealthCheck>;
  timestamp: string;
}

const CARD: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  overflow: "hidden",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 12,
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-dim)",
};

const STATUS_DOT: Record<HealthCheck["status"], string> = {
  ok: "#4ade80",
  warning: "#fbbf24",
  error: "#f87171",
};

function StatusDot({ status }: { status: HealthCheck["status"] }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: STATUS_DOT[status],
        flexShrink: 0,
      }}
      aria-label={status}
    />
  );
}

function CountTile({
  label,
  value,
  href,
  urgent,
}: {
  label: string;
  value: number;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "14px 16px",
        borderRadius: 10,
        border: "1px solid var(--color-border)",
        background: urgent && value > 0 ? "rgba(248,113,113,0.08)" : "var(--color-dark)",
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
    >
      <span style={{ ...SECTION_LABEL, fontSize: 11 }}>{label}</span>
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: urgent && value > 0 ? "#f87171" : "var(--color-text)",
          lineHeight: 1,
        }}
      >
        {value.toLocaleString()}
      </span>
    </Link>
  );
}

export default function OpsHealthSection({ counts }: { counts: OpsCounts }) {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchHealth() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const json = (await res.json()) as HealthReport;
        if (!cancelled) {
          setHealth(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "fetch failed");
      }
    }
    fetchHealth();
    const id = setInterval(fetchHealth, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const checkKeys: Array<{ key: string; label: string }> = [
    { key: "db", label: "DB" },
    { key: "stripe", label: "Stripe" },
    { key: "livekit", label: "LiveKit" },
    { key: "resend", label: "Resend" },
    { key: "sentry", label: "Sentry" },
    { key: "rate_limit", label: "Rate Limit" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: 16,
        marginBottom: 24,
      }}
    >
      {/* 좌: 운영 카운트 4종 */}
      <div style={{ ...CARD, padding: "18px 20px" }}>
        <div
          style={{
            ...SECTION_LABEL,
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>처리 대기 운영 큐</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <CountTile
            label="결제 승인"
            value={counts.paymentPending}
            href="/admin/payment-approvals"
            urgent
          />
          <CountTile
            label="분쟁"
            value={counts.disputesOpen}
            href="/admin/disputes"
            urgent
          />
          <CountTile
            label="정산 대기"
            value={counts.payoutsPending}
            href="/admin/payouts"
          />
          <CountTile
            label="Webhook 24h 실패"
            value={counts.webhookFails24h}
            href="/admin/webhooks"
            urgent
          />
        </div>
      </div>

      {/* 우: System Health */}
      <div style={{ ...CARD, padding: "18px 20px" }}>
        <div
          style={{
            ...SECTION_LABEL,
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>시스템 상태</span>
          {health && (
            <span
              style={{
                display: "inline-flex",
                gap: 6,
                alignItems: "center",
                fontSize: 11,
                color: "var(--color-dim)",
              }}
            >
              <StatusDot
                status={
                  health.status === "ok"
                    ? "ok"
                    : health.status === "degraded"
                      ? "warning"
                      : "error"
                }
              />
              {health.status.toUpperCase()}
            </span>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>
            /api/health fetch 실패: {error}
          </p>
        )}

        {!health && !error && (
          <p style={{ fontSize: 13, color: "var(--color-dim)", margin: 0 }}>
            상태 확인 중…
          </p>
        )}

        {health && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {checkKeys.map(({ key, label }) => {
              const check = health.checks[key];
              if (!check) return null;
              const extra = (() => {
                if (key === "db" && typeof check.latency_ms === "number") {
                  return `${check.latency_ms}ms`;
                }
                if (key === "rate_limit" && typeof check.backend === "string") {
                  return check.backend;
                }
                if (check.status === "error" && Array.isArray(check.missing)) {
                  return `${(check.missing as string[]).length}개 누락`;
                }
                return null;
              })();

              return (
                <div
                  key={key}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-dark)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <StatusDot status={check.status} />
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {extra && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-dim)",
                        fontFamily: "monospace",
                      }}
                    >
                      {extra}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
