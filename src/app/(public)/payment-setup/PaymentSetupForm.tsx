"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type FormState = {
  submitterName: string;
  submitterEmail: string;
  companyName: string;
  representativeName: string;
  companyAddress: string;
  contactEmail: string;

  taxFormType: "" | "W-9" | "W-8BEN" | "기타·미정";
  hasUsBankAccount: "" | "예" | "아니오·예정";
  bankInfo: string;
  stripeConnectStatus: "" | "가입 완료" | "진행 중" | "미시작";

  tokenUsdRate: string;
  platformFeePct: string;

  refundDays: string;

  additionalNotes: string;

  website: string; // honeypot
};

const initial: FormState = {
  submitterName: "",
  submitterEmail: "",
  companyName: "",
  representativeName: "",
  companyAddress: "",
  contactEmail: "",
  taxFormType: "",
  hasUsBankAccount: "",
  bankInfo: "",
  stripeConnectStatus: "",
  tokenUsdRate: "",
  platformFeePct: "",
  refundDays: "",
  additionalNotes: "",
  website: "",
};

const inputCls =
  "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-colors";
const labelCls = "mb-1.5 block text-sm font-medium text-neutral-200";
const helpCls = "mt-1 text-xs text-neutral-400";
const sectionCls =
  "rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5 sm:p-6";
const sectionTitleCls = "mb-1 text-base font-semibold text-neutral-50";
const sectionHintCls = "mb-5 text-sm text-neutral-400";
const radioRowCls = "flex items-center gap-2 text-sm text-neutral-200";

export default function PaymentSetupForm() {
  const t = useTranslations("PaymentSetupForm");
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.submitterEmail.includes("@")) {
      setError(t("errorEmailRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? t("errorSubmitFailed"));
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t("errorNetwork"));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-8 text-center">
        <p className="text-xl font-bold text-emerald-300">{t("successTitle")}</p>
        <p className="mt-2 text-emerald-400">
          {t("successMessage")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* honeypot */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(e) => set("website", e.target.value)}
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* 1. 본인·연락 정보 */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>{t("section1Title")}</h2>
        <p className={sectionHintCls}>
          {t("section1Hint")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{t("nameLabel")}</label>
            <input
              required
              className={inputCls}
              value={form.submitterName}
              onChange={(e) => set("submitterName", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>{t("replyEmailLabel")}</label>
            <input
              type="email"
              required
              className={inputCls}
              value={form.submitterEmail}
              onChange={(e) => set("submitterEmail", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t("companyNameLabel")}</label>
            <input
              className={inputCls}
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder={t("companyNamePlaceholder")}
            />
          </div>
          <div>
            <label className={labelCls}>{t("representativeNameLabel")}</label>
            <input
              className={inputCls}
              value={form.representativeName}
              onChange={(e) => set("representativeName", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>{t("contactEmailLabel")}</label>
            <input
              type="email"
              className={inputCls}
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t("companyAddressLabel")}</label>
            <input
              className={inputCls}
              value={form.companyAddress}
              onChange={(e) => set("companyAddress", e.target.value)}
              placeholder={t("companyAddressPlaceholder")}
            />
          </div>
        </div>
      </section>

      {/* 2. USD 정산 받을 방법 */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>{t("section2Title")}</h2>
        <p className={sectionHintCls}>
          {t("section2Hint")}
        </p>

        <div className="space-y-5">
          <div>
            <label className={labelCls}>{t("stripeStatusLabel")}</label>
            <div className="space-y-2">
              {(["가입 완료", "진행 중", "미시작"] as const).map((v) => (
                <label key={v} className={radioRowCls}>
                  <input
                    type="radio"
                    name="stripe-status"
                    checked={form.stripeConnectStatus === v}
                    onChange={() => set("stripeConnectStatus", v)}
                  />
                  {t(`stripeStatusOption.${v}`)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>{t("taxFormLabel")}</label>
            <div className="space-y-2">
              {(["W-9", "W-8BEN", "기타·미정"] as const).map((v) => (
                <label key={v} className={radioRowCls}>
                  <input
                    type="radio"
                    name="tax-form"
                    checked={form.taxFormType === v}
                    onChange={() => set("taxFormType", v)}
                  />
                  {t(`taxFormOption.${v}`)}
                </label>
              ))}
            </div>
            <p className={helpCls}>
              {t("taxFormHelp")}
            </p>
          </div>

          <div>
            <label className={labelCls}>{t("usBankLabel")}</label>
            <div className="space-y-2">
              {(["예", "아니오·예정"] as const).map((v) => (
                <label key={v} className={radioRowCls}>
                  <input
                    type="radio"
                    name="us-bank"
                    checked={form.hasUsBankAccount === v}
                    onChange={() => set("hasUsBankAccount", v)}
                  />
                  {t(`usBankOption.${v}`)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>{t("bankInfoLabel")}</label>
            <textarea
              rows={2}
              className={inputCls}
              value={form.bankInfo}
              onChange={(e) => set("bankInfo", e.target.value)}
              placeholder={t("bankInfoPlaceholder")}
            />
          </div>
        </div>
      </section>

      {/* 3. 사업 정책 (USD) */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>{t("section3Title")}</h2>
        <p className={sectionHintCls}>
          {t("section3Hint")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{t("tokenRateLabel")}</label>
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.tokenUsdRate}
              onChange={(e) => set("tokenUsdRate", e.target.value)}
              placeholder={t("tokenRatePlaceholder")}
            />
            <p className={helpCls}>{t("tokenRateHelp")}</p>
          </div>
          <div>
            <label className={labelCls}>{t("platformFeeLabel")}</label>
            <input
              type="number"
              step="0.1"
              className={inputCls}
              value={form.platformFeePct}
              onChange={(e) => set("platformFeePct", e.target.value)}
              placeholder={t("platformFeePlaceholder")}
            />
            <p className={helpCls}>{t("platformFeeHelp")}</p>
          </div>
        </div>
      </section>

      {/* 4. 환불 정책 */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>{t("section4Title")}</h2>
        <p className={sectionHintCls}>
          {t("section4Hint")}
        </p>
        <div>
          <label className={labelCls}>{t("refundDaysLabel")}</label>
          <input
            type="number"
            className={inputCls}
            value={form.refundDays}
            onChange={(e) => set("refundDays", e.target.value)}
            placeholder={t("refundDaysPlaceholder")}
          />
          <p className={helpCls}>
            {t("refundDaysHelp")}
          </p>
        </div>
      </section>

      {/* 5. 추가 메모 */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>{t("section5Title")}</h2>
        <textarea
          rows={4}
          className={inputCls}
          value={form.additionalNotes}
          onChange={(e) => set("additionalNotes", e.target.value)}
          placeholder={t("additionalNotesPlaceholder")}
        />
      </section>

      {/* error */}
      {error && (
        <p className="rounded-lg border border-red-700/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* submit */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5 sm:p-6">
        <p className="mb-4 text-sm text-neutral-400">
          {t("submitNotice")}
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[var(--color-accent)] py-3 font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {submitting ? t("submitting") : t("submitButton")}
        </button>
      </div>
    </form>
  );
}
