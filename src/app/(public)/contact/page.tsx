"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Contact");
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

    if (!name.trim()) newErrors.name = t("errorName");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("errorEmail");
    }
    if (!type) newErrors.type = t("errorType");
    if (!message.trim() || message.trim().length < 10) {
      newErrors.message = t("errorMessage");
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
        toastError(json.error ?? t("submitFailed"));
        return;
      }
      setIsSubmitted(true);
      success(t("submitSuccess"));
    } catch {
      toastError(t("networkError"));
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
      <main>
        {/* Hero */}
        <section className="pt-12 pb-10 md:pt-20 md:pb-14">
          <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
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
              {t("heroTitle")}
            </h1>
            <p style={{ fontSize: 17, color: "var(--color-dim)", lineHeight: 1.7 }}>
              {t("heroSubtitle")}
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
                {t("formTitle")}
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
                    {t("successTitle")}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.7, marginBottom: 28 }}>
                    {t("successBody")}
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="landing-btn-primary"
                    style={{ justifyContent: "center" }}
                  >
                    {t("newInquiry")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* 문의 유형 */}
                  <div>
                    <label style={labelStyle}>{t("inquiryTypeLabel")}</label>
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
                        <option value="" disabled>{t("optionPlaceholder")}</option>
                        <option value="general">{t("optionGeneral")}</option>
                        <option value="b2b">{t("optionB2b")}</option>
                        <option value="startup">{t("optionStartup")}</option>
                        <option value="media">{t("optionMedia")}</option>
                        <option value="enabler">{t("optionEnabler")}</option>
                        <option value="other">{t("optionOther")}</option>
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
                      <label style={labelStyle}>{t("nameLabel")}</label>
                      <input
                        type="text"
                        placeholder={t("namePlaceholder")}
                        style={inputStyle}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(200,255,0,0.4)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                      />
                      {errors.name && <p style={errorStyle}>{errors.name}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>{t("companyLabel")}</label>
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
                    <label style={labelStyle}>{t("emailLabel")}</label>
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
                    <label style={labelStyle}>{t("messageLabel")}</label>
                    <textarea
                      placeholder={t("messagePlaceholder")}
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
                      {isSubmitting ? t("submitting") : t("submitButton")}
                    </button>
                    <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-dim)", marginTop: 12 }}>
                      {t("submitNote")}
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column - Contact Info */}
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 24 }}>
                {t("directContactTitle")}
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
                    {t("emailCardLabel")}
                  </p>
                  <a
                    href="mailto:hello@getitdonework.com"
                    style={{ fontSize: 16, fontWeight: 700, color: "var(--color-accent)", textDecoration: "none", display: "block", marginBottom: 4 }}
                  >
                    hello@getitdonework.com
                  </a>
                  <p style={{ fontSize: 13, color: "var(--color-dim)" }}>{t("emailCardDesc")}</p>
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
                    {t("partnershipCardLabel")}
                  </p>
                  <a
                    href="mailto:partners@getitdonework.com"
                    style={{ fontSize: 16, fontWeight: 700, color: "var(--color-blue)", textDecoration: "none", display: "block", marginBottom: 4 }}
                  >
                    partners@getitdonework.com
                  </a>
                  <p style={{ fontSize: 13, color: "var(--color-dim)" }}>{t("partnershipCardDesc")}</p>
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
                    {t("enablerCardLabel")}
                  </p>
                  <Link
                    href="/enabler-apply"
                    style={{ fontSize: 16, fontWeight: 700, color: "var(--color-green)", textDecoration: "none", display: "block", marginBottom: 4 }}
                  >
                    {t("enablerCardLink")}
                  </Link>
                  <p style={{ fontSize: 13, color: "var(--color-dim)" }}>{t("enablerCardDesc")}</p>
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
                    {t("quickConsultTitle")}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--color-dim)", lineHeight: 1.7 }}>
                    {t("quickConsultBody")}
                  </p>
                  <a
                    href="mailto:hello@getitdonework.com?subject=미팅 일정 문의"
                    className="landing-btn-primary"
                    style={{ marginTop: 16, fontSize: 13, padding: "10px 20px", display: "inline-block", textDecoration: "none" }}
                  >
                    {t("scheduleMeeting")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
