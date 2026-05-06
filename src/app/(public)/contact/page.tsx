"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4 uppercase tracking-widest font-bold" style={{ fontSize: 11, color: "var(--color-accent)" }}>
      <span style={{ width: 24, height: 2, background: "var(--color-accent)", display: "inline-block" }} />
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-dim)",
  marginBottom: 8,
  letterSpacing: "0.03em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  color: "var(--color-text)",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: "oklch(0.65 0.2 25)",
  fontSize: 12,
  marginTop: 4,
};

export default function ContactPage() {
  const { success, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "이름을 입력해 주세요";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "유효한 이메일을 입력해 주세요";
    }
    if (!type) newErrors.type = "문의 유형을 선택해 주세요";
    if (!message.trim() || message.trim().length < 10) {
      newErrors.message = "문의 내용을 10자 이상 입력해 주세요";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, inquiryType: type, message }),
      });
      const json = await res.json();
      if (!res.ok) {
        toastError(json.error ?? "문의 전송에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      setIsSubmitted(true);
      success("문의가 접수되었습니다. 24시간 내 답변 드리겠습니다.");
    } catch {
      toastError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setName("");
    setCompany("");
    setEmail("");
    setType("");
    setMessage("");
    setErrors({});
    setIsSubmitted(false);
  }

  return (
    <>
      <main style={{ paddingTop: 56 }}>
        {/* Hero */}
        <section style={{ padding: "80px 0 56px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>문의하기</Eyebrow>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 700,
                lineHeight: 1.15,
                color: "var(--color-text)",
                marginBottom: 20,
              }}
            >
              무엇을 도와드릴까요?
            </h1>
            <p style={{ fontSize: 17, color: "var(--color-dim)", lineHeight: 1.7 }}>
              플랫폼 사용, 기관 도입, Enabler 등록, 파트너십 등 어떤 문의든 환영합니다.
            </p>
          </div>
        </section>

        {/* Content */}
        <section style={{ paddingBottom: 80 }}>
          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              padding: "0 24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: 48,
              alignItems: "start",
            }}
          >
            {/* Left Column - Form */}
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 24 }}>
                문의 양식
              </h2>

              {isSubmitted ? (
                <div
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: 40,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "oklch(0.72 0.18 150 / 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      fontSize: 28,
                      color: "oklch(0.72 0.18 150)",
                    }}
                  >
                    ✓
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>
                    문의가 접수되었습니다
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.7, marginBottom: 28 }}>
                    24시간 내 이메일로 답변 드리겠습니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="landing-btn-primary"
                    style={{ justifyContent: "center" }}
                  >
                    새 문의하기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* 문의 유형 */}
                  <div>
                    <label style={labelStyle}>문의 유형</label>
                    <div style={{ position: "relative" }}>
                      <select
                        style={{
                          ...inputStyle,
                          appearance: "none",
                          cursor: "pointer",
                        }}
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                      >
                        <option value="" disabled>선택해 주세요</option>
                        <option value="startup">스타트업 — 서비스 이용 문의</option>
                        <option value="b2b">기관 — B2B 도입 문의</option>
                        <option value="enabler">Enabler — 등록 및 활동 문의</option>
                        <option value="partnership">파트너십 / 제휴</option>
                        <option value="other">기타</option>
                      </select>
                      <span
                        style={{
                          position: "absolute",
                          right: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "var(--color-dim)",
                          fontSize: 12,
                        }}
                      >
                        ▾
                      </span>
                    </div>
                    {errors.type && <p style={errorStyle}>{errors.type}</p>}
                  </div>

                  {/* 이름 + 소속 */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>이름</label>
                      <input
                        type="text"
                        placeholder="홍길동"
                        style={inputStyle}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                      />
                      {errors.name && <p style={errorStyle}>{errors.name}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>소속 / 회사</label>
                      <input
                        type="text"
                        placeholder="Get It Done at Work Inc."
                        style={inputStyle}
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                      />
                    </div>
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label style={labelStyle}>이메일</label>
                    <input
                      type="email"
                      placeholder="hello@example.com"
                      style={inputStyle}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                    />
                    {errors.email && <p style={errorStyle}>{errors.email}</p>}
                  </div>

                  {/* 문의 내용 */}
                  <div>
                    <label style={labelStyle}>문의 내용</label>
                    <textarea
                      placeholder="궁금한 점이나 제안 사항을 자유롭게 작성해 주세요."
                      style={{
                        ...inputStyle,
                        minHeight: 140,
                        resize: "vertical",
                      }}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                    />
                    {errors.message && <p style={errorStyle}>{errors.message}</p>}
                  </div>

                  {/* Submit */}
                  <div>
                    <button
                      type="submit"
                      className="landing-btn-primary"
                      disabled={isSubmitting}
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        opacity: isSubmitting ? 0.6 : 1,
                      }}
                    >
                      {isSubmitting ? "전송 중..." : "문의 보내기 →"}
                    </button>
                    <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-dim)", marginTop: 12 }}>
                      24시간 내 이메일로 답변드립니다.
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column - Contact Info */}
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 24 }}>
                직접 연락
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* 이메일 */}
                <div
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: 28,
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    이메일
                  </p>
                  <a
                    href="mailto:hello@getitdonework.com"
                    style={{ fontSize: 16, fontWeight: 700, color: "var(--color-accent)", textDecoration: "none", display: "block", marginBottom: 4 }}
                  >
                    hello@getitdonework.com
                  </a>
                  <p style={{ fontSize: 13, color: "var(--color-dim)" }}>일반 문의</p>
                </div>

                {/* 기관 파트너십 */}
                <div
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: 28,
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    기관 파트너십
                  </p>
                  <a
                    href="mailto:partners@getitdonework.com"
                    style={{ fontSize: 16, fontWeight: 700, color: "var(--color-blue)", textDecoration: "none", display: "block", marginBottom: 4 }}
                  >
                    partners@getitdonework.com
                  </a>
                  <p style={{ fontSize: 13, color: "var(--color-dim)" }}>KOTRA, 창진원, 액셀러레이터 등</p>
                </div>

                {/* Enabler 지원 */}
                <div
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: 28,
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Enabler 지원
                  </p>
                  <Link
                    href="/enabler-apply"
                    style={{ fontSize: 16, fontWeight: 700, color: "var(--color-green)", textDecoration: "none", display: "block", marginBottom: 4 }}
                  >
                    지원 폼 바로가기 →
                  </Link>
                  <p style={{ fontSize: 13, color: "var(--color-dim)" }}>MBA 재학·졸업생 Enabler 신청</p>
                </div>

                {/* 빠른 상담 */}
                <div
                  style={{
                    background: "var(--color-accent-dim)",
                    border: "1px solid rgba(200,255,0,0.2)",
                    borderRadius: 20,
                    padding: 28,
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-accent)", marginBottom: 12 }}>
                    ⚡ 빠른 상담
                  </p>
                  <p style={{ fontSize: 13, color: "var(--color-dim)", lineHeight: 1.7 }}>
                    기관 B2B 도입을 검토 중이시면 바로 미팅을 잡으세요. 30분 이내로 구체적인 제안을 드립니다.
                  </p>
                  <button
                    type="button"
                    className="landing-btn-primary"
                    style={{ marginTop: 16, fontSize: 13, padding: "10px 20px" }}
                    onClick={() => success("미팅 일정 기능은 준비 중입니다. 이메일로 문의해 주세요.")}
                  >
                    미팅 일정 잡기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
