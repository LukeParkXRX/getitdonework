"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// ── Constants ──────────────────────────────────────────────────────────────────

const SPECIALTY_OPTIONS = [
  "B2B SaaS",
  "Fintech",
  "E-commerce",
  "Healthcare",
  "AI/DeepTech",
  "Consumer",
  "Enterprise Sales",
  "Go-to-Market",
  "Fundraising",
  "Regulatory",
  "Market Research",
  "Partnerships",
  "Product Strategy",
  "Channel Strategy",
  "BD",
];

const STEP_LABEL_KEYS = ["stepBasicInfo", "stepSpecialty", "stepComplete"];

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  university: string;
  degreeType: string;
  location: string;
  photoUrl: string;
  specialties: string[];
  bio: string;
  creditRate: number;
}

interface FieldErrors {
  [key: string]: string;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "17px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "var(--color-dim)",
        marginBottom: "6px",
      }}
    >
      {children}
      {required && (
        <span style={{ color: "var(--color-accent)", marginLeft: "3px" }}>*</span>
      )}
    </label>
  );
}

function FieldInput({
  type = "text",
  placeholder,
  value,
  onChange,
  hasError,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        backgroundColor: "var(--color-dark)",
        border: `1px solid ${
          hasError
            ? "var(--color-red)"
            : focused
            ? "var(--color-accent)"
            : "var(--color-border)"
        }`,
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "16px",
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
        outline: "none",
        transition: "border-color 0.18s ease, box-shadow 0.18s ease",
        boxShadow: focused
          ? "0 0 0 3px oklch(0.91 0.2 110 / 0.08)"
          : hasError
          ? "0 0 0 3px oklch(0.65 0.2 25 / 0.1)"
          : "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function FieldTextarea({
  placeholder,
  value,
  onChange,
  hasError,
  rows = 5,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <textarea
      placeholder={placeholder}
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        backgroundColor: "var(--color-dark)",
        border: `1px solid ${
          hasError
            ? "var(--color-red)"
            : focused
            ? "var(--color-accent)"
            : "var(--color-border)"
        }`,
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "16px",
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
        outline: "none",
        resize: "vertical",
        lineHeight: 1.65,
        transition: "border-color 0.18s ease, box-shadow 0.18s ease",
        boxShadow: focused
          ? "0 0 0 3px oklch(0.91 0.2 110 / 0.08)"
          : hasError
          ? "0 0 0 3px oklch(0.65 0.2 25 / 0.1)"
          : "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <p
      style={{
        fontSize: "16px",
        fontFamily: "var(--font-body)",
        color: "var(--color-red)",
        marginTop: "5px",
        lineHeight: 1.4,
      }}
    >
      {message}
    </p>
  );
}

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const t = useTranslations("EnablerApply");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "0",
        marginBottom: "48px",
      }}
    >
      {STEP_LABEL_KEYS.map((labelKey, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: index < STEP_LABEL_KEYS.length - 1 ? "1" : "0 0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "17px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  transition: "all 0.25s ease",
                  backgroundColor: isCompleted
                    ? "var(--color-accent)"
                    : isCurrent
                    ? "transparent"
                    : "transparent",
                  border: isCompleted
                    ? "2px solid var(--color-accent)"
                    : isCurrent
                    ? "2px solid var(--color-accent)"
                    : "2px solid var(--color-border)",
                  color: isCompleted
                    ? "oklch(0.1 0 0)"
                    : isCurrent
                    ? "var(--color-accent)"
                    : "var(--color-dim)",
                }}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="oklch(0.1 0 0)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Connector line */}
              {index < STEP_LABEL_KEYS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    backgroundColor: isCompleted
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                    transition: "background-color 0.25s ease",
                    marginLeft: "0",
                  }}
                />
              )}
            </div>

            {/* Label */}
            <p
              style={{
                fontSize: "17px",
                fontFamily: "var(--font-display)",
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent
                  ? "var(--color-accent)"
                  : isCompleted
                  ? "var(--color-text)"
                  : "var(--color-dim)",
                marginTop: "8px",
                textAlign: "center",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
              }}
            >
              {t(labelKey)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: 기본 정보 ──────────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  errors,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  errors: FieldErrors;
}) {
  const t = useTranslations("EnablerApply");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <FieldLabel required>{t("labelName")}</FieldLabel>
        <FieldInput
          placeholder={t("placeholderName")}
          value={data.name}
          onChange={(v) => onChange("name", v)}
          hasError={!!errors.name}
        />
        {errors.name && <ErrorText message={errors.name} />}
      </div>

      <div>
        <FieldLabel required>{t("labelEmail")}</FieldLabel>
        <FieldInput
          type="email"
          placeholder="j.smith@stanford.edu"
          value={data.email}
          onChange={(v) => onChange("email", v)}
          hasError={!!errors.email}
        />
        {errors.email && <ErrorText message={errors.email} />}
      </div>

      <div>
        <FieldLabel required>{t("labelUniversity")}</FieldLabel>
        <FieldInput
          placeholder="Stanford GSB"
          value={data.university}
          onChange={(v) => onChange("university", v)}
          hasError={!!errors.university}
        />
        {errors.university && <ErrorText message={errors.university} />}
      </div>

      <div>
        <FieldLabel required>{t("labelDegreeType")}</FieldLabel>
        <FieldInput
          placeholder="MBA '24"
          value={data.degreeType}
          onChange={(v) => onChange("degreeType", v)}
          hasError={!!errors.degreeType}
        />
        {errors.degreeType && <ErrorText message={errors.degreeType} />}
      </div>

      <div>
        <FieldLabel required>{t("labelLocation")}</FieldLabel>
        <FieldInput
          placeholder="San Francisco, CA"
          value={data.location}
          onChange={(v) => onChange("location", v)}
          hasError={!!errors.location}
        />
        {errors.location && <ErrorText message={errors.location} />}
      </div>

      <div>
        <FieldLabel>{t("labelPhotoUrl")}</FieldLabel>
        <FieldInput
          placeholder="https://..."
          value={data.photoUrl}
          onChange={(v) => onChange("photoUrl", v)}
        />
        <p
          style={{
            fontSize: "16px",
            fontFamily: "var(--font-body)",
            color: "var(--color-dim)",
            marginTop: "5px",
          }}
        >
          {t("photoUrlHint")}
        </p>
      </div>
    </div>
  );
}

