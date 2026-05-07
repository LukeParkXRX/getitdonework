"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui";
import { CATEGORIES, DURATIONS, BUDGETS, REQUIREMENTS } from "@/lib/constants/project-options";
import type { ProjectStatus } from "@/lib/constants/project-options";

export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string | null;
  budget: string | null;
  requirements: string[];
  attachment_url: string | null;
  status: ProjectStatus;
  created_at: string;
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "초안",
  open: "모집중",
  matched: "매칭됨",
  in_progress: "진행중",
  completed: "완료",
  cancelled: "취소됨",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: "oklch(0.55 0.01 280)",
  open: "var(--color-green)",
  matched: "#60a5fa",
  in_progress: "var(--color-accent)",
  completed: "oklch(0.5 0.01 280)",
  cancelled: "#f87171",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-dim)",
  marginBottom: "8px",
  fontFamily: "var(--font-display)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  fontSize: "16px",
  color: "var(--color-text)",
  backgroundColor: "oklch(0.12 0.005 280)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  outline: "none",
  fontFamily: "var(--font-body)",
  boxSizing: "border-box",
};

export default function ProjectDetailClient({ project }: { project: Project }) {
  const router = useRouter();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState(project.title);
  const [category, setCategory] = useState(project.category);
  const [description, setDescription] = useState(project.description);
  const [duration, setDuration] = useState(project.duration ?? "");
  const [budget, setBudget] = useState(project.budget ?? "");
  const [requirements, setRequirements] = useState<string[]>(project.requirements);
  const [status, setStatus] = useState<ProjectStatus>(project.status);

  const toggleReq = (req: string) => {
    setRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };

  function cancelEdit() {
    setTitle(project.title);
    setCategory(project.category);
    setDescription(project.description);
    setDuration(project.duration ?? "");
    setBudget(project.budget ?? "");
    setRequirements(project.requirements);
    setStatus(project.status);
    setEditing(false);
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("제목을 입력해주세요."); return; }
    if (!category) { toast.error("카테고리를 선택해주세요."); return; }
    if (description.trim().length < 10) { toast.error("설명을 10자 이상 입력해주세요."); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category, description: description.trim(), duration, budget, requirements, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "저장 실패");
      toast.success("저장되었습니다.");
      setEditing(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "삭제 실패");
      }
      toast.success("프로젝트가 삭제되었습니다.");
      router.push("/projects");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const createdDate = new Date(project.created_at).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* 헤더 */}
        <div style={{ marginBottom: "40px" }}>
          <Link
            href="/projects"
            style={{ fontSize: "14px", color: "var(--color-dim)", textDecoration: "none", display: "inline-block", marginBottom: "16px" }}
          >
            ← 프로젝트 목록으로
          </Link>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              {!editing && (
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(24px, 3vw, 32px)", color: "var(--color-text)", marginBottom: "8px", wordBreak: "keep-all" }}>
                  {project.title}
                </h1>
              )}
              <span style={{ fontSize: "12px", color: "var(--color-dim)" }}>등록일: {createdDate}</span>
            </div>

            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              {editing ? (
                <>
                  <button
                    onClick={cancelEdit}
                    style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 600, border: "1px solid var(--color-border)", borderRadius: "8px", backgroundColor: "transparent", color: "var(--color-dim)", cursor: "pointer" }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 700, border: "none", borderRadius: "8px", backgroundColor: "var(--color-accent)", color: "oklch(0.1 0 0)", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.65 : 1 }}
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 600, border: "1px solid var(--color-border)", borderRadius: "8px", backgroundColor: "transparent", color: "var(--color-text)", cursor: "pointer" }}
                  >
                    편집
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 600, border: "1px solid #f87171", borderRadius: "8px", backgroundColor: "transparent", color: "#f87171", cursor: "pointer" }}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 삭제 확인 다이얼로그 */}
        {confirmDelete && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" }}>
            <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "32px", maxWidth: "400px", width: "100%" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "20px", color: "var(--color-text)", marginBottom: "12px" }}>프로젝트 삭제</h2>
              <p style={{ fontSize: "15px", color: "var(--color-dim)", lineHeight: 1.6, marginBottom: "24px", wordBreak: "keep-all" }}>
                "{project.title}"을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, padding: "12px", fontSize: "14px", fontWeight: 600, border: "1px solid var(--color-border)", borderRadius: "8px", backgroundColor: "transparent", color: "var(--color-dim)", cursor: "pointer" }}
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ flex: 1, padding: "12px", fontSize: "14px", fontWeight: 700, border: "none", borderRadius: "8px", backgroundColor: "#f87171", color: "#fff", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.65 : 1 }}
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 콘텐츠 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {editing ? (
            /* 편집 모드 */
            <>
              {/* 제목 */}
              <div>
                <label style={labelStyle}>프로젝트 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label style={labelStyle}>카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                >
                  <option value="">카테고리 선택</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 설명 */}
              <div>
                <label style={labelStyle}>상세 설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...inputStyle, minHeight: "150px", resize: "vertical", lineHeight: 1.7 }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>

              {/* 기간 + 예산 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>예상 기간</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                  >
                    <option value="">기간 선택</option>
                    {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>예산 범위</label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                  >
                    <option value="">예산 선택</option>
                    {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {/* 상태 */}
              <div>
                <label style={labelStyle}>상태</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                >
                  <option value="draft">초안</option>
                  <option value="open">모집중</option>
                  <option value="matched">매칭됨</option>
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소됨</option>
                </select>
              </div>

              {/* 요구사항 */}
              <div>
                <label style={labelStyle}>희망 Enabler 조건</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {REQUIREMENTS.map((req) => {
                    const active = requirements.includes(req);
                    return (
                      <button
                        key={req}
                        type="button"
                        onClick={() => toggleReq(req)}
                        style={{
                          padding: "8px 16px",
                          fontSize: "14px",
                          fontWeight: active ? 600 : 400,
                          borderRadius: "9999px",
                          border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                          backgroundColor: active ? "oklch(0.91 0.2 110 / 0.1)" : "transparent",
                          color: active ? "var(--color-accent)" : "var(--color-dim)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {req}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* 보기 모드 */
            <>
              {/* 상태 + 카테고리 뱃지 */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-block", fontSize: "12px", fontWeight: 700, padding: "4px 12px",
                  borderRadius: "9999px", border: `1px solid ${STATUS_COLORS[project.status]}`,
                  color: STATUS_COLORS[project.status], backgroundColor: `${STATUS_COLORS[project.status]}18`,
                }}>
                  {STATUS_LABELS[project.status]}
                </span>
                <span style={{
                  display: "inline-block", fontSize: "12px", fontWeight: 600, padding: "4px 12px",
                  borderRadius: "9999px", backgroundColor: "oklch(0.91 0.2 110 / 0.1)",
                  color: "var(--color-accent)", border: "1px solid oklch(0.91 0.2 110 / 0.2)",
                }}>
                  {project.category}
                </span>
              </div>

              {/* 설명 */}
              <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "24px" }}>
                <p style={{ fontSize: "15px", color: "var(--color-dim)", lineHeight: 1.8, wordBreak: "keep-all", whiteSpace: "pre-wrap" }}>
                  {project.description}
                </p>
              </div>

              {/* 기간 + 예산 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "20px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-dim)", marginBottom: "8px", fontFamily: "var(--font-display)" }}>예상 기간</p>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text)" }}>{project.duration ?? "-"}</p>
                </div>
                <div style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "20px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-dim)", marginBottom: "8px", fontFamily: "var(--font-display)" }}>예산 범위</p>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-accent)" }}>{project.budget ?? "-"}</p>
                </div>
              </div>

              {/* 요구사항 */}
              {project.requirements.length > 0 && (
                <div>
                  <p style={{ ...labelStyle }}>희망 Enabler 조건</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {project.requirements.map((req) => (
                      <span key={req} style={{
                        padding: "6px 14px", fontSize: "13px", fontWeight: 600,
                        borderRadius: "9999px", border: "1px solid var(--color-accent)",
                        backgroundColor: "oklch(0.91 0.2 110 / 0.08)", color: "var(--color-accent)",
                      }}>
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 상태 안내 */}
              {(project.status === "matched" || project.status === "in_progress") && (
                <div style={{ backgroundColor: "oklch(0.91 0.2 110 / 0.06)", border: "1px solid oklch(0.91 0.2 110 / 0.2)", borderRadius: "12px", padding: "20px" }}>
                  <p style={{ fontSize: "14px", color: "var(--color-accent)", fontWeight: 600, marginBottom: "4px" }}>
                    {project.status === "matched" ? "Enabler 매칭 완료" : "프로젝트 진행중"}
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--color-dim)" }}>
                    {project.status === "matched"
                      ? "매칭된 Enabler와 미팅을 예약하세요."
                      : "Enabler와 함께 프로젝트가 진행 중입니다."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
