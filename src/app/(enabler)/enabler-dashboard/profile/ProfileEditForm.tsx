"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ProfileInitial {
  full_name: string;
  avatar_url: string;
  university: string;
  degree_type: string;
  specialties: string[];
  location: string;
  bio: string;
  credit_rate: number;
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

const BIO_PLACEHOLDER = `예시) 미국 시장 진출을 돕는 시니어 컨설턴트입니다.
• 경력: (어디서 어떤 일을 했는지)
• 전문 분야: (B2B SaaS GTM, 파트너십, 자금 조달 등)
• 대표 성과: (구체적 수치나 사례)
• 스타트업을 이렇게 돕습니다: (제공 가치)
최소 500자 이상 작성해 주세요.`;

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

  const [fullName, setFullName] = useState(initial.full_name);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [university, setUniversity] = useState(initial.university);
  const [degreeType, setDegreeType] = useState(initial.degree_type);
  const [specialtiesRaw, setSpecialtiesRaw] = useState(initial.specialties.join(", "));
  const [location, setLocation] = useState(initial.location);
  const [bio, setBio] = useState(initial.bio);
  const [creditRate, setCreditRate] = useState(initial.credit_rate);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 표시용 아바타: 직접 업로드한 URL 또는 OAuth 폴백
  const displayAvatar = avatarUrl || oauthAvatarUrl || null;
  const showOAuthFallback = !avatarUrl && !!oauthAvatarUrl;

  const bioLen = bio.length;
  const bioValid = bioLen >= 500 && bioLen <= 1000;
  const bioShort = bioLen > 0 && bioLen < 500;
  const remaining500 = 500 - bioLen;

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
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
      setUploadError("PNG, JPEG, WebP 파일만 업로드할 수 있습니다.");
      return;
    }
    // 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    setUploadError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("인증 정보를 확인할 수 없습니다.");

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
        throw new Error(json.error ?? "저장 중 오류가 발생했습니다.");
      }

      setAvatarUrl(publicUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
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
        throw new Error(json.error ?? "저장 중 오류가 발생했습니다.");
      }
      setAvatarUrl(oauthAvatarUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  // --- 전체 저장 ---
  async function handleSave() {
    if (!fullName.trim()) {
      showToast("error", "이름을 입력해주세요.");
      return;
    }
    if (!Number.isInteger(creditRate) || creditRate < 1) {
      showToast("error", "시간당 크레딧은 1 이상의 정수여야 합니다.");
      return;
    }
    if (!bioValid) {
      showToast("error", "자기소개는 500자 이상 1000자 이하로 작성해 주세요.");
      return;
    }

    const specialties = specialtiesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

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
            body: JSON.stringify({ university, degree_type: degreeType, specialties, location, bio, credit_rate: creditRate }),
          }),
        ]);

        const usersData = await usersRes.json() as { error?: string };
        const enablerData = await enablerRes.json() as { error?: string };

        if (!usersRes.ok || !enablerRes.ok) {
          showToast("error", usersData.error ?? enablerData.error ?? "저장 중 오류가 발생했습니다.");
          return;
        }

        showToast("success", "프로필이 저장되었습니다.");
      } catch {
        showToast("error", "네트워크 오류가 발생했습니다.");
      }
    });
  }

  const canSave = !isPending && !uploading && bioValid;

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
        <p style={cardTitleStyle}>프로필 사진</p>

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
                alt="프로필 사진"
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
              {uploading ? "업로드 중…" : "업로드"}
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
                삭제
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
                구글 사진 사용
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
            PNG, JPEG, WebP · 최대 5MB
          </p>
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>기본 정보</p>

        <div style={fieldStyle}>
          <label style={labelStyle}>이름</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="홍길동"
            style={inputStyle}
          />
        </div>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>위치</label>
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
        <p style={cardTitleStyle}>학력</p>

        <div style={fieldStyle}>
          <label style={labelStyle}>학교</label>
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="Harvard Business School"
            style={inputStyle}
          />
        </div>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>학위</label>
          <input
            type="text"
            value={degreeType}
            onChange={(e) => setDegreeType(e.target.value)}
            placeholder="MBA '25"
            style={inputStyle}
          />
        </div>
      </div>

      {/* 전문 분야 카드 */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>전문 분야</p>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>
            전문 분야{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(콤마로 구분)</span>
          </label>
          <input
            type="text"
            value={specialtiesRaw}
            onChange={(e) => setSpecialtiesRaw(e.target.value)}
            placeholder="예: B2B SaaS, Fintech, Marketing"
            style={inputStyle}
          />
        </div>
      </div>

      {/* 소개 카드 */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>소개</p>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>
            자기소개{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              (500~1000자)
            </span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={1000}
            rows={10}
            placeholder={BIO_PLACEHOLDER}
            style={{
              ...inputStyle,
              resize: "vertical",
              lineHeight: 1.7,
              borderColor: bioShort ? "var(--color-amber, #f59e0b)" : "var(--color-border)",
            }}
          />
          {/* 라이브 카운터 + 경고 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <span style={{
              fontSize: "11px",
              color: bioShort ? "var(--color-amber, #f59e0b)" : "var(--color-dim)",
              fontFamily: "var(--font-body)",
            }}>
              {bioShort
                ? `최소 500자 (앞으로 ${remaining500}자)`
                : bioLen > 1000
                  ? "최대 1000자를 초과했습니다."
                  : ""}
            </span>
            <span style={{
              fontSize: "11px",
              color: bioValid ? "var(--color-accent)" : bioLen > 1000 ? "var(--color-red, #ef4444)" : "var(--color-dim)",
              fontFamily: "var(--font-body)",
              fontWeight: bioValid ? 700 : 400,
            }}>
              {bioLen} / 1000
            </span>
          </div>
        </div>
      </div>

      {/* 단가 카드 */}
      <div style={{ ...cardStyle, marginBottom: "32px" }}>
        <p style={cardTitleStyle}>단가</p>

        <div style={{ ...fieldStyle, marginBottom: 0 }}>
          <label style={labelStyle}>시간당 크레딧</label>
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
            <span style={{ color: "var(--color-dim)", fontSize: "14px" }}>C / 시간</span>
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
          {isPending ? "저장 중…" : "저장하기"}
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
          취소
        </button>
      </div>
    </>
  );
}
