"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GlobalSetting = {
  id: string;
  platform_fee_pct: number;
  credit_rate: number;
  min_payout: number;
  effective_from: string;
};

type EnablerInfo = { id: string; full_name: string | null; email: string | null } | null;

type EnablerSetting = {
  id: string;
  enabler_id: string;
  platform_fee_pct: number;
  credit_rate: number;
  min_payout: number;
  effective_from: string;
  enabler: EnablerInfo;
};

type Props = {
  globalSettings: GlobalSetting[];
  enablerSettings: EnablerSetting[];
};

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function PayoutSettingsClient({ globalSettings, enablerSettings }: Props) {
  const router = useRouter();
  const current = globalSettings[0] ?? null;

  const [feePct, setFeePct] = useState<string>(current ? String(current.platform_fee_pct) : "20");
  const [creditRate, setCreditRate] = useState<string>(current ? String(current.credit_rate) : "5");
  const [minPayout, setMinPayout] = useState<string>(current ? String(current.min_payout) : "50");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");

  async function handleSave() {
    const fee = parseFloat(feePct);
    const rate = parseFloat(creditRate);
    const minP = parseFloat(minPayout);

    if (isNaN(fee) || fee < 0 || fee > 100) {
      setMsg("수수료는 0~100 사이 값이어야 합니다."); setMsgType("err"); return;
    }
    if (isNaN(rate) || rate <= 0) {
      setMsg("크레딧 단가는 0보다 커야 합니다."); setMsgType("err"); return;
    }
    if (isNaN(minP) || minP < 0) {
      setMsg("최소 지급액은 0 이상이어야 합니다."); setMsgType("err"); return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/payout-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabler_id: null,
          platform_fee_pct: fee,
          credit_rate: rate,
          min_payout: minP,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setMsg("오류: " + (json.error ?? "알 수 없는 오류")); setMsgType("err"); return; }
      setMsg("글로벌 정책이 업데이트되었습니다."); setMsgType("ok");
      router.refresh();
    } catch {
      setMsg("네트워크 오류가 발생했습니다."); setMsgType("err");
    } finally {
      setSaving(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    padding: "24px 28px",
    marginBottom: 24,
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--color-black)",
    border: "1px solid var(--color-border)",
    borderRadius: 6,
    padding: "9px 12px",
    fontSize: 14,
    color: "var(--color-text)",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--color-text)",
    display: "block",
    marginBottom: 6,
  };

  return (
    <div style={{ color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", margin: 0 }}>
          정산 정책
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 4 }}>
          글로벌 기본 정책 및 Enabler별 정산 설정
        </p>
      </div>

      {/* 글로벌 정책 편집 */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px" }}>글로벌 기본 정책</h2>

        {msg && (
          <div style={{
            background: msgType === "ok" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${msgType === "ok" ? "#22c55e" : "#ef4444"}`,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 18,
            fontSize: 13,
            color: msgType === "ok" ? "#22c55e" : "#ef4444",
          }}>
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>플랫폼 수수료 (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={feePct}
              onChange={(e) => setFeePct(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>0~100 사이 값</div>
          </div>
          <div>
            <label style={labelStyle}>크레딧 단가 (원/C)</label>
            <input
              type="number"
              min={1}
              step={1}
              value={creditRate}
              onChange={(e) => setCreditRate(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>1크레딧 = N원</div>
          </div>
          <div>
            <label style={labelStyle}>최소 지급액 (원)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={minPayout}
              onChange={(e) => setMinPayout(e.target.value)}
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>이 금액 미만은 정산 보류</div>
          </div>
        </div>

        {current && (
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 16 }}>
            현재 적용: 수수료 {current.platform_fee_pct}% / 단가 {Number(current.credit_rate).toLocaleString("ko-KR")}원 / 최소 {Number(current.min_payout).toLocaleString("ko-KR")}원
            &nbsp;(적용 시각: {formatDatetime(current.effective_from)})
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? "var(--color-muted)" : "var(--color-accent)",
            color: "var(--color-black)",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "var(--font-display)",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "저장 중..." : "정책 저장"}
        </button>
      </div>

      {/* Enabler별 override */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Enabler별 개별 정책</h2>
        {enablerSettings.length === 0 ? (
          <div style={{ color: "var(--color-muted)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
            개별 정책이 설정된 Enabler가 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Enabler", "수수료", "크레딧 단가", "최소 지급액", "적용 시각"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--color-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enablerSettings.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.enabler?.full_name ?? "-"}</div>
                      <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>{s.enabler?.email ?? "-"}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 14 }}>{s.platform_fee_pct}%</td>
                    <td style={{ padding: "12px 14px", fontSize: 14 }}>{Number(s.credit_rate).toLocaleString("ko-KR")}원/C</td>
                    <td style={{ padding: "12px 14px", fontSize: 14 }}>{Number(s.min_payout).toLocaleString("ko-KR")}원</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--color-muted)" }}>{formatDatetime(s.effective_from)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
