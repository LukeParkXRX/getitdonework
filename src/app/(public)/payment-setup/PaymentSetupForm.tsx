"use client";

import { useState } from "react";

type PackageRow = { name: string; tokens: string; priceKrw: string };

const INITIAL_PACKAGES: PackageRow[] = [
  { name: "", tokens: "", priceKrw: "" },
];

export default function PaymentSetupForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [form, setForm] = useState({
    submitterName: "",
    submitterEmail: "",
    bizRegNumber: "",
    bizName: "",
    representativeName: "",
    representativeBirth: "",
    bizAddress: "",
    bizPhone: "",
    bizEmail: "",
    isCorporation: false,
    corporationDetails: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    swiftCode: "",
    serviceDescription: "",
    customerSupportEmail: "",
    paymentMethods: [] as string[],
    autoApprovalThresholdKrw: "",
    approvalExpirationDays: "",
    refundDays: "",
    partialRefund: "",
    cancelWithin24hPercent: "",
    refundProcessingDays: "",
    taxpayerType: "",
    vatDisplay: "",
    useStripeTax: "",
    invoiceLanguage: "",
    tokenUsdRate: "",
    platformFeePct: "",
    hasEnablerTiers: "",
    enablerTierDetails: "",
    minPayoutUsd: "",
    taxAdvisorNotes: "",
    additionalNotes: "",
    website: "", // honeypot
  });

  const [packages, setPackages] = useState<PackageRow[]>(INITIAL_PACKAGES);

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function togglePaymentMethod(method: string) {
    setForm((f) => {
      const arr = f.paymentMethods.includes(method)
        ? f.paymentMethods.filter((m) => m !== method)
        : [...f.paymentMethods, method];
      return { ...f, paymentMethods: arr };
    });
  }

  function updatePackage(idx: number, field: keyof PackageRow, val: string) {
    setPackages((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p))
    );
  }

  function addPackage() {
    setPackages((prev) => [...prev, { name: "", tokens: "", priceKrw: "" }]);
  }

  function removePackage(idx: number) {
    setPackages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = { ...form, packages };
      const res = await fetch("/api/payment-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        <p className="mt-2 text-emerald-400">개발자에게 이메일이 발송되었습니다.</p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-colors";
  const labelCls = "mb-1.5 block text-sm font-medium text-neutral-200";
  const sectionCls = "mb-10 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5 sm:p-6";
  const sectionTitleCls = "mb-5 text-base font-semibold text-neutral-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(e) => set("website", e.target.value)}
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* 제출자 정보 */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>1. 제출자 정보</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>이름 *</label>
            <input className={inputCls} required value={form.submitterName}
              onChange={(e) => set("submitterName", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>이메일 *</label>
            <input className={inputCls} type="email" required value={form.submitterEmail}
              onChange={(e) => set("submitterEmail", e.target.value)} />
          </div>
        </div>
      </div>

      {/* 사업자 정보 */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>2. 사업자 정보</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>사업자등록번호</label>
            <input className={inputCls} value={form.bizRegNumber}
              onChange={(e) => set("bizRegNumber", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>상호명</label>
            <input className={inputCls} value={form.bizName}
              onChange={(e) => set("bizName", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>대표자 성명</label>
            <input className={inputCls} value={form.representativeName}
              onChange={(e) => set("representativeName", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>대표자 생년월일</label>
            <input className={inputCls} placeholder="YYYY-MM-DD" value={form.representativeBirth}
              onChange={(e) => set("representativeBirth", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>사업장 주소</label>
            <input className={inputCls} value={form.bizAddress}
              onChange={(e) => set("bizAddress", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>사업장 전화번호</label>
            <input className={inputCls} value={form.bizPhone}
              onChange={(e) => set("bizPhone", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>사업장 이메일</label>
            <input className={inputCls} type="email" value={form.bizEmail}
              onChange={(e) => set("bizEmail", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-neutral-200">
              <input type="checkbox" checked={form.isCorporation}
                onChange={(e) => set("isCorporation", e.target.checked)} />
              법인사업자
            </label>
          </div>
          {form.isCorporation && (
            <div className="sm:col-span-2">
              <label className={labelCls}>법인 세부정보</label>
              <textarea className={inputCls} rows={3} value={form.corporationDetails}
                onChange={(e) => set("corporationDetails", e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* 정산 계좌 */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>3. 정산 계좌</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>은행명</label>
            <input className={inputCls} value={form.bankName}
              onChange={(e) => set("bankName", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>계좌번호</label>
            <input className={inputCls} value={form.accountNumber}
              onChange={(e) => set("accountNumber", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>예금주</label>
            <input className={inputCls} value={form.accountHolder}
              onChange={(e) => set("accountHolder", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>SWIFT Code (해외 송금 시)</label>
            <input className={inputCls} value={form.swiftCode}
              onChange={(e) => set("swiftCode", e.target.value)} />
          </div>
        </div>
      </div>

      {/* 서비스 정보 */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>4. 서비스 정보</p>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>서비스 설명</label>
            <textarea className={inputCls} rows={3} value={form.serviceDescription}
              onChange={(e) => set("serviceDescription", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>고객지원 이메일</label>
            <input className={inputCls} type="email" value={form.customerSupportEmail}
              onChange={(e) => set("customerSupportEmail", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>결제 수단 (복수 선택)</label>
            <div className="flex flex-wrap gap-3 mt-1">
              {["카드", "계좌이체", "간편결제"].map((m) => (
                <label key={m} className="flex items-center gap-1.5 text-sm text-neutral-200">
                  <input type="checkbox" checked={form.paymentMethods.includes(m)}
                    onChange={() => togglePaymentMethod(m)} />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 크레딧 패키지 */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>5. 크레딧 패키지</p>
        <div className="space-y-3">
          {packages.map((pkg, idx) => (
            <div key={idx} className="flex gap-2">
              <input className={inputCls} placeholder="패키지명" value={pkg.name}
                onChange={(e) => updatePackage(idx, "name", e.target.value)} />
              <input className={inputCls} placeholder="토큰 수" value={pkg.tokens}
                onChange={(e) => updatePackage(idx, "tokens", e.target.value)} />
              <input className={inputCls} placeholder="가격 (KRW)" value={pkg.priceKrw}
                onChange={(e) => updatePackage(idx, "priceKrw", e.target.value)} />
              <button type="button" onClick={() => removePackage(idx)}
                className="shrink-0 text-neutral-400 hover:text-red-500">
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addPackage}
            className="text-sm text-[var(--color-accent)] hover:underline">
            + 패키지 추가
          </button>
        </div>
      </div>

      {/* 환불 정책 */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>6. 환불 정책</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>환불 가능 기간 (일)</label>
            <input className={inputCls} value={form.refundDays}
              onChange={(e) => set("refundDays", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>부분 환불 정책</label>
            <input className={inputCls} value={form.partialRefund}
              onChange={(e) => set("partialRefund", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>24시간 이내 취소 환불율 (%)</label>
            <input className={inputCls} value={form.cancelWithin24hPercent}
              onChange={(e) => set("cancelWithin24hPercent", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>환불 처리 기간 (일)</label>
            <input className={inputCls} value={form.refundProcessingDays}
              onChange={(e) => set("refundProcessingDays", e.target.value)} />
          </div>
        </div>
      </div>

      {/* 세무 정보 */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>7. 세무 / 정산 정보</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>납세자 유형</label>
            <input className={inputCls} value={form.taxpayerType}
              onChange={(e) => set("taxpayerType", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>VAT 표시 방식</label>
            <input className={inputCls} value={form.vatDisplay}
              onChange={(e) => set("vatDisplay", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>토큰 USD 환율</label>
            <input className={inputCls} value={form.tokenUsdRate}
              onChange={(e) => set("tokenUsdRate", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>플랫폼 수수료 (%)</label>
            <input className={inputCls} value={form.platformFeePct}
              onChange={(e) => set("platformFeePct", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>최소 정산 금액 (USD)</label>
            <input className={inputCls} value={form.minPayoutUsd}
              onChange={(e) => set("minPayoutUsd", e.target.value)} />
          </div>
        </div>
      </div>

      {/* 추가 메모 */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>8. 추가 메모</p>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>세무사 메모</label>
            <textarea className={inputCls} rows={3} value={form.taxAdvisorNotes}
              onChange={(e) => set("taxAdvisorNotes", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>기타 전달 사항</label>
            <textarea className={inputCls} rows={3} value={form.additionalNotes}
              onChange={(e) => set("additionalNotes", e.target.value)} />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-700/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[var(--color-accent)] py-3 font-semibold text-neutral-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {submitting ? "제출 중..." : "제출하기"}
      </button>
    </form>
  );
}
