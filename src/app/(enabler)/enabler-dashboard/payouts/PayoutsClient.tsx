"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PayoutAccount = {
  user_id: string;
  stripe_account_id: string | null;
  status: "pending" | "incomplete" | "active" | "restricted" | "rejected";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  bank_account_last4: string | null;
  bank_currency: string | null;
  bank_country: string | null;
  requirements_pending: string[] | null;
} | null;

export type InvoiceSummary = {
  id: string;
  period_start: string;
  period_end: string;
  total_credits: number;
  total_net: number;
  status: string;
  created_at: string;
};

export type EarningsSummary = {
  accrued: number;
  invoiced: number;
  paid: number;
};

type Props = {
  account: PayoutAccount;
  invoices: InvoiceSummary[];
  earnings: EarningsSummary;
};

// ─── 스타일 상수 ──────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: "24px",
  marginBottom: 20,
};

const label: React.CSSProperties = {
  fontSize: 12,
  color: "var(--color-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  marginBottom: 6,
};

const btn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 20px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "var(--font-display)",
  cursor: "pointer",
  border: "none",
  background: "var(--color-accent)",
  color: "var(--color-bg)",
};

const btnOutline: React.CSSProperties = {
  ...btn,
  background: "transparent",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
};

function statusBadge(s: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "대기 중", color: "var(--color-amber)", bg: "oklch(0.78 0.15 75 / 0.1)" },
    approved: { label: "승인됨", color: "var(--color-green)", bg: "oklch(0.72 0.19 155 / 0.1)" },
    paid: { label: "지급 완료", color: "var(--color-accent)", bg: "var(--color-accent-dim, rgba(200,255,0,0.1))" },
    cancelled: { label: "취소됨", color: "var(--color-muted)", bg: "rgba(107,114,128,0.1)" },
  };
  const cfg = map[s] ?? { label: s, color: "var(--color-muted)", bg: "transparent" };
  return (
    <span style={{
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function PayoutsClient({ account, invoices, earnings }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enabler/payout-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "US", business_type: "individual" }),
      });
      const json = await res.json() as { onboarding_url?: string; error?: string };
      if (!res.ok || !json.onboarding_url) {
        setError(json.error ?? "계정 생성에 실패했습니다.");
        return;
      }
      window.location.href = json.onboarding_url;
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enabler/payout-account/onboarding-link", { method: "POST" });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "온보딩 링크 생성에 실패했습니다.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enabler/payout-account/refresh", { method: "POST" });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "정보 갱신에 실패했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const accountStatus = account?.status ?? "pending";

  return (
    <div style={{ color: "var(--color-text)", fontFamily: "var(--font-body)", maxWidth: 720 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", margin: 0 }}>
          정산 계정
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-muted)", marginTop: 6 }}>
          Stripe Connect를 통해 미국 은행 계좌로 정산을 받을 수 있습니다.
        </p>
      </div>

      {/* 에러 */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 20,
          fontSize: 14,
          color: "#ef4444",
        }}>
          {error}
        </div>
      )}

      {/* 상태 카드 */}
      <div style={card}>
        <div style={{ ...label }}>정산 계정 상태</div>

        {/* pending / 계정 없음 */}
        {(!account || accountStatus === "pending") && (
          <div>
            <p style={{ fontSize: 15, color: "var(--color-muted)", margin: "12px 0 20px" }}>
              아직 Stripe 정산 계정이 연결되지 않았습니다. 계정을 만들면 미국 은행으로 직접 정산 받을 수 있습니다.
            </p>
            <button style={btn} onClick={handleCreate} disabled={loading}>
              {loading ? "처리 중..." : "정산 계정 만들기"}
            </button>
          </div>
        )}

        {/* incomplete */}
        {accountStatus === "incomplete" && (
          <div>
            <p style={{ fontSize: 15, color: "var(--color-muted)", margin: "12px 0 8px" }}>
              온보딩이 완료되지 않았습니다. 아래 필수 항목을 입력해야 정산을 받을 수 있습니다.
            </p>
            {account?.requirements_pending && account.requirements_pending.length > 0 && (
              <ul style={{ margin: "8px 0 16px", paddingLeft: 20, fontSize: 13, color: "var(--color-muted)" }}>
                {account.requirements_pending.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <button style={btn} onClick={handleContinue} disabled={loading}>
              {loading ? "처리 중..." : "온보딩 계속하기"}
            </button>
          </div>
        )}

        {/* active */}
        {accountStatus === "active" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%", background: "var(--color-green)",
                display: "inline-block",
              }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-green)" }}>정산 계정 활성화됨</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={label}>은행 국가</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{account?.bank_country ?? "-"}</div>
              </div>
              <div>
                <div style={label}>계좌 끝 4자리</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                  {account?.bank_account_last4 ? `****${account.bank_account_last4}` : "-"}
                </div>
              </div>
              <div>
                <div style={label}>통화</div>
                <div style={{ fontSize: 15, fontWeight: 600, textTransform: "uppercase" }}>
                  {account?.bank_currency ?? "-"}
                </div>
              </div>
            </div>
            <button style={btnOutline} onClick={handleRefresh} disabled={loading}>
              {loading ? "갱신 중..." : "정보 새로고침"}
            </button>
          </div>
        )}

        {/* restricted / rejected */}
        {(accountStatus === "restricted" || accountStatus === "rejected") && (
          <div>
            <p style={{ fontSize: 15, color: "var(--color-red)", margin: "12px 0 12px" }}>
              {accountStatus === "rejected"
                ? "정산 계정이 거부되었습니다. 고객센터에 문의해주세요."
                : "정산 계정에 제한이 있습니다. Stripe에서 추가 정보를 요청하고 있습니다."}
            </p>
            {account?.requirements_pending && account.requirements_pending.length > 0 && (
              <ul style={{ margin: "0 0 16px", paddingLeft: 20, fontSize: 13, color: "var(--color-muted)" }}>
                {account.requirements_pending.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            {accountStatus === "restricted" && (
              <button style={btn} onClick={handleContinue} disabled={loading}>
                {loading ? "처리 중..." : "Stripe에서 해결하기"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 누적 수익 */}
      <div style={card}>
        <div style={{ ...label, marginBottom: 16 }}>누적 수익 (USD 환산)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {([
            { key: "accrued", title: "적립됨", value: earnings.accrued, color: "var(--color-text)" },
            { key: "invoiced", title: "인보이스됨", value: earnings.invoiced, color: "var(--color-amber)" },
            { key: "paid", title: "지급 완료", value: earnings.paid, color: "var(--color-green)" },
          ] as const).map(({ key, title, value, color }) => (
            <div key={key}>
              <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color }}>
                ${value.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 정산 인보이스 */}
      <div style={card}>
        <div style={{ ...label, marginBottom: 16 }}>최근 정산 인보이스</div>
        {invoices.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
            아직 인보이스가 없습니다.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invoices.map((inv) => (
              <div key={inv.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--color-bg)",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatDate(inv.period_start)} ~ {formatDate(inv.period_end)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
                    {Number(inv.total_credits).toLocaleString("ko-KR")} 크레딧 · {Number(inv.total_net).toLocaleString("ko-KR")}원
                  </div>
                </div>
                {statusBadge(inv.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
