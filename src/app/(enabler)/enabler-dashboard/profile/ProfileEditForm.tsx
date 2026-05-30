"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import type { CareerItem } from "@/lib/db/types";

interface ProfileInitial {
  full_name: string;
  avatar_url: string;
  university: string;
  degree_type: string;
  specialties: string[];
  location: string;
  bio: string;
  credit_rate: number;
  career: CareerItem[];
}

interface Props {
  initial: ProfileInitial;
  oauthAvatarUrl?: string | null;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-dim)",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "var(--color-black)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  padding: "10px 12px",
  color: "var(--color-text)",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
  boxSizing: "border-box",
  outline: "none",
};

const fieldStyle: React.CSSProperties = {
  marginBottom: "20px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "16px",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-accent)",
  marginBottom: "20px",
  margin: "0 0 20px 0",
};

const BIO_PLACEHOLDER = `Example) I'm a senior consultant helping companies enter the U.S. market.

**Experience**
- Where you worked and what you did

**Specialties**
- B2B SaaS GTM, partnerships, fundraising, etc.

**Highlights**
- Concrete numbers or results

Use **text** for bold, and start a line with "- " for a list. Please write at least 500 characters.`;

// 현재 업로드된 파일의 storage path를 추적 (삭제 시 사용)
function extractPathFromUrl(url: string, userId: string): string | null {
  try {
    const marker = `/avatars/${userId}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + "/avatars/".length);
  } catch {
    return null;
  }
}

export function ProfileEditForm({ initial, oauthAvatarUrl }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const [fullName, setFullName] = useState(initial.full_name);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [university, setUniversity] = useState(initial.university);
  const [degreeType, setDegreeType] = useState(initial.degree_type);
  const [specialtiesRaw, setSpecialtiesRaw] = useState(initial.specialties.join(", "));
  const [location, setLocation] = useState(initial.location);
  const [bio, setBio] = useState(initial.bio);
  const [creditRate, setCreditRate] = useState(initial.credit_rate);

  const [career, setCareer] = useState<CareerItem[]>(initial.career ?? []);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [bioPreview, setBioPreview] = useState(false);
  // 저장 성공 후 이동 중 상태: 버튼이 다시 켜지지 않도록 유지
  const [savedRedirecting, setSavedRedirecting] = useState(false);

  // 표시용 아바타: 직접 업로드한 URL 또는 OAuth 폴백
  const displayAvatar = avatarUrl || oauthAvatarUrl || null;
  const showOAuthFallback = !avatarUrl && !!oauthAvatarUrl;

  const bioLen = bio.length;
  const bioValid = bioLen >= 500 && bioLen <= 2000;
  const bioShort = bioLen > 0 && bioLen < 500;
  const remaining500 = 500 - bioLen;

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  // --- 마크다운 툴바: 선택 영역을 감싸거나 줄머리에 마커 삽입 ---
  type MarkdownAction = "bold" | "italic" | "ul" | "ol";

  function applyMarkdown(action: MarkdownAction) {
    const ta = bioRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = bio.slice(start, end);

    let nextValue: string;
    let nextSelStart: number;
    let nextSelEnd: number;

    if (action === "bold" || action === "italic") {
      const wrap = action === "bold" ? "**" : "*";
      const inner = selected || (action === "bold" ? "bold text" : "italic text");
      nextValue = bio.slice(0, start) + wrap + inner + wrap + bio.slice(end);
      // 선택이 없으면 마커 안쪽(플레이스홀더)을 선택해 바로 덮어쓰게
      nextSelStart = start + wrap.length;
      nextSelEnd = nextSelStart + inner.length;
    } else {
      // 목록/번호목록: 선택된 줄(또는 커서가 위치한 줄) 머리에 마커 삽입
      const lineStart = bio.lastIndexOf("\n", start - 1) + 1;
      const lineEndIdx = bio.indexOf("\n", end);
      const blockEnd = lineEndIdx === -1 ? bio.length : lineEndIdx;
      const block = bio.slice(lineStart, blockEnd);
      const lines = block.split("\n");
      const marked = lines
        .map((line, i) => (action === "ul" ? `- ${line}` : `${i + 1}. ${line}`))
        .join("\n");
      nextValue = bio.slice(0, lineStart) + marked + bio.slice(blockEnd);
      nextSelStart = lineStart;
      nextSelEnd = lineStart + marked.length;
    }

    // 2000자 상한 보호
    if (nextValue.length > 2000) {
      showToast("error", "Cannot exceed 2000 characters.");
      return;
    }

    setBio(nextValue);
    // DOM 갱신 후 선택 영역 복원
    requestAnimationFrame(() => {
      const el = bioRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(nextSelStart, nextSelEnd);
    });
  }

  // --- 아바타 업로드 ---
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) fileInputRef.current = e.currentTarget;
    // reset so same file can be re-selected
    e.currentTarget.value = "";

    if (!file) return;

    // 타입 검증
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only PNG, JPEG, or WebP files can be uploaded.");
      return;
    }
    // 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be 5MB or smaller.");
      return;
    }
    setUploadError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Could not verify your sign-in.");

      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (storageError) throw new Error(storageError.message);

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // 즉시 서버에 저장
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? "Something went wrong while saving.");
      }

      setAvatarUrl(publicUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong during upload.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  // --- 아바타 삭제 ---
  async function handleDeleteAvatar() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // storage에서 best-effort 삭제
    if (user && avatarUrl) {
      const path = extractPathFromUrl(avatarUrl, user.id);
      if (path) {
        await supabase.storage.from("avatars").remove([path]).catch(() => null);
      }
    }

    // DB에서 null로 업데이트
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: null }),
    }).catch(() => null);

    setAvatarUrl("");
    setUploadError(null);
  }

  // --- OAuth 아바타를 내 프로필로 저장 ---
  async function handleUseOAuthAvatar() {
    if (!oauthAvatarUrl) return;
    setUploading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: oauthAvatarUrl }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? "Something went wrong while saving.");
      }
      setAvatarUrl(oauthAvatarUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  // --- 전체 저장 ---
  async function handleSave() {
    if (!fullName.trim()) {
      showToast("error", "Please enter your name.");
      return;
    }
    if (!Number.isInteger(creditRate) || creditRate < 1) {
      showToast("error", "Credits per hour must be a whole number of 1 or more.");
      return;
    }
    if (!bioValid) {
      showToast("error", "Your bio must be between 500 and 2000 characters.");
      return;
    }

    const specialties = specialtiesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // 빈 company 항목은 저장 시 제외
    const filteredCareer = career.filter((c) => c.company.trim() !== "");

    startTransition(async () => {
      try {
        const [usersRes, enablerRes] = await Promise.all([
          fetch("/api/users/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name: fullName, avatar_url: avatarUrl || null }),
          }),
          fetch("/api/users/me/enabler", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ university, degree_type: degreeType, specialties, location, bio, credit_rate: creditRate, career: filteredCareer }),
          }),
        ]);

        const usersData = await usersRes.json() as { error?: string };
        const enablerData = await enablerRes.json() as { error?: string };

        if (!usersRes.ok || !enablerRes.ok) {
          showToast("error", usersData.error ?? enablerData.error ?? "Something went wrong while saving.");
          return;
        }

        // 성공: 토스트를 잠깐 보여준 뒤 대시보드로 이동 (저장 인지 명확화)
        setSavedRedirecting(true);
        showToast("success", "Profile saved. Taking you to your dashboard…");
        setTimeout(() => {
          router.push("/enabler-dashboard");
        }, 700);
      } catch {
        showToast("error", "A network error occurred.");
      }
    });
  }

  const canSave = !isPending && !uploading && !savedRedirecting && bioValid;

  return (
    <>
      {/* 토스트 */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 9999,
          backgroundColor: toast.type === "success" ? "var(--color-accent)" : "var(--color-red, #ef4444)",
          color: toast.type === "success" ? "var(--color-black)" : "#fff",
          padding: "12px 20px",
          borderRadius: "10px",
          fontSize: "14px",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}>
          {toast.message}
        </div>
      )}

      {/* 프로필 사진 카드 */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>Profile photo</p>

        {/* 아바타 프리뷰 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            backgroundColor: "var(--color-border)",
            overflow: "hidden",
            flexShrink: 0,
            border: "3px solid var(--color-accent)",
            boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-accent) 20%, transparent)",
            position: "relative",
          }}>
            {displayAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayAvatar}
                alt="Profile photo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-dim)",
                fontSize: "40px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
              }}>
                {fullName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>

          {/* 버튼 그룹 */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            {/* 숨긴 file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                backgroundColor: uploading ? "var(--color-border)" : "var(--color-accent)",
                color: uploading ? "var(--color-dim)" : "var(--color-black)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.04em",
                cursor: uploading ? "not-allowed" : "pointer",
                transition: "opacity 0.15s",
              }}
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>

            {/* 삭제 버튼: 직접 업로드한 avatarUrl이 있을 때만 */}
            {avatarUrl && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={uploading}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--color-red, #ef4444)",
                  border: "1px solid var(--color-red, #ef4444)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                Remove
              </button>
            )}

            {/* OAuth 폴백: avatar_url 없고 oauthAvatarUrl 있을 때 */}
            {showOAuthFallback && (
              <button
                type="button"
                onClick={handleUseOAuthAvatar}
                disabled={uploading}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--color-dim)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                Use Google photo
              </button>
            )}
          </div>

          {/* 업로드 에러 */}
          {uploadError && (
            <p style={{ fontSize: "12px", color: "var(--color-red, #ef4444)", margin: 0, textAlign: "center" }}>
              {uploadError}
            </p>
          )}

          <p style={{ fontSize: "11px", color: "var(--color-dim)", margin: 0, textAlign: "center" }}>
            PNG, JPEG, WebP · max 5MB
          </p>
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>Basic info</p>

        <div style={fieldStyle}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            style={inputStyle}
          />
        </div>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="San Francisco, CA"
            style={inputStyle}
          />
        </div>
      </div>

      {/* 학력 카드 */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>Education</p>

        <div style={fieldStyle}>
          <label style={labelStyle}>School</label>
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="Harvard Business School"
            style={inputStyle}
          />
        </div>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>Degree</label>
          <input
            type="text"
            value={degreeType}
            onChange={(e) => setDegreeType(e.target.value)}
            placeholder="MBA '25"
            style={inputStyle}
          />
        </div>
      </div>

      {/* 경력 카드 */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <p style={{ ...cardTitleStyle, marginBottom: 0 }}>Experience</p>
          <button
            type="button"
            onClick={() => setCareer((prev) => [...prev, { company: "", title: "", period: "", description: "" }])}
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-black)",
              border: "none",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "13px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Add experience
          </button>
        </div>

        {career.length === 0 && (
          <p style={{ fontSize: "13px", color: "var(--color-dim)", fontFamily: "var(--font-body)", margin: "0 0 4px" }}>
            No experience added yet. Use "+ Add experience" to add one.
          </p>
        )}

        {career.map((item, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: idx < career.length - 1 ? "12px" : 0,
              backgroundColor: "var(--color-black)",
            }}
          >
            {/* 헤더: 번호 + 삭제 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{
                fontSize: "11px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
              }}>
                Experience {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => setCareer((prev) => prev.filter((_, i) => i !== idx))}
                style={{
                  backgroundColor: "transparent",
                  color: "var(--color-dim)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>

            {/* 회사명 + 직함 (2열) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <label style={labelStyle}>Company *</label>
                <input
                  type="text"
                  value={item.company}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCareer((prev) => prev.map((c, i) => i === idx ? { ...c, company: val } : c));
                  }}
                  placeholder="Acme Corp"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Title / Role</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCareer((prev) => prev.map((c, i) => i === idx ? { ...c, title: val } : c));
                  }}
                  placeholder="Senior Product Manager"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 기간 */}
            <div style={{ marginBottom: "10px" }}>
              <label style={labelStyle}>Period</label>
              <input
                type="text"
                value={item.period}
                onChange={(e) => {
                  const val = e.target.value;
                  setCareer((prev) => prev.map((c, i) => i === idx ? { ...c, period: val } : c));
                }}
                placeholder="2019–2023 or 2021–Present"
                style={{ ...inputStyle, maxWidth: "240px" }}
              />
            </div>

            {/* 설명 */}
            <div>
              <label style={labelStyle}>Description (optional)</label>
              <textarea
                value={item.description}
                onChange={(e) => {
                  const val = e.target.value;
                  setCareer((prev) => prev.map((c, i) => i === idx ? { ...c, description: val } : c));
                }}
                rows={2}
                placeholder="Briefly describe your main work or achievements."
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 전문 분야 카드 */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>Specialties</p>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>
            Specialties{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(comma separated)</span>
          </label>
          <input
            type="text"
            value={specialtiesRaw}
            onChange={(e) => setSpecialtiesRaw(e.target.value)}
            placeholder="e.g., B2B SaaS, Fintech, Marketing"
            style={inputStyle}
          />
        </div>
      </div>

      {/* 소개 카드 */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>About</p>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>
            Bio{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              (500–2000 characters)
            </span>
          </label>

          {/* 마크다운 툴바 */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
            {([
              { action: "bold", label: "Bold", style: { fontWeight: 800 } as React.CSSProperties },
              { action: "italic", label: "Italic", style: { fontStyle: "italic" } as React.CSSProperties },
              { action: "ul", label: "• List", style: {} as React.CSSProperties },
              { action: "ol", label: "1. Numbered", style: {} as React.CSSProperties },
            ] as const).map(({ action, label, style }) => (
              <button
                key={action}
                type="button"
                onMouseDown={(e) => e.preventDefault() /* textarea 선택 유지 */}
                onClick={() => applyMarkdown(action)}
                style={{
                  backgroundColor: "var(--color-black)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  cursor: "pointer",
                  lineHeight: 1,
                  ...style,
                }}
              >
                {label}
              </button>
            ))}
            {/* 미리보기 토글 */}
            <button
              type="button"
              onClick={() => setBioPreview((v) => !v)}
              style={{
                marginLeft: "auto",
                backgroundColor: bioPreview ? "var(--color-accent)" : "var(--color-black)",
                color: bioPreview ? "var(--color-black)" : "var(--color-dim)",
                border: `1px solid ${bioPreview ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.04em",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              {bioPreview ? "Edit" : "Preview"}
            </button>
          </div>

          {bioPreview ? (
            // 미리보기 박스 (DESIGN.md 톤)
            <div
              style={{
                width: "100%",
                minHeight: "260px",
                backgroundColor: "var(--color-black)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "14px 16px",
                color: "var(--color-text)",
                fontSize: "14px",
                fontFamily: "var(--font-body)",
                lineHeight: 1.7,
                boxSizing: "border-box",
              }}
              className="bio-md"
            >
              {bio.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{bio}</ReactMarkdown>
              ) : (
                <span style={{ color: "var(--color-dim)" }}>Nothing to preview yet.</span>
              )}
            </div>
          ) : (
            <textarea
              ref={bioRef}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={2000}
              rows={12}
              placeholder={BIO_PLACEHOLDER}
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: 1.7,
                borderColor: bioShort ? "var(--color-amber, #f59e0b)" : "var(--color-border)",
              }}
            />
          )}

          {/* 라이브 카운터 + 경고 (원문 기준) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <span style={{
              fontSize: "11px",
              color: bioShort ? "var(--color-amber, #f59e0b)" : "var(--color-dim)",
              fontFamily: "var(--font-body)",
            }}>
              {bioShort
                ? `At least 500 characters (${remaining500} to go)`
                : bioLen > 2000
                  ? "You've exceeded 2000 characters."
                  : ""}
            </span>
            <span style={{
              fontSize: "11px",
              color: bioValid ? "var(--color-accent)" : bioLen > 2000 ? "var(--color-red, #ef4444)" : "var(--color-dim)",
              fontFamily: "var(--font-body)",
              fontWeight: bioValid ? 700 : 400,
            }}>
              {bioLen} / 2000
            </span>
          </div>
        </div>
      </div>

      {/* 단가 카드 */}
      <div style={{ ...cardStyle, marginBottom: "32px" }}>
        <p style={cardTitleStyle}>Rate</p>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>Credits per hour</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="number"
              value={creditRate}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setCreditRate(Number.isNaN(n) ? 0 : n);
              }}
              min={1}
              step={1}
              style={{ ...inputStyle, width: "120px" }}
            />
            <span style={{ color: "var(--color-dim)", fontSize: "14px" }}>C / hour</span>
          </div>
        </div>
      </div>

      {/* 버튼 그룹 */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            flex: 1,
            minWidth: "140px",
            backgroundColor: canSave ? "var(--color-accent)" : "var(--color-border)",
            color: canSave ? "var(--color-black)" : "var(--color-dim)",
            border: "none",
            borderRadius: "10px",
            padding: "14px 24px",
            fontSize: "14px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: canSave ? "pointer" : "not-allowed",
            transition: "opacity 0.15s",
          }}
        >
          {savedRedirecting ? "Saved ✓" : isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => router.push("/enabler-dashboard")}
          disabled={isPending}
          style={{
            flex: 1,
            minWidth: "140px",
            backgroundColor: "transparent",
            color: "var(--color-dim)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "14px 24px",
            fontSize: "14px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );
}
