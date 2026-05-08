"use client";

import { useState } from "react";

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
      setError("회신 받으실 이메일을 입력해주세요.");
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
        setError(json.error ?? "제출 중 오류가 발생했습니다.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-8 text-center">
        <p className="text-xl font-bold text-emerald-300">제출 완료</p>
        <p className="mt-2 text-emerald-400">
          개발자(Luke)에게 정리된 이메일이 전달되었습니다.
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
        <h2 className={sectionTitleCls}>1. 본인·연락 정보</h2>
        <p className={sectionHintCls}>
          회신을 받기 위한 기본 정보입니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>이름 *</label>
            <input
              required
              className={inputCls}
              value={form.submitterName}
              onChange={(e) => set("submitterName", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>회신 이메일 *</label>
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
            <label className={labelCls}>회사명 (US 법인/사업체)</label>
            <input
              className={inputCls}
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="예: ABC Inc."
            />
          </div>
          <div>
            <label className={labelCls}>대표자 성명</label>
            <input
              className={inputCls}
              value={form.representativeName}
              onChange={(e) => set("representativeName", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>회사 대표 이메일</label>
            <input
              type="email"
              className={inputCls}
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>회사 주소</label>
            <input
              className={inputCls}
              value={form.companyAddress}
              onChange={(e) => set("companyAddress", e.target.value)}
              placeholder="예: 100 Main St, San Francisco, CA 94105, USA"
            />
          </div>
        </div>
      </section>

      {/* 2. USD 정산 받을 방법 */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>2. USD 정산 받을 방법</h2>
        <p className={sectionHintCls}>
          Enabler 보수를 USD로 송금하기 위한 정보입니다. Stripe Connect를
          쓰면 본인이 별도 페이지에서 안전하게 입력하므로 이 폼에서는
          현재 진행 상황만 알려주세요.
        </p>

        <div className="space-y-5">
          <div>
            <label className={labelCls}>Stripe Connect 가입 진행 상황</label>
            <div className="space-y-2">
              {(["가입 완료", "진행 중", "미시작"] as const).map((v) => (
                <label key={v} className={radioRowCls}>
                  <input
                    type="radio"
                    name="stripe-status"
                    checked={form.stripeConnectStatus === v}
                    onChange={() => set("stripeConnectStatus", v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>제출할 세금 양식</label>
            <div className="space-y-2">
              {(["W-9", "W-8BEN", "기타·미정"] as const).map((v) => (
                <label key={v} className={radioRowCls}>
                  <input
                    type="radio"
                    name="tax-form"
                    checked={form.taxFormType === v}
                    onChange={() => set("taxFormType", v)}
                  />
                  {v}
                </label>
              ))}
            </div>
            <p className={helpCls}>
              W-9: 미국 시민·영주권자 / W-8BEN: 그 외 외국인. 자세한
              안내는 Stripe Connect 가입 흐름에 포함됩니다.
            </p>
          </div>

          <div>
            <label className={labelCls}>미국 은행 계좌 보유 여부</label>
            <div className="space-y-2">
              {(["예", "아니오·예정"] as const).map((v) => (
                <label key={v} className={radioRowCls}>
                  <input
                    type="radio"
                    name="us-bank"
                    checked={form.hasUsBankAccount === v}
                    onChange={() => set("hasUsBankAccount", v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>은행 정보 (선택)</label>
            <textarea
              rows={2}
              className={inputCls}
              value={form.bankInfo}
              onChange={(e) => set("bankInfo", e.target.value)}
              placeholder="은행명·라우팅 번호 등은 Stripe Connect에 입력하므로 여기엔 안 적어도 됩니다. 보안상 권장: 비워두기."
            />
          </div>
        </div>
      </section>

      {/* 3. 사업 정책 (USD) */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>3. 정산 단가 정책 (USD)</h2>
        <p className={sectionHintCls}>
          양 측이 합의한 정산 단가입니다. 이후 어드민에서 변경 가능합니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>토큰당 USD 단가</label>
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.tokenUsdRate}
              onChange={(e) => set("tokenUsdRate", e.target.value)}
              placeholder="예: 5.00"
            />
            <p className={helpCls}>1토큰 = 30분 컨설팅 기준</p>
          </div>
          <div>
            <label className={labelCls}>플랫폼 수수료 (%)</label>
            <input
              type="number"
              step="0.1"
              className={inputCls}
              value={form.platformFeePct}
              onChange={(e) => set("platformFeePct", e.target.value)}
              placeholder="예: 20"
            />
            <p className={helpCls}>플랫폼이 가져가는 비율 — Enabler는 (1−이값) 만큼 수령</p>
          </div>
        </div>
      </section>

      {/* 4. 환불 정책 */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>4. 환불 정책</h2>
        <p className={sectionHintCls}>
          한국 고객이 토큰을 결제한 뒤 환불 가능한 기간입니다.
        </p>
        <div>
          <label className={labelCls}>미사용 토큰 환불 가능 기간 (일)</label>
          <input
            type="number"
            className={inputCls}
            value={form.refundDays}
            onChange={(e) => set("refundDays", e.target.value)}
            placeholder="예: 7"
          />
          <p className={helpCls}>
            결제 후 이 기간 내, 사용하지 않은 토큰은 100% 환불.
            사용된 토큰은 환불 불가 (관행상 표준 정책).
          </p>
        </div>
      </section>

      {/* 5. 추가 메모 */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>5. 추가 메모 (선택)</h2>
        <textarea
          rows={4}
          className={inputCls}
          value={form.additionalNotes}
          onChange={(e) => set("additionalNotes", e.target.value)}
          placeholder="개발자에게 전달할 사항이 있다면 자유롭게 적어주세요"
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
          제출하면 개발자(Luke)에게 정리된 이메일로 전달됩니다.
          민감 정보(신분증, Stripe API 키, 은행 디테일)는 이 폼이 아닌
          별도 채널로 주세요.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[var(--color-accent)] py-3 font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {submitting ? "제출 중..." : "제출하기"}
        </button>
      </div>
    </form>
  );
}
