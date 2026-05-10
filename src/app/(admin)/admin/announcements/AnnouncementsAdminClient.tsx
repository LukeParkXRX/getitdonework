"use client";

import { useState, useTransition } from "react";
import type { AnnouncementRow, OrgOption } from "./page";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "startups", label: "스타트업" },
  { value: "enablers", label: "Enabler" },
  { value: "org_admins", label: "조직 어드민" },
  { value: "super_admins", label: "Super Admin" },
  { value: "org", label: "특정 조직" },
  { value: "specific_users", label: "특정 사용자 (ID 입력)" },
] as const;

const CHANNEL_OPTIONS = [
  { value: "in_app", label: "인앱 알림만" },
  { value: "email", label: "이메일만" },
  { value: "in_app_and_email", label: "인앱 + 이메일" },
] as const;

const AUDIENCE_LABELS: Record<string, string> = {
  all: "전체",
  startups: "스타트업",
  enablers: "Enabler",
  org_admins: "조직 어드민",
  super_admins: "Super Admin",
  org: "특정 조직",
  specific_users: "특정 사용자",
};

const CHANNEL_LABELS: Record<string, string> = {
  in_app: "인앱",
  email: "이메일",
  in_app_and_email: "인앱+이메일",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:   { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  sending: { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa" },
  sent:    { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
  failed:  { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  sending: "발송 중",
  sent: "발송 완료",
  failed: "실패",
};

// ─── 스타일 상수 ───────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-dark)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 14,
  color: "var(--color-text)",
  fontFamily: "var(--font-body)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-dim)",
  marginBottom: 6,
  fontFamily: "var(--font-display)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { open: false }
  | { open: true; mode: "create" };

type FormState = {
  title: string;
  body: string;
  link: string;
  audience: string;
  audience_target_id: string;
  target_user_ids: string;
  channel: string;
};

const DEFAULT_FORM: FormState = {
  title: "",
  body: "",
  link: "",
  audience: "all",
  audience_target_id: "",
  target_user_ids: "",
  channel: "in_app",
};

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function AnnouncementsAdminClient({
  announcements: initial,
  orgs,
}: {
  announcements: AnnouncementRow[];
  orgs: OrgOption[];
}) {
  const [list, setList] = useState<AnnouncementRow[]>(initial);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setForm(DEFAULT_FORM);
    setFormError(null);
    setModal({ open: true, mode: "create" });
  }

  function closeModal() {
    setModal({ open: false });
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(send: boolean) {
    if (!form.title.trim()) { setFormError("제목을 입력하세요"); return; }
    if (!form.body.trim()) { setFormError("본문을 입력하세요"); return; }
    if (form.audience === "org" && !form.audience_target_id) {
      setFormError("조직을 선택하세요"); return;
    }

    setFormError(null);

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      body: form.body.trim(),
      link: form.link.trim() || undefined,
      audience: form.audience,
      channel: form.channel,
      send,
    };
    if (form.audience === "org") {
      payload.audience_target_id = form.audience_target_id;
    }
    if (form.audience === "specific_users") {
      payload.target_user_ids = form.target_user_ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "오류가 발생했습니다");
        return;
      }
      const newItem = data.announcement;
      setList((prev) => [
        {
          id: newItem.id,
          title: newItem.title,
          audience: newItem.audience,
          channel: newItem.channel,
          status: newItem.status,
          recipient_count: newItem.recipient_count ?? 0,
          sent_count: newItem.sent_count ?? 0,
          failed_count: newItem.failed_count ?? 0,
          created_at: newItem.created_at,
          sent_at: newItem.sent_at ?? null,
          created_by: newItem.created_by,
          creator_name: null,
        },
        ...prev,
      ]);
      closeModal();
    });
  }

  async function sendDraft(id: string) {
    if (!confirm("이 공지를 지금 발송하시겠습니까?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/announcements/${id}/send`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "발송 실패");
        return;
      }
      setList((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: data.status ?? "sent",
                recipient_count: data.recipient_count ?? a.recipient_count,
                sent_count: data.sent_count ?? a.sent_count,
                failed_count: data.failed_count ?? a.failed_count,
              }
            : a
        )
      );
    });
  }

  async function deleteDraft(id: string) {
    if (!confirm("초안을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "삭제 실패");
        return;
      }
      setList((prev) => prev.filter((a) => a.id !== id));
    });
  }

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            공지사항
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-dim)", margin: "6px 0 0" }}>
            사용자 세그먼트별 인앱 알림 및 이메일 일괄 발송
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: "var(--color-accent)",
            color: "var(--color-black)",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          새 공지 작성
        </button>
      </div>

      {/* 목록 테이블 */}
      <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, overflow: "hidden" }}>
        {list.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-dim)", fontSize: 14 }}>
            작성된 공지사항이 없습니다
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["제목", "대상", "채널", "상태", "수신자", "작성자", "작성일", "액션"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--color-dim)",
                      fontFamily: "var(--font-display)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((a, i) => {
                const ss = STATUS_STYLE[a.status] ?? { bg: "rgba(255,255,255,0.08)", color: "var(--color-dim)" };
                return (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: i < list.length - 1 ? "1px solid var(--color-border)" : "none",
                    }}
                  >
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "var(--color-text)", maxWidth: 240 }}>
                      <span style={{ fontWeight: 600 }}>{a.title}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--color-dim)", whiteSpace: "nowrap" }}>
                      {AUDIENCE_LABELS[a.audience] ?? a.audience}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--color-dim)", whiteSpace: "nowrap" }}>
                      {CHANNEL_LABELS[a.channel] ?? a.channel}
                    </td>
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 9px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "var(--font-display)",
                        background: ss.bg,
                        color: ss.color,
                      }}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--color-dim)", whiteSpace: "nowrap" }}>
                      {a.status === "sent" || a.status === "failed" ? (
                        <span>
                          <span style={{ color: "#4ade80" }}>{a.sent_count}</span>
                          {a.failed_count > 0 && (
                            <span style={{ color: "#f87171" }}> / {a.failed_count} 실패</span>
                          )}
                          <span style={{ color: "var(--color-dim)" }}> / {a.recipient_count}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-dim)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--color-dim)", whiteSpace: "nowrap" }}>
                      {a.creator_name ?? "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--color-dim)", whiteSpace: "nowrap" }}>
                      {new Date(a.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {a.status === "draft" && (
                          <>
                            <button
                              onClick={() => sendDraft(a.id)}
                              disabled={isPending}
                              style={{
                                padding: "5px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                background: "var(--color-accent)",
                                color: "var(--color-black)",
                                border: "none",
                                borderRadius: 6,
                                cursor: isPending ? "not-allowed" : "pointer",
                                fontFamily: "var(--font-display)",
                              }}
                            >
                              발송
                            </button>
                            <button
                              onClick={() => deleteDraft(a.id)}
                              disabled={isPending}
                              style={{
                                padding: "5px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                background: "rgba(239,68,68,0.15)",
                                color: "#f87171",
                                border: "none",
                                borderRadius: 6,
                                cursor: isPending ? "not-allowed" : "pointer",
                                fontFamily: "var(--font-display)",
                              }}
                            >
                              삭제
                            </button>
                          </>
                        )}
                        {a.status === "sent" && (
                          <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, fontFamily: "var(--font-display)" }}>
                            완료
                          </span>
                        )}
                        {a.status === "failed" && (
                          <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600, fontFamily: "var(--font-display)" }}>
                            실패
                          </span>
                        )}
                        {a.status === "sending" && (
                          <span style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600, fontFamily: "var(--font-display)" }}>
                            발송 중...
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 작성 모달 */}
      {modal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              background: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 600,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
                새 공지 작성
              </h2>
              <button
                onClick={closeModal}
                style={{ background: "none", border: "none", color: "var(--color-dim)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
              >
                x
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* 제목 */}
              <div>
                <label style={labelStyle}>제목 <span style={{ color: "var(--color-dim)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({form.title.length}/100)</span></label>
                <input
                  style={inputStyle}
                  maxLength={100}
                  placeholder="공지 제목"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                />
              </div>

              {/* 본문 */}
              <div>
                <label style={labelStyle}>본문 <span style={{ color: "var(--color-dim)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({form.body.length}/2000)</span></label>
                <textarea
                  style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                  maxLength={2000}
                  placeholder="공지 내용"
                  value={form.body}
                  onChange={(e) => setField("body", e.target.value)}
                />
              </div>

              {/* 링크 */}
              <div>
                <label style={labelStyle}>링크 <span style={{ color: "var(--color-dim)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(선택)</span></label>
                <input
                  style={inputStyle}
                  placeholder="/enablers 또는 https://..."
                  value={form.link}
                  onChange={(e) => setField("link", e.target.value)}
                />
              </div>

              {/* 대상 */}
              <div>
                <label style={labelStyle}>발송 대상</label>
                <select
                  style={inputStyle}
                  value={form.audience}
                  onChange={(e) => setField("audience", e.target.value)}
                >
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* 조직 선택 */}
              {form.audience === "org" && (
                <div>
                  <label style={labelStyle}>조직 선택</label>
                  <select
                    style={inputStyle}
                    value={form.audience_target_id}
                    onChange={(e) => setField("audience_target_id", e.target.value)}
                  >
                    <option value="">조직을 선택하세요</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 특정 사용자 */}
              {form.audience === "specific_users" && (
                <div>
                  <label style={labelStyle}>사용자 ID <span style={{ color: "var(--color-dim)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(콤마로 구분)</span></label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                    placeholder="uuid1, uuid2, uuid3"
                    value={form.target_user_ids}
                    onChange={(e) => setField("target_user_ids", e.target.value)}
                  />
                </div>
              )}

              {/* 채널 */}
              <div>
                <label style={labelStyle}>발송 채널</label>
                <select
                  style={inputStyle}
                  value={form.channel}
                  onChange={(e) => setField("channel", e.target.value)}
                >
                  {CHANNEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* 에러 */}
              {formError && (
                <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#f87171" }}>
                  {formError}
                </div>
              )}

              {/* 버튼 */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  onClick={closeModal}
                  style={{
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    background: "transparent",
                    color: "var(--color-dim)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => submit(false)}
                  disabled={isPending}
                  style={{
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    background: "var(--color-card)",
                    color: "var(--color-text)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    cursor: isPending ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  초안 저장
                </button>
                <button
                  onClick={() => submit(true)}
                  disabled={isPending}
                  style={{
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 700,
                    background: "var(--color-accent)",
                    color: "var(--color-black)",
                    border: "none",
                    borderRadius: 8,
                    cursor: isPending ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {isPending ? "발송 중..." : "지금 발송"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
