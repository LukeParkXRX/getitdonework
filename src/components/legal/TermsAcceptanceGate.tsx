"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface TermsVersion {
  id: string;
  version: string;
  changelog: string | null;
  effective_from: string;
}

interface TermsStatus {
  current_version: TermsVersion | null;
  accepted: boolean;
}

export default function TermsAcceptanceGate() {
  const router = useRouter();
  const [status, setStatus] = useState<TermsStatus | null>(null);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/me/terms-status")
      .then((r) => r.json())
      .then((data: TermsStatus) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  // 동의 완료 or 현재 버전 없음 → 렌더 없음
  if (!status || status.accepted || !status.current_version) return null;

  async function handleAccept() {
    if (!checked || !status?.current_version) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/me/terms-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms_version_id: status.current_version.id }),
      });
      if (res.ok) {
        setStatus((prev) => (prev ? { ...prev, accepted: true } : prev));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    // 동의 거부 → 로그아웃 후 홈으로
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/");
  }

  const cv = status.current_version;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "oklch(0.08 0 0 / 0.85)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* 모달 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: "36px 32px",
            fontFamily: "var(--font-body)",
          }}
        >
          <h2
            id="terms-modal-title"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--color-text)",
              margin: "0 0 8px",
            }}
          >
            이용약관 업데이트
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-dim)",
              margin: "0 0 20px",
              lineHeight: 1.6,
            }}
          >
            계속 이용하려면 업데이트된 이용약관에 동의해 주세요.
          </p>

          {cv.changelog && (
            <div
              style={{
                backgroundColor: "var(--color-dark)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "14px 16px",
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-accent)",
                  margin: "0 0 6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                변경 사항 ({cv.version})
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--color-text)",
                  margin: 0,
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                }}
              >
                {cv.changelog}
              </p>
            </div>
          )}

          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              fontSize: 14,
              color: "var(--color-accent)",
              textDecoration: "none",
              marginBottom: 24,
            }}
          >
            전체 약관 보기 &rarr;
          </a>

          {/* 동의 체크박스 */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: 28,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                accentColor: "var(--color-accent)",
                flexShrink: 0,
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.6 }}>
              이용약관 ({cv.version})을 읽었으며 동의합니다.
            </span>
          </label>

          {/* 버튼 */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleDecline}
              disabled={submitting}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                backgroundColor: "transparent",
                color: "var(--color-dim)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              거부 (로그아웃)
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={!checked || submitting}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                backgroundColor: checked ? "var(--color-accent)" : "var(--color-border)",
                color: checked ? "var(--color-black)" : "var(--color-dim)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
                cursor: !checked || submitting ? "not-allowed" : "pointer",
                transition: "background-color 0.15s",
              }}
            >
              {submitting ? "처리 중..." : "동의하고 계속"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
