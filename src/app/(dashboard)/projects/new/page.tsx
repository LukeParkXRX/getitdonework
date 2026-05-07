"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, DURATIONS, BUDGETS, REQUIREMENTS } from "@/lib/constants/project-options";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function NewProjectPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleReq = (req: string) => {
    setRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    if (selected.size > MAX_FILE_BYTES) {
      toast.error("파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 필수 필드 검증
    if (!title.trim()) { toast.error("프로젝트 제목을 입력해주세요."); return; }
    if (!category) { toast.error("카테고리를 선택해주세요."); return; }
    if (!description.trim()) { toast.error("상세 설명을 입력해주세요."); return; }
    if (!duration) { toast.error("예상 기간을 선택해주세요."); return; }
    if (!budget) { toast.error("예산 범위를 선택해주세요."); return; }

    if (!user) {
      toast.error("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      // 1. projects 레코드 insert (attachment_url 없이 먼저)
      const { data: inserted, error: insertError } = await db
        .from("projects")
        .insert({
          startup_id: user.id,
          title: title.trim(),
          category,
          description: description.trim(),
          duration,
          budget,
          requirements,
          status: "open",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const projectId: string = inserted.id;

      // 2. 파일 업로드 (있을 때만)
      if (file) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${user.id}/${projectId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("project-attachments")
          .upload(path, file, { upsert: false });

        if (uploadError) {
          // 파일 업로드 실패는 치명적이지 않음 — 경고만
          toast.error(`파일 업로드 실패: ${uploadError.message}`);
        } else {
          // attachment_url 업데이트
          await db
            .from("projects")
            .update({ attachment_url: path })
            .eq("id", projectId);
        }
      }

      toast.success("프로젝트가 등록되었습니다! Enabler 지원을 기다려주세요.");
      router.push("/my");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

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
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--color-dim)",
    marginBottom: "8px",
    fontFamily: "var(--font-display)",
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--color-black)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "var(--color-dim)", fontSize: "14px", fontFamily: "var(--font-body)" }}>
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)" }}>
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "100px 24px 80px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <Link
            href="/matching"
            style={{
              fontSize: "14px",
              color: "var(--color-dim)",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: "16px",
            }}
          >
            ← Enabler 찾기로 돌아가기
          </Link>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: "clamp(28px, 3.5vw, 40px)",
              color: "var(--color-text)",
              wordBreak: "keep-all",
              marginBottom: "8px",
            }}
          >
            프로젝트 등록
          </h1>
          <p
            style={{
              fontSize: "17px",
              color: "var(--color-dim)",
              wordBreak: "keep-all",
            }}
          >
            프로젝트를 등록하면 적합한 Enabler가 직접 지원합니다. 평균 24시간
            내 첫 지원을 받습니다.
          </p>
        </div>

        {/* Layout: Form + Preview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: "40px",
            alignItems: "start",
          }}
        >
          {/* LEFT: Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
          >
            {/* Title */}
            <div>
              <label style={labelStyle}>프로젝트 제목</label>
              <input
                type="text"
                placeholder="예: 미국 B2B SaaS 시장 GTM 전략 수립"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              >
                <option value="">카테고리를 선택하세요</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>상세 설명</label>
              <textarea
                placeholder="어떤 도움이 필요한지 구체적으로 설명해주세요. 현재 상황, 목표, 기대 결과물 등을 포함하면 더 정확한 매칭이 가능합니다."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  ...inputStyle,
                  minHeight: "150px",
                  resize: "vertical" as const,
                  lineHeight: 1.7,
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>

            {/* Duration + Budget row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                gap: "20px",
              }}
            >
              <div>
                <label style={labelStyle}>예상 기간</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                >
                  <option value="">기간 선택</option>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>예산 범위</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                >
                  <option value="">예산 선택</option>
                  {BUDGETS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Requirements */}
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

            {/* File Upload Zone */}
            <div>
              <label style={labelStyle}>참고 자료 첨부 (선택)</label>

              {/* 숨겨진 file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileSelect(e.dataTransfer.files[0] ?? null);
                }}
                style={{
                  border: `2px dashed ${dragOver ? "var(--color-accent)" : file ? "var(--color-green)" : "var(--color-border)"}`,
                  borderRadius: "12px",
                  padding: "32px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                  backgroundColor: dragOver ? "rgba(188,255,0,0.04)" : "transparent",
                }}
                onMouseEnter={(e) => { if (!file) e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                onMouseLeave={(e) => { if (!file) e.currentTarget.style.borderColor = "var(--color-border)"; }}
              >
                {file ? (
                  <>
                    <p style={{ fontSize: "15px", color: "var(--color-green)", marginBottom: "4px", fontWeight: 600 }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--color-dim)" }}>
                      {formatFileSize(file.size)} · 클릭해서 변경
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "15px", color: "var(--color-dim)", marginBottom: "4px" }}>
                      파일을 드래그하거나 클릭해서 업로드
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--color-border)" }}>
                      PDF, DOC, PPT, 이미지 (최대 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "16px",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                backgroundColor: "var(--color-accent)",
                color: "oklch(0.1 0 0)",
                border: "none",
                borderRadius: "12px",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "opacity 0.15s",
                opacity: submitting ? 0.65 : 1,
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.opacity = "1"; }}
            >
              {submitting ? "등록 중..." : "프로젝트 등록하기"}
            </button>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-dim)",
                textAlign: "center",
              }}
            >
              등록 후 평균 24시간 내 Enabler 지원을 받습니다
            </p>
          </form>

          {/* RIGHT: Preview */}
          <div
            style={{
              position: "sticky",
              top: "80px",
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-accent)",
                marginBottom: "16px",
                fontFamily: "var(--font-display)",
              }}
            >
              미리보기
            </p>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: title ? "var(--color-text)" : "oklch(0.45 0.01 280)",
                fontFamily: "var(--font-display)",
                marginBottom: "12px",
                wordBreak: "keep-all",
              }}
            >
              {title || "프로젝트 제목을 입력하세요"}
            </h3>

            {category && (
              <span
                style={{
                  display: "inline-block",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "oklch(0.91 0.2 110 / 0.1)",
                  color: "var(--color-accent)",
                  border: "1px solid oklch(0.91 0.2 110 / 0.2)",
                  marginBottom: "12px",
                }}
              >
                {category}
              </span>
            )}

            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: description ? "var(--color-dim)" : "oklch(0.45 0.01 280)",
                marginBottom: "16px",
                wordBreak: "keep-all",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}
            >
              {description || "상세 설명이 여기에 표시됩니다..."}
            </p>

            <div
              style={{
                borderTop: "1px solid var(--color-border)",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "oklch(0.6 0.01 280)" }}>
                {duration || "기간 미정"}
              </span>
              <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
                {budget || "예산 미정"}
              </span>
            </div>

            {requirements.length > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                }}
              >
                {requirements.map((r) => (
                  <span
                    key={r}
                    style={{
                      fontSize: "10px",
                      padding: "3px 8px",
                      borderRadius: "9999px",
                      backgroundColor: "var(--color-dark)",
                      color: "var(--color-dim)",
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}

            {file && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  fontSize: "12px",
                  color: "var(--color-dim)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>📎</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
