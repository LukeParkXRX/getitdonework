"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import { Modal } from "@/components/ui";

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  programName: string;
  logoUrl?: string;
  inviteCode: string;
  totalCredits: number;
  memberCount: number;
  createdAt: string;
}

const fieldStyle: React.CSSProperties = {
  backgroundColor: "oklch(0.14 0.005 280 / 0.6)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "10px 14px",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
  color: "var(--color-text)",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  letterSpacing: "0.09em",
  textTransform: "uppercase" as const,
  color: "var(--color-dim)",
  marginBottom: "6px",
  display: "block",
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function OrganizationsAdminClient({ initial }: { initial: OrganizationRecord[] }) {
  const { success, error: toastError } = useToast();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<OrganizationRecord[]>(initial);
  const [saving, setSaving] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    programName: "",
    logoUrl: "",
    inviteCode: "",
    totalCredits: "",
  });

  // Edit modal
  const [editOrg, setEditOrg] = useState<OrganizationRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    programName: "",
    logoUrl: "",
    inviteCode: "",
    totalCredits: "",
  });

  // Credit modal
  const [creditOrg, setCreditOrg] = useState<OrganizationRecord | null>(null);
  const [creditAmount, setCreditAmount] = useState("");

  // Delete confirm
  const [deleteOrg, setDeleteOrg] = useState<OrganizationRecord | null>(null);

  function openEdit(org: OrganizationRecord) {
    setEditOrg(org);
    setEditForm({
      name: org.name,
      slug: org.slug,
      programName: org.programName,
      logoUrl: org.logoUrl ?? "",
      inviteCode: org.inviteCode,
      totalCredits: String(org.totalCredits),
    });
  }

  function openCredit(org: OrganizationRecord) {
    setCreditOrg(org);
    setCreditAmount("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          slug: createForm.slug,
          programName: createForm.programName,
          logoUrl: createForm.logoUrl || undefined,
          inviteCode: createForm.inviteCode,
          totalCredits: Number(createForm.totalCredits) || 0,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        toastError(body.error ?? "기관 등록에 실패했습니다");
        return;
      }
      const body = (await res.json()) as { org: OrganizationRecord };
      setOrgs((prev) => [body.org, ...prev]);
      success(`기관 "${body.org.name}"이 등록되었습니다`);
      setCreateOpen(false);
      setCreateForm({ name: "", slug: "", programName: "", logoUrl: "", inviteCode: "", totalCredits: "" });
    } catch {
      toastError("네트워크 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editOrg) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${editOrg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          programName: editForm.programName,
          logoUrl: editForm.logoUrl || undefined,
          totalCredits: Number(editForm.totalCredits) || editOrg.totalCredits,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        toastError(body.error ?? "수정에 실패했습니다");
        return;
      }
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === editOrg.id
            ? {
                ...o,
                name: editForm.name,
                programName: editForm.programName,
                logoUrl: editForm.logoUrl || undefined,
                totalCredits: Number(editForm.totalCredits) || o.totalCredits,
              }
            : o
        )
      );
      success("기관 정보가 수정되었습니다");
      setEditOrg(null);
    } catch {
      toastError("네트워크 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!creditOrg) return;
    const amount = Number(creditAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      const newTotal = creditOrg.totalCredits + amount;
      const res = await fetch(`/api/admin/organizations/${creditOrg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalCredits: newTotal }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        toastError(body.error ?? "크레딧 추가에 실패했습니다");
        return;
      }
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === creditOrg.id ? { ...o, totalCredits: newTotal } : o
        )
      );
      success(`${creditOrg.name}에 ${amount.toLocaleString()} 크레딧이 추가되었습니다`);
      setCreditOrg(null);
      setCreditAmount("");
    } catch {
      toastError("네트워크 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteOrg) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${deleteOrg.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        toastError(body.error ?? "삭제에 실패했습니다");
        return;
      }
      setOrgs((prev) => prev.filter((o) => o.id !== deleteOrg.id));
      success(`기관 "${deleteOrg.name}"이 삭제되었습니다`);
      setDeleteOrg(null);
    } catch {
      toastError("네트워크 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      success(`초대코드 "${text}"가 클립보드에 복사되었습니다`);
    });
  }

  const totalCredits = orgs.reduce((sum, org) => sum + org.totalCredits, 0);
  const totalMembers = orgs.reduce((sum, org) => sum + org.memberCount, 0);

  return (
    <div style={{ fontFamily: "var(--font-body)", color: "var(--color-text)", maxWidth: 1100 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            기관 관리
          </h1>
          <span style={{ fontSize: 15, color: "var(--color-dim)", fontWeight: 400 }}>
            총 {orgs.length}개 기관
          </span>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            background: "var(--color-accent)",
            color: "var(--color-black)",
            border: "none",
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.01em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          <span style={{ fontSize: 17 }}>+</span>
          새 기관 등록
        </button>
      </div>

      {/* Organization Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {orgs.map((org) => {
          const isHovered = hoveredCard === org.id;

          return (
            <div
              key={org.id}
              onMouseEnter={() => setHoveredCard(org.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: "var(--color-card)",
                border: `1px solid ${isHovered ? "rgba(123, 104, 238, 0.4)" : "var(--color-border)"}`,
                borderRadius: 12,
                padding: "22px 24px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                transition: "border-color 0.18s",
              }}
            >
              {/* Card Top */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                  {org.logoUrl && (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      style={{
                        width: 32,
                        height: 32,
                        objectFit: "contain",
                        borderRadius: 6,
                        background: "#fff",
                        padding: "3px",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 19,
                        letterSpacing: "-0.02em",
                        color: "var(--color-text)",
                        lineHeight: 1.2,
                      }}
                    >
                      {org.name}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--color-dim)",
                        marginTop: 3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {org.programName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  marginBottom: 16,
                  borderTop: "1px solid var(--color-border)",
                  borderBottom: "1px solid var(--color-border)",
                  padding: "12px 0",
                }}
              >
                <StatItem label="멤버" value={org.memberCount} unit="명" />
                <div style={{ width: 1, background: "var(--color-border)" }} />
                <StatItem label="총 크레딧" value={org.totalCredits.toLocaleString()} unit="크레딧" />
                <div style={{ width: 1, background: "var(--color-border)" }} />
                <StatItem label="slug" value={org.slug} />
              </div>

              {/* Info Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                <InfoRow label="초대코드">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--color-text)",
                        background: "var(--color-black)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 5,
                        padding: "2px 8px",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {org.inviteCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(org.inviteCode)}
                      title="복사"
                      style={{
                        background: "none",
                        border: "1px solid var(--color-border)",
                        borderRadius: 5,
                        padding: "3px 7px",
                        cursor: "pointer",
                        color: "var(--color-dim)",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "border-color 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.borderColor = "var(--color-accent)";
                        el.style.color = "var(--color-accent)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.borderColor = "var(--color-border)";
                        el.style.color = "var(--color-dim)";
                      }}
                    >
                      <CopyIcon />
                      복사
                    </button>
                  </div>
                </InfoRow>
                <InfoRow label="총 크레딧">
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
                    {org.totalCredits.toLocaleString()}
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: 14, color: "var(--color-dim)", marginLeft: 4 }}>
                      크레딧
                    </span>
                  </span>
                </InfoRow>
              </div>

              {/* Action Row */}
              <div style={{ display: "flex", gap: 8, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
                <GhostButton onClick={() => openCredit(org)} accent>크레딧 추가</GhostButton>
                <GhostButton onClick={() => openEdit(org)}>수정</GhostButton>
                <GhostButton onClick={() => setDeleteOrg(org)} danger>삭제</GhostButton>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Summary */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: "20px 28px",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-dim)",
            fontFamily: "var(--font-display)",
            marginBottom: 16,
          }}
        >
          총괄 요약
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          <SummaryItem label="총 기관" value={String(orgs.length)} unit="개" color="var(--color-text)" />
          <div style={{ width: 1, background: "var(--color-border)", margin: "0 28px" }} />
          <SummaryItem label="총 크레딧" value={totalCredits.toLocaleString()} unit="크레딧" color="var(--color-accent)" />
          <div style={{ width: 1, background: "var(--color-border)", margin: "0 28px" }} />
          <SummaryItem label="총 멤버" value={String(totalMembers)} unit="명" color="var(--color-green)" />
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={createOpen} onClose={() => !saving && setCreateOpen(false)} title="새 기관 등록" size="md">
        <form onSubmit={handleCreate}>
          <FormField label="기관명">
            <input required style={fieldStyle} value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="예: KOTRA" />
          </FormField>
          <FormField label="Slug">
            <input required style={fieldStyle} value={createForm.slug}
              onChange={(e) => setCreateForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="예: kotra" />
          </FormField>
          <FormField label="프로그램명">
            <input required style={fieldStyle} value={createForm.programName}
              onChange={(e) => setCreateForm((p) => ({ ...p, programName: e.target.value }))}
              placeholder="예: K-Startup Grand Challenge" />
          </FormField>
          <FormField label="로고 URL (선택)">
            <input style={fieldStyle} value={createForm.logoUrl}
              onChange={(e) => setCreateForm((p) => ({ ...p, logoUrl: e.target.value }))}
              placeholder="https://..." />
          </FormField>
          <FormField label="초대코드">
            <input required style={fieldStyle} value={createForm.inviteCode}
              onChange={(e) => setCreateForm((p) => ({ ...p, inviteCode: e.target.value }))}
              placeholder="예: KOTRA2026" />
          </FormField>
          <FormField label="총 크레딧">
            <input required type="number" min={0} style={fieldStyle} value={createForm.totalCredits}
              onChange={(e) => setCreateForm((p) => ({ ...p, totalCredits: e.target.value }))}
              placeholder="예: 200" />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <GhostButton onClick={() => setCreateOpen(false)}>취소</GhostButton>
            <SubmitButton saving={saving}>등록</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={!!editOrg} onClose={() => !saving && setEditOrg(null)} title="기관 정보 수정" size="md">
        <form onSubmit={handleEdit}>
          <FormField label="기관명">
            <input required style={fieldStyle} value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
          </FormField>
          <FormField label="Slug">
            <input required style={fieldStyle} value={editForm.slug}
              onChange={(e) => setEditForm((p) => ({ ...p, slug: e.target.value }))} />
          </FormField>
          <FormField label="프로그램명">
            <input required style={fieldStyle} value={editForm.programName}
              onChange={(e) => setEditForm((p) => ({ ...p, programName: e.target.value }))} />
          </FormField>
          <FormField label="로고 URL (선택)">
            <input style={fieldStyle} value={editForm.logoUrl}
              onChange={(e) => setEditForm((p) => ({ ...p, logoUrl: e.target.value }))} />
          </FormField>
          <FormField label="초대코드">
            <input required style={fieldStyle} value={editForm.inviteCode}
              onChange={(e) => setEditForm((p) => ({ ...p, inviteCode: e.target.value }))} />
          </FormField>
          <FormField label="총 크레딧">
            <input required type="number" min={0} style={fieldStyle} value={editForm.totalCredits}
              onChange={(e) => setEditForm((p) => ({ ...p, totalCredits: e.target.value }))} />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <GhostButton onClick={() => setEditOrg(null)}>취소</GhostButton>
            <SubmitButton saving={saving}>저장</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* CREDIT MODAL */}
      <Modal isOpen={!!creditOrg} onClose={() => !saving && setCreditOrg(null)} title="크레딧 추가" size="sm">
        <form onSubmit={handleCredit}>
          {creditOrg && (
            <div style={{ padding: "10px 14px", marginBottom: 20, background: "oklch(0.14 0.005 280 / 0.4)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: 13, color: "var(--color-dim)", marginBottom: 4 }}>대상 기관</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-display)" }}>{creditOrg.name}</div>
              <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 2 }}>현재 {creditOrg.totalCredits.toLocaleString()} 크레딧</div>
            </div>
          )}
          <FormField label="추가할 크레딧 수량">
            <input required type="number" min={1} style={fieldStyle} value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)} placeholder="예: 50" autoFocus />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <GhostButton onClick={() => setCreditOrg(null)}>취소</GhostButton>
            <SubmitButton saving={saving}>추가</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={!!deleteOrg} onClose={() => !saving && setDeleteOrg(null)} title="기관 삭제" size="sm">
        {deleteOrg && (
          <div>
            <p style={{ fontSize: 15, color: "var(--color-text)", fontFamily: "var(--font-body)", marginBottom: 8 }}>
              <strong>{deleteOrg.name}</strong>을(를) 삭제하시겠습니까?
            </p>
            <p style={{ fontSize: 14, color: "var(--color-dim)", fontFamily: "var(--font-body)", marginBottom: 24 }}>
              소속 멤버의 org_id는 null로 변경됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <GhostButton onClick={() => setDeleteOrg(null)}>취소</GhostButton>
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{
                  padding: "8px 16px", borderRadius: 7, border: "none",
                  background: "var(--color-red)", color: "#fff",
                  fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)",
                  cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatItem({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "0 12px" }}>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--color-text)", lineHeight: 1.1 }}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-dim)", marginLeft: 3 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 13, color: "var(--color-dim)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 14, color: "var(--color-dim)", flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}

function GhostButton({ onClick, children, accent, danger }: { onClick: () => void; children: React.ReactNode; accent?: boolean; danger?: boolean }) {
  const borderColor = danger ? "oklch(0.5 0.18 20 / 0.4)" : accent ? "var(--color-accent)" : "var(--color-border)";
  const color = danger ? "var(--color-red)" : accent ? "var(--color-accent)" : "var(--color-dim)";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 7, padding: "6px 13px", fontSize: 14, fontWeight: 600, color, cursor: "pointer", fontFamily: "var(--font-body)", transition: "background 0.15s, color 0.15s, border-color 0.15s" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        if (danger) { el.style.background = "oklch(0.3 0.1 20 / 0.3)"; el.style.borderColor = "var(--color-red)"; }
        else if (accent) { el.style.background = "rgba(123, 104, 238, 0.12)"; el.style.borderColor = "var(--color-accent)"; }
        else { el.style.background = "var(--color-dark)"; el.style.color = "var(--color-text)"; el.style.borderColor = "var(--color-text)"; }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = "none";
        el.style.color = color;
        el.style.borderColor = borderColor;
      }}
    >
      {children}
    </button>
  );
}

function SubmitButton({ children, saving }: { children: React.ReactNode; saving: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      style={{ background: "var(--color-accent)", color: "var(--color-black)", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}
    >
      {saving ? "처리 중..." : children}
    </button>
  );
}

function SummaryItem({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 13, color: "var(--color-dim)", letterSpacing: "0.02em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 15, color: "var(--color-dim)", fontWeight: 400 }}>{unit}</span>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
