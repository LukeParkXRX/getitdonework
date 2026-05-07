"use client";

import { useState, useCallback } from "react";

type UserInfo = { id: string; name: string | null; email: string | null } | null;
type PackageInfo = { id: string; name: string } | null;

export type PurchaseOrder = {
  id: string;
  status: string;
  credits: number;
  amount_krw: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  rejected_at: string | null;
  approved_at: string | null;
  users: UserInfo;
  credit_packages: PackageInfo;
};

type Stats = {
  pending: number;
  rejectedThisMonth: number;
};

type PolicySettings = {
  autoApproveThresholdCents: number;
  approvalExpiryDays: number;
};

type Props = {
  initialOrders: PurchaseOrder[];
  stats: Stats;
  initialSettings: PolicySettings;
};

function formatKrw(amount: number) {
  return amount.toLocaleString("ko-KR") + "원";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusLabel(status: string) {
  switch (status) {
    case "paid_pending_admin": return "승인 대기";
    case "rejected": return "거절·환불";
    case "expired": return "만료";
    default: return status;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "paid_pending_admin": return "#f59e0b";
    case "rejected": return "#ef4444";
    case "expired": return "#6b7280";
    default: return "var(--color-muted)";
  }
}

export default function PaymentApprovalsClient({ initialOrders, stats, initialSettings }: Props) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);
  const [currentStats, setCurrentStats] = useState<Stats>(stats);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // 거절 모달
  const [rejectTarget, setRejectTarget] = useState<PurchaseOrder | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // 승인 confirm
  const [approveTarget, setApproveTarget] = useState<PurchaseOrder | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // 정책 설정
  const [policySettings, setPolicySettings] = useState<PolicySettings>(initialSettings);
  const [policyForm, setPolicyForm] = useState({
    threshold: String(Math.round(initialSettings.autoApproveThresholdCents / 1)),
    expiryDays: String(initialSettings.approvalExpiryDays),
  });
  const [policySaving, setPolicySaving] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payment-approvals");
      if (!res.ok) return;
      const json = await res.json() as { orders: PurchaseOrder[]; stats: Stats };
      setOrders(json.orders);
      setCurrentStats(json.stats);
    } catch { /* noop */ }
  }, []);

  const handleApprove = useCallback(async (order: PurchaseOrder) => {
    setApproveLoading(true);
    setLoadingId(order.id);
    try {
      const res = await fetch(`/api/admin/payment-approvals/${order.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "오류 발생");
      showToast(`승인 완료 — ${order.credits}크레딧 충전됨`, true);
      setApproveTarget(null);
      await refreshOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "승인 실패", false);
    } finally {
      setApproveLoading(false);
      setLoadingId(null);
    }
  }, [refreshOrders]);

  const handleRejectSubmit = useCallback(async () => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    setLoadingId(rejectTarget.id);
    try {
      const res = await fetch(`/api/admin/payment-approvals/${rejectTarget.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason || undefined }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "오류 발생");
      showToast("거절 및 환불 처리 완료", true);
      setRejectTarget(null);
      setRejectReason("");
      await refreshOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "거절 실패", false);
    } finally {
      setRejectLoading(false);
      setLoadingId(null);
    }
  }, [rejectTarget, rejectReason, refreshOrders]);

  const handlePolicySave = useCallback(async () => {
    const thresholdVal = parseInt(policyForm.threshold.replace(/,/g, ""), 10);
    const expiryVal = parseInt(policyForm.expiryDays, 10);
    if (isNaN(thresholdVal) || thresholdVal < 0 || isNaN(expiryVal) || expiryVal < 1) {
      showToast("유효하지 않은 값입니다.", false);
      return;
    }
    setPolicySaving(true);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_approve_threshold_cents: thresholdVal,
          approval_expiry_days: expiryVal,
        }),
      });
      const json = await res.json() as { settings?: { auto_approve_threshold_cents: number; approval_expiry_days: number }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "저장 실패");
      if (json.settings) {
        setPolicySettings({
          autoApproveThresholdCents: json.settings.auto_approve_threshold_cents,
          approvalExpiryDays: json.settings.approval_expiry_days,
        });
      }
      showToast("정책 저장 완료", true);
      setPolicyOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "저장 실패", false);
    } finally {
      setPolicySaving(false);
    }
  }, [policyForm]);

  const pendingOrders = orders.filter((o) => o.status === "paid_pending_admin");
  const historyOrders = orders.filter((o) => o.status !== "paid_pending_admin");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-text)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          결제 승인 관리
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 6 }}>
          임계 금액 초과 결제를 검토하고 승인 또는 거절합니다.
        </p>
      </div>

      {/* 통계 띠 */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { label: "승인 대기", value: currentStats.pending, color: "#f59e0b" },
          { label: "이번달 거절", value: currentStats.rejectedThisMonth, color: "#ef4444" },
          { label: "자동승인 임계", value: formatKrw(policySettings.autoApproveThresholdCents), color: "var(--color-accent)" },
          { label: "승인 만료 기간", value: `${policySettings.approvalExpiryDays}일`, color: "var(--color-muted)" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              flex: "1 1 180px",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "18px 22px",
            }}
          >
            <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: "var(--font-display)" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* 정책 설정 카드 */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: "18px 22px",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: 15 }}>결제 정책 설정</span>
            <span style={{ color: "var(--color-muted)", fontSize: 13, marginLeft: 12 }}>
              임계 금액 이하는 즉시 충전, 초과 시 관리자 승인 필요
            </span>
          </div>
          <button
            onClick={() => {
              setPolicyForm({
                threshold: String(policySettings.autoApproveThresholdCents),
                expiryDays: String(policySettings.approvalExpiryDays),
              });
              setPolicyOpen((v) => !v);
            }}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-text)",
              fontSize: 13,
              padding: "6px 14px",
              cursor: "pointer",
            }}
          >
            {policyOpen ? "닫기" : "편집"}
          </button>
        </div>

        {policyOpen && (
          <div style={{ marginTop: 18, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ fontSize: 13, color: "var(--color-muted)", display: "block", marginBottom: 6 }}>
                자동승인 임계 금액 (원)
              </label>
              <input
                type="number"
                min={0}
                value={policyForm.threshold}
                onChange={(e) => setPolicyForm((f) => ({ ...f, threshold: e.target.value }))}
                style={{
                  width: "100%",
                  background: "var(--color-dark)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-text)",
                  fontSize: 15,
                  padding: "8px 12px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ fontSize: 13, color: "var(--color-muted)", display: "block", marginBottom: 6 }}>
                승인 만료 일수
              </label>
              <input
                type="number"
                min={1}
                value={policyForm.expiryDays}
                onChange={(e) => setPolicyForm((f) => ({ ...f, expiryDays: e.target.value }))}
                style={{
                  width: "100%",
                  background: "var(--color-dark)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-text)",
                  fontSize: 15,
                  padding: "8px 12px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={handlePolicySave}
              disabled={policySaving}
              style={{
                background: "var(--color-accent)",
                color: "var(--color-black)",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                padding: "9px 22px",
                cursor: policySaving ? "not-allowed" : "pointer",
                opacity: policySaving ? 0.7 : 1,
                flexShrink: 0,
              }}
            >
              {policySaving ? "저장 중..." : "저장"}
            </button>
          </div>
        )}
      </div>

      {/* 승인 대기 테이블 */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", marginBottom: 14 }}>
          승인 대기 ({pendingOrders.length})
        </h2>
        {pendingOrders.length === 0 ? (
          <div
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "40px 24px",
              textAlign: "center",
              color: "var(--color-muted)",
              fontSize: 15,
            }}
          >
            승인 대기중인 결제가 없습니다
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["결제 일시", "사용자", "패키지", "금액", "만료까지", "액션"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 14px",
                        fontSize: 13,
                        color: "var(--color-muted)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((order) => {
                  const days = daysUntil(order.expires_at);
                  const isLoading = loadingId === order.id;
                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: "transparent",
                      }}
                    >
                      <td style={{ padding: "14px 14px", fontSize: 13, color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ padding: "14px 14px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                          {order.users?.name ?? "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                          {order.users?.email ?? "—"}
                        </div>
                      </td>
                      <td style={{ padding: "14px 14px", fontSize: 14, color: "var(--color-text)" }}>
                        {order.credit_packages?.name ?? "—"}
                        <span style={{ color: "var(--color-muted)", fontSize: 12, marginLeft: 6 }}>
                          ({order.credits.toLocaleString()}c)
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", fontSize: 15, fontWeight: 700, color: "var(--color-text)", whiteSpace: "nowrap" }}>
                        {formatKrw(order.amount_krw)}
                      </td>
                      <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                        {days === null ? (
                          <span style={{ color: "var(--color-muted)", fontSize: 13 }}>—</span>
                        ) : days <= 0 ? (
                          <span style={{ color: "#ef4444", fontSize: 13, fontWeight: 600 }}>만료됨</span>
                        ) : (
                          <span style={{ color: days <= 2 ? "#f59e0b" : "var(--color-muted)", fontSize: 13 }}>
                            {days}일 남음
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 14px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            disabled={isLoading}
                            onClick={() => setApproveTarget(order)}
                            style={{
                              background: "var(--color-accent)",
                              color: "var(--color-black)",
                              border: "none",
                              borderRadius: 7,
                              fontWeight: 700,
                              fontSize: 13,
                              padding: "6px 14px",
                              cursor: isLoading ? "not-allowed" : "pointer",
                              opacity: isLoading ? 0.6 : 1,
                            }}
                          >
                            승인
                          </button>
                          <button
                            disabled={isLoading}
                            onClick={() => { setRejectTarget(order); setRejectReason(""); }}
                            style={{
                              background: "transparent",
                              color: "#ef4444",
                              border: "1px solid #ef4444",
                              borderRadius: 7,
                              fontWeight: 600,
                              fontSize: 13,
                              padding: "6px 14px",
                              cursor: isLoading ? "not-allowed" : "pointer",
                              opacity: isLoading ? 0.6 : 1,
                            }}
                          >
                            거절
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 처리 이력 */}
      {historyOrders.length > 0 && (
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", marginBottom: 14 }}>
            처리 이력
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["결제 일시", "사용자", "패키지", "금액", "상태", "사유"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 14px",
                        fontSize: 13,
                        color: "var(--color-muted)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                        {order.users?.name ?? "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                        {order.users?.email ?? "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 14, color: "var(--color-text)" }}>
                      {order.credit_packages?.name ?? "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>
                      {formatKrw(order.amount_krw)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          background: `${statusColor(order.status)}22`,
                          color: statusColor(order.status),
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--color-muted)", maxWidth: 240 }}>
                      {order.rejection_reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 승인 confirm 모달 */}
      {approveTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setApproveTarget(null); }}
        >
          <div
            style={{
              background: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: 14,
              padding: "28px 32px",
              width: 420,
              maxWidth: "90vw",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>
              결제 승인 확인
            </h3>
            <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--color-text)" }}>{approveTarget.users?.name ?? "사용자"}</strong>의{" "}
              <strong style={{ color: "var(--color-accent)" }}>{approveTarget.credits.toLocaleString()}크레딧</strong> 결제
              ({formatKrw(approveTarget.amount_krw)})를 승인하면 즉시 크레딧이 충전됩니다.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setApproveTarget(null)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-muted)",
                  fontSize: 14,
                  padding: "8px 18px",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={() => handleApprove(approveTarget)}
                disabled={approveLoading}
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-black)",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "8px 22px",
                  cursor: approveLoading ? "not-allowed" : "pointer",
                  opacity: approveLoading ? 0.7 : 1,
                }}
              >
                {approveLoading ? "처리 중..." : "승인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 거절 모달 */}
      {rejectTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setRejectTarget(null); setRejectReason(""); } }}
        >
          <div
            style={{
              background: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: 14,
              padding: "28px 32px",
              width: 460,
              maxWidth: "90vw",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>
              결제 거절
            </h3>
            <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "0 0 18px", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--color-text)" }}>{rejectTarget.users?.name ?? "사용자"}</strong>의{" "}
              {formatKrw(rejectTarget.amount_krw)} 결제를 거절합니다. Stripe 환불이 자동 처리됩니다.
            </p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, color: "var(--color-muted)", display: "block", marginBottom: 7 }}>
                거절 사유 (선택)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="사용자에게 전달할 거절 사유를 입력하세요."
                style={{
                  width: "100%",
                  background: "var(--color-black)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-text)",
                  fontSize: 14,
                  padding: "10px 12px",
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-muted)",
                  fontSize: 14,
                  padding: "8px 18px",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={rejectLoading}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "8px 22px",
                  cursor: rejectLoading ? "not-allowed" : "pointer",
                  opacity: rejectLoading ? 0.7 : 1,
                }}
              >
                {rejectLoading ? "처리 중..." : "거절 및 환불"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: toast.ok ? "var(--color-accent)" : "#ef4444",
            color: toast.ok ? "var(--color-black)" : "#fff",
            borderRadius: 10,
            padding: "12px 22px",
            fontWeight: 700,
            fontSize: 14,
            zIndex: 2000,
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
