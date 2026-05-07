"use client";

import { useState, useCallback } from "react";

export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  price_krw: number;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

type ModalMode = "create" | "edit";

type FormState = {
  name: string;
  credits: string;
  price_krw: string;
  stripe_price_id: string;
  is_active: boolean;
  sort_order: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  credits: "",
  price_krw: "",
  stripe_price_id: "",
  is_active: true,
  sort_order: "0",
};

function pkgToForm(pkg: CreditPackage): FormState {
  return {
    name: pkg.name,
    credits: String(pkg.credits),
    price_krw: String(pkg.price_krw),
    stripe_price_id: pkg.stripe_price_id ?? "",
    is_active: pkg.is_active,
    sort_order: String(pkg.sort_order),
  };
}

export default function CreditPackagesAdminClient({
  initialPackages,
}: {
  initialPackages: CreditPackage[];
}) {
  const [packages, setPackages] = useState<CreditPackage[]>(initialPackages);
  const [modal, setModal] = useState<{ mode: ModalMode; pkg?: CreditPackage } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CreditPackage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setModal({ mode: "create" });
  };

  const openEdit = (pkg: CreditPackage) => {
    setForm(pkgToForm(pkg));
    setError(null);
    setModal({ mode: "edit", pkg });
  };

  const closeModal = () => {
    setModal(null);
    setError(null);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        credits: parseInt(form.credits, 10),
        price_krw: parseInt(form.price_krw, 10),
        stripe_price_id: form.stripe_price_id.trim() || null,
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order, 10) || 0,
      };

      if (!payload.name || !payload.credits || !payload.price_krw) {
        setError("이름, 크레딧 수, 가격은 필수입니다.");
        return;
      }

      if (modal?.mode === "create") {
        const res = await fetch("/api/admin/credit-packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "저장 실패"); return; }
        setPackages((prev) => [...prev, json.package]);
      } else if (modal?.mode === "edit" && modal.pkg) {
        const res = await fetch(`/api/admin/credit-packages/${modal.pkg.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "수정 실패"); return; }
        setPackages((prev) =>
          prev.map((p) => (p.id === modal.pkg!.id ? json.package : p))
        );
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  }, [form, modal]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/credit-packages/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "삭제 실패");
        return;
      }
      setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    background: "var(--color-black)",
    border: "1px solid var(--color-border)",
    borderRadius: 6,
    color: "var(--color-text)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    color: "var(--color-muted)",
    marginBottom: 4,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 24,
              color: "var(--color-text)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            결제 패키지 관리
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: 13, marginTop: 4 }}>
            스타트업이 구매 가능한 크레딧 패키지를 관리합니다.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: "10px 20px",
            background: "var(--color-accent)",
            color: "var(--color-black)",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          + 패키지 추가
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "var(--color-dark)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {["이름", "크레딧", "가격 (KRW)", "Stripe ID", "상태", "순서", ""].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      color: "var(--color-muted)",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    color: "var(--color-muted)",
                    fontSize: 14,
                  }}
                >
                  등록된 패키지가 없습니다.
                </td>
              </tr>
            )}
            {packages.map((pkg) => (
              <tr
                key={pkg.id}
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.background =
                    "rgba(255,255,255,0.02)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")
                }
              >
                <td style={{ padding: "14px 16px", color: "var(--color-text)", fontSize: 14, fontWeight: 600 }}>
                  {pkg.name}
                </td>
                <td style={{ padding: "14px 16px", color: "var(--color-accent)", fontSize: 14, fontWeight: 700 }}>
                  {pkg.credits.toLocaleString()} C
                </td>
                <td style={{ padding: "14px 16px", color: "var(--color-text)", fontSize: 14 }}>
                  {pkg.price_krw.toLocaleString()}원
                </td>
                <td style={{ padding: "14px 16px", color: "var(--color-muted)", fontSize: 12, fontFamily: "monospace" }}>
                  {pkg.stripe_price_id ?? "—"}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: pkg.is_active
                        ? "oklch(0.35 0.1 145)"
                        : "oklch(0.22 0.01 250)",
                      color: pkg.is_active
                        ? "oklch(0.85 0.18 145)"
                        : "oklch(0.55 0.02 250)",
                    }}
                  >
                    {pkg.is_active ? "활성" : "비활성"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--color-muted)", fontSize: 14 }}>
                  {pkg.sort_order}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => openEdit(pkg)}
                      style={{
                        padding: "5px 12px",
                        background: "transparent",
                        border: "1px solid var(--color-border)",
                        borderRadius: 6,
                        color: "var(--color-text)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setDeleteTarget(pkg)}
                      style={{
                        padding: "5px 12px",
                        background: "transparent",
                        border: "1px solid oklch(0.40 0.15 15)",
                        borderRadius: 6,
                        color: "oklch(0.72 0.18 15)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              background: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              padding: 32,
              width: 480,
              maxWidth: "90vw",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--color-text)",
                margin: "0 0 24px",
              }}
            >
              {modal.mode === "create" ? "패키지 추가" : "패키지 수정"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>이름</label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: Growth"
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>크레딧 수</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.credits}
                    onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
                    placeholder="30"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>가격 (KRW)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.price_krw}
                    onChange={(e) => setForm((f) => ({ ...f, price_krw: e.target.value }))}
                    placeholder="129000"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Stripe Price ID (선택)</label>
                <input
                  style={inputStyle}
                  value={form.stripe_price_id}
                  onChange={(e) => setForm((f) => ({ ...f, stripe_price_id: e.target.value }))}
                  placeholder="price_xxxxx"
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>표시 순서</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      paddingBottom: 10,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
                    />
                    <span style={{ color: "var(--color-text)", fontSize: 14 }}>활성 상태</span>
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <p style={{ color: "oklch(0.72 0.18 15)", fontSize: 13, marginTop: 12 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "9px 20px",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "9px 20px",
                  background: saving ? "var(--color-muted)" : "var(--color-accent)",
                  color: "var(--color-black)",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div
            style={{
              background: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              padding: 32,
              width: 360,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 17,
                color: "var(--color-text)",
                margin: "0 0 12px",
              }}
            >
              패키지 삭제
            </h2>
            <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "0 0 24px" }}>
              <strong style={{ color: "var(--color-text)" }}>{deleteTarget.name}</strong> 패키지를 삭제합니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "9px 20px",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "9px 20px",
                  background: deleting ? "var(--color-muted)" : "oklch(0.45 0.18 15)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