// ── Step 2: 전문 분야 ──────────────────────────────────────────────────────────

function Step2({
  data,
  onToggleSpecialty,
  onChangeBio,
  onChangeCreditRate,
  errors,
}: {
  data: FormData;
  onToggleSpecialty: (s: string) => void;
  onChangeBio: (v: string) => void;
  onChangeCreditRate: (v: number) => void;
  errors: FieldErrors;
}) {
  const t = useTranslations("EnablerApply");
  const [rateFocused, setRateFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Specialties */}
      <div>
        <FieldLabel required>{t("labelSpecialty")}</FieldLabel>
        <p
          style={{
            fontSize: "16px",
            fontFamily: "var(--font-body)",
            color: "var(--color-dim)",
            marginBottom: "10px",
          }}
        >
          {t("specialtyHint")}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {SPECIALTY_OPTIONS.map((s) => {
            const active = data.specialties.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => onToggleSpecialty(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "17px",
                  fontFamily: "var(--font-body)",
                  fontWeight: active ? 600 : 400,
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                  backgroundColor: active
                    ? "var(--color-accent)"
                    : "transparent",
                  color: active ? "oklch(0.1 0 0)" : "var(--color-dim)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  lineHeight: 1.5,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
        {errors.specialties && <ErrorText message={errors.specialties} />}
      </div>

      {/* Bio */}
      <div>
        <FieldLabel required>{t("labelBio")}</FieldLabel>
        <FieldTextarea
          placeholder={t("placeholderBio")}
          value={data.bio}
          onChange={onChangeBio}
          hasError={!!errors.bio}
          rows={6}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "5px",
          }}
        >
          {errors.bio ? (
            <ErrorText message={errors.bio} />
          ) : (
            <span />
          )}
          <span
            style={{
              fontSize: "16px",
              fontFamily: "var(--font-mono)",
              color:
                data.bio.length >= 100
                  ? "var(--color-accent)"
                  : "var(--color-dim)",
              transition: "color 0.2s ease",
            }}
          >
            {data.bio.length} / 100+
          </span>
        </div>
      </div>

      {/* Credit rate */}
      <div>
        <FieldLabel required>{t("labelCreditRate")}</FieldLabel>
        <p
          style={{
            fontSize: "16px",
            fontFamily: "var(--font-body)",
            color: "var(--color-dim)",
            marginBottom: "10px",
          }}
        >
          {t("creditRateHint")}
        </p>

        {/* Rate selector pills */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {[1, 2, 3, 4, 5].map((rate) => {
            const active = data.creditRate === rate;
            return (
              <button
                key={rate}
                type="button"
                onClick={() => onChangeCreditRate(rate)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: active ? 700 : 500,
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                  backgroundColor: active
                    ? "var(--color-accent)"
                    : "transparent",
                  color: active ? "oklch(0.1 0 0)" : "var(--color-dim)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: active
                    ? "0 0 0 3px oklch(0.91 0.2 110 / 0.12)"
                    : "none",
                }}
              >
                {rate}
              </button>
            );
          })}
        </div>

        {/* Number input as fallback / direct entry */}
        <input
          type="number"
          min={1}
          max={5}
          value={data.creditRate}
          onChange={(e) => {
            const v = Math.min(5, Math.max(1, Number(e.target.value)));
            onChangeCreditRate(v);
          }}
          onFocus={() => setRateFocused(true)}
          onBlur={() => setRateFocused(false)}
          style={{
            width: "100%",
            backgroundColor: "var(--color-dark)",
            border: `1px solid ${rateFocused ? "var(--color-accent)" : "var(--color-border)"}`,
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "16px",
            fontFamily: "var(--font-mono)",
            color: "var(--color-text)",
            outline: "none",
            transition: "border-color 0.18s ease, box-shadow 0.18s ease",
            boxShadow: rateFocused
              ? "0 0 0 3px oklch(0.91 0.2 110 / 0.08)"
              : "none",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}

// ── Step 3: 완료 ───────────────────────────────────────────────────────────────

function Step3() {
  const t = useTranslations("EnablerApply");
  const nextStepKeys = ["nextStep1", "nextStep2", "nextStep3"];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "24px 0 16px",
      }}
    >
      {/* Success circle */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: "oklch(0.55 0.18 145 / 0.15)",
          border: "2px solid var(--color-green)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "28px",
          animation: "var(--animate-fade-in)",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M7 18L14 25L29 10"
            stroke="var(--color-green)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "28px",
          color: "var(--color-text)",
          letterSpacing: "-0.03em",
          lineHeight: 1.25,
          marginBottom: "12px",
        }}
      >
        {t("successTitle")}
      </h2>

      <p
        style={{
          fontSize: "17px",
          fontFamily: "var(--font-body)",
          color: "var(--color-dim)",
          lineHeight: 1.7,
          maxWidth: "380px",
          marginBottom: "36px",
        }}
      >
        {t("successLine1")}
        <br />
        {t("successLine2")}
      </p>

      {/* Info card */}
      <div
        style={{
          width: "100%",
          backgroundColor: "oklch(0.55 0.18 145 / 0.06)",
          border: "1px solid oklch(0.55 0.18 145 / 0.2)",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "36px",
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontSize: "17px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "var(--color-green)",
            marginBottom: "10px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {t("nextStepsTitle")}
        </p>
        {nextStepKeys.map((stepKey, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: i < 2 ? "8px" : "0",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "oklch(0.55 0.18 145 / 0.2)",
                border: "1px solid var(--color-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "16px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: "var(--color-green)",
                marginTop: "1px",
              }}
            >
              {i + 1}
            </div>
            <p
              style={{
                fontSize: "17px",
                fontFamily: "var(--font-body)",
                color: "var(--color-text)",
                lineHeight: 1.5,
              }}
            >
              {t(stepKey)}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/"
        style={{
          display: "inline-block",
          width: "100%",
          padding: "13px 20px",
          borderRadius: "10px",
          backgroundColor: "var(--color-accent)",
          color: "oklch(0.1 0 0)",
          fontSize: "16px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: "-0.01em",
          textAlign: "center",
          boxSizing: "border-box",
          boxShadow: "var(--shadow-accent)",
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.88")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
        }
      >
        {t("backToHome")}
      </Link>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function EnablerApplyPage() {
  const t = useTranslations("EnablerApply");
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    university: "",
    degreeType: "",
    location: "",
    photoUrl: "",
    specialties: [],
    bio: "",
    creditRate: 2,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFieldChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function toggleSpecialty(s: string) {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter((x) => x !== s)
        : [...prev.specialties, s],
    }));
    if (errors.specialties) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.specialties;
        return next;
      });
    }
  }

  function validateStep1(): FieldErrors {
    const errs: FieldErrors = {};
    if (!formData.name.trim()) errs.name = t("errorNameRequired");
    if (!formData.email.trim()) errs.email = t("errorEmailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = t("errorEmailInvalid");
    if (!formData.university.trim()) errs.university = t("errorUniversityRequired");
    if (!formData.degreeType.trim()) errs.degreeType = t("errorDegreeTypeRequired");
    if (!formData.location.trim()) errs.location = t("errorLocationRequired");
    return errs;
  }

  function validateStep2(): FieldErrors {
    const errs: FieldErrors = {};
    if (formData.specialties.length === 0)
      errs.specialties = t("errorSpecialtyRequired");
    if (!formData.bio.trim()) errs.bio = t("errorBioRequired");
    else if (formData.bio.trim().length < 100)
      errs.bio = t("errorBioTooShort", { n: formData.bio.trim().length });
    return errs;
  }

  function handleNext() {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep(1);
  }

  async function handleSubmit() {
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/enabler-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          university: formData.university,
          degreeType: formData.degreeType,
          location: formData.location,
          photoUrl: formData.photoUrl || null,
          specialties: formData.specialties,
          bio: formData.bio,
          creditRate: formData.creditRate,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors({ general: json.error ?? t("errorSubmitFailed") });
        return;
      }
      setCurrentStep(2);
    } catch {
      setErrors({ general: t("errorNetwork") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-black)",
        fontFamily: "var(--font-body)",
        padding: "60px 20px 80px",
      }}
    >
      {/* Logo header */}
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          marginBottom: "48px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              backgroundColor: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              style={{ color: "oklch(0.1 0 0)" }}
            >
              <path
                d="M3 11L11 3M11 3H5M11 3V9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "17px",
              color: "var(--color-text)",
              letterSpacing: "-0.02em",
            }}
          >
            Get It Done
          </span>
        </Link>
      </div>

      {/* Card container */}
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "44px 48px",
        }}
      >
        {/* Page heading — hidden on step 3 */}
        {currentStep < 2 && (
          <div style={{ marginBottom: "36px" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "28px",
                color: "var(--color-text)",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                marginBottom: "8px",
              }}
            >
              {t("pageTitle")}
            </h1>
            <p
              style={{
                fontSize: "16px",
                fontFamily: "var(--font-body)",
                color: "var(--color-dim)",
                lineHeight: 1.6,
              }}
            >
              {t("pageSubtitle")}
            </p>
          </div>
        )}

        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step content — animated key transition */}
        <div
          key={currentStep}
          style={{
            animation: "var(--animate-slide-up)",
            animationDuration: "0.25s",
          }}
        >
          {currentStep === 0 && (
            <Step1
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
            />
          )}
          {currentStep === 1 && (
            <Step2
              data={formData}
              onToggleSpecialty={toggleSpecialty}
              onChangeBio={(v) => {
                setFormData((prev) => ({ ...prev, bio: v }));
                if (errors.bio && v.trim().length >= 100) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.bio;
                    return next;
                  });
                }
              }}
              onChangeCreditRate={(v) =>
                setFormData((prev) => ({ ...prev, creditRate: v }))
              }
              errors={errors}
            />
          )}
          {currentStep === 2 && <Step3 />}
        </div>

        {/* Navigation buttons */}
        {currentStep < 2 && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "36px",
            }}
          >
            {/* 이전 button — only on step 2 */}
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setCurrentStep(0);
                }}
                style={{
                  flex: "0 0 auto",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-dim)",
                  fontSize: "16px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "border-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(0.4 0.008 280)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--color-border)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-dim)";
                }}
              >
                {t("buttonPrev")}
              </button>
            )}

            {/* 일반 오류 메시지 */}
            {errors.general && (
              <p
                style={{
                  width: "100%",
                  color: "oklch(0.65 0.22 25)",
                  fontSize: "14px",
                  textAlign: "center",
                  margin: "0 0 8px",
                }}
              >
                {errors.general}
              </p>
            )}

            {/* 다음 / 제출 button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={currentStep === 0 ? handleNext : handleSubmit}
              style={{
                flex: 1,
                padding: "13px 20px",
                borderRadius: "10px",
                backgroundColor: isSubmitting
                  ? "oklch(0.91 0.2 110 / 0.5)"
                  : "var(--color-accent)",
                color: "oklch(0.1 0 0)",
                fontSize: "16px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                letterSpacing: "-0.01em",
                transition: "opacity 0.15s ease, transform 0.15s ease",
                boxShadow: isSubmitting ? "none" : "var(--shadow-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
              }}
            >
              {isSubmitting ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ animation: "spin 0.8s linear infinite" }}
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      stroke="oklch(0.1 0 0)"
                      strokeWidth="2"
                      strokeOpacity="0.3"
                    />
                    <path
                      d="M8 2a6 6 0 0 1 6 6"
                      stroke="oklch(0.1 0 0)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {t("buttonSubmitting")}
                </>
              ) : currentStep === 0 ? (
                t("buttonNext")
              ) : (
                t("buttonSubmit")
              )}
            </button>
          </div>
        )}

        {/* Divider + login link — steps 0 and 1 */}
        {currentStep < 2 && (
          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "17px",
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
            }}
          >
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              style={{
                color: "var(--color-accent)",
                fontWeight: 600,
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.75")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
              }
            >
              {t("loginLink")}
            </Link>
          </p>
        )}
      </div>

      {/* Spin keyframe injection */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
