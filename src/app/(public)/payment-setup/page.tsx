import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PaymentSetupForm from "./PaymentSetupForm";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PaymentSetup");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false, nocache: true },
  };
}

const cardCls =
  "rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5 sm:p-6";
const cardTitleCls = "mb-1 text-base font-semibold text-neutral-50";
const cardHintCls = "mb-4 text-sm text-neutral-400";
const tableTh =
  "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800";
const tableTd =
  "px-3 py-2 text-sm text-neutral-200 border-b border-neutral-800/60";
const codeChip =
  "rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[12px] text-neutral-200";

export default async function PaymentSetupPage() {
  const t = await getTranslations("PaymentSetup");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <header className="mb-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--color-accent)]">
          Internal · Payment Setup
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">
          {t("heroTitle")}
        </h1>
        <p className="text-base leading-relaxed text-neutral-300">
          {t("heroIntro")}
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          {t("heroEstimate")}
        </p>
      </header>

      {/* ───────────── 가이드 영역 ───────────── */}
      <section className="mb-12 space-y-6">
        <div className="rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold text-neutral-50">
            {t("summaryTitle")}
          </h2>
          <ol className="ml-5 list-decimal space-y-2 text-sm text-neutral-200">
            <li>
              {t.rich("summaryStep1", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("summaryStep2", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("summaryStep3", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("summaryStep4", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("summaryStep5", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("summaryStep6", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("summaryStep7", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
          </ol>
        </div>

        {/* 1. API 키 & ID */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>{t("card1Title")}</h2>
          <p className={cardHintCls}>
            {t.rich("card1Hint", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-900/60">
                  <th className={tableTh}>{t("card1ColItem")}</th>
                  <th className={tableTh}>{t("card1ColFormat")}</th>
                  <th className={tableTh}>{t("card1ColLocation")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tableTd}>Live Secret Key</td>
                  <td className={tableTd}>
                    <code className={codeChip}>sk_live_…</code>
                  </td>
                  <td className={tableTd}>Developers › API keys</td>
                </tr>
                <tr>
                  <td className={tableTd}>Live Publishable Key</td>
                  <td className={tableTd}>
                    <code className={codeChip}>pk_live_…</code>
                  </td>
                  <td className={tableTd}>{t("card1SameLocation")}</td>
                </tr>
                <tr>
                  <td className={tableTd}>Test Secret Key</td>
                  <td className={tableTd}>
                    <code className={codeChip}>sk_test_…</code>
                  </td>
                  <td className={tableTd}>{t("card1SameLocationDev")}</td>
                </tr>
                <tr>
                  <td className={tableTd}>Test Publishable Key</td>
                  <td className={tableTd}>
                    <code className={codeChip}>pk_test_…</code>
                  </td>
                  <td className={tableTd}>{t("card1SameLocation")}</td>
                </tr>
                <tr>
                  <td className={tableTd}>Webhook Signing Secret</td>
                  <td className={tableTd}>
                    <code className={codeChip}>whsec_…</code>
                  </td>
                  <td className={tableTd}>{t("card1WebhookLocation")}</td>
                </tr>
                <tr>
                  <td className={tableTd}>Connect Platform Account ID</td>
                  <td className={tableTd}>
                    <code className={codeChip}>acct_…</code>
                  </td>
                  <td className={tableTd}>{t("card1ConnectLocation")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Webhook 등록 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>{t("card2Title")}</h2>
          <p className={cardHintCls}>
            {t("card2Hint")}
          </p>
          <p className="mb-2 text-sm text-neutral-300">
            <strong>URL</strong>:{" "}
            <code className={codeChip}>
              https://getitdonework.com/api/webhooks/stripe
            </code>
          </p>
          <p className="mb-2 text-sm text-neutral-300">
            {t.rich("card2EventsLabel", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <ul className="ml-5 list-disc space-y-1 text-sm text-neutral-200">
            <li>
              <code className={codeChip}>checkout.session.completed</code>
            </li>
            <li>
              <code className={codeChip}>payment_intent.succeeded</code>
            </li>
            <li>
              <code className={codeChip}>payment_intent.payment_failed</code>
            </li>
            <li>
              <code className={codeChip}>charge.refunded</code>
            </li>
            <li>
              <code className={codeChip}>account.updated</code> (Connect)
            </li>
            <li>
              <code className={codeChip}>transfer.created</code> /{" "}
              <code className={codeChip}>transfer.failed</code>
            </li>
          </ul>
          <p className="mt-3 text-sm text-neutral-400">
            {t.rich("card2SigningNote", {
              strong: (chunks) => <strong>{chunks}</strong>,
              code: (chunks) => <code className={codeChip}>{chunks}</code>,
            })}
          </p>
        </div>

        {/* 3. 도메인 + 결제수단 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>{t("card3Title")}</h2>
          <p className={cardHintCls}>
            {t("card3Hint")}
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-neutral-200">
            <li>
              {t("card3DomainLabel")}{" "}
              <code className={codeChip}>getitdonework.com</code>
            </li>
            <li>
              {t.rich("card3Cards", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("card3Korean", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("card3Wallets", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t("card3LocalPay")}
            </li>
          </ul>
        </div>

        {/* 4. Stripe Connect 셋업 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>{t("card4Title")}</h2>
          <p className={cardHintCls}>
            {t("card4Hint")}
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-neutral-200">
            <li>
              {t.rich("card4Branding", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("card4Capability", {
                strong: (chunks) => <strong>{chunks}</strong>,
                code: (chunks) => <code className={codeChip}>{chunks}</code>,
              })}
            </li>
            <li>
              {t.rich("card4TaxForms", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("card41099", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
          </ul>
        </div>

        {/* 5. 발신 이메일 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>{t("card5Title")}</h2>
          <p className={cardHintCls}>
            {t("card5Hint")}
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-neutral-200">
            <li>
              {t("card5From")}{" "}
              <code className={codeChip}>noreply@getitdonework.com</code>)
            </li>
            <li>
              {t("card5Dns")}
            </li>
          </ul>
        </div>

        {/* 6. 개발팀 권한 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>{t("card6Title")}</h2>
          <div className="space-y-3 text-sm text-neutral-200">
            <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-3">
              <p className="font-semibold text-emerald-300">
                {t("card6OptionATitle")}
              </p>
              <p className="mt-1 text-neutral-300">
                {t.rich("card6OptionABody", {
                  code: (chunks) => <code className={codeChip}>{chunks}</code>,
                })}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-3">
              <p className="font-semibold text-neutral-200">
                {t("card6OptionBTitle")}
              </p>
              <p className="mt-1 text-neutral-300">
                {t("card6OptionBBody")}
              </p>
            </div>
          </div>
        </div>

        {/* 7. 보안 전달 채널 */}
        <div className="rounded-2xl border border-amber-700/40 bg-amber-950/20 p-5 sm:p-6">
          <h2 className="mb-2 text-base font-semibold text-amber-300">
            {t("card7Title")}
          </h2>
          <p className="mb-3 text-sm text-neutral-200">
            {t("card7Intro")}
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-neutral-200">
            <li>
              {t.rich("card7Channel1", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("card7Channel2", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
            <li>
              {t.rich("card7Channel3", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </li>
          </ul>
        </div>

        {/* 8. 우선순위 타임라인 */}
        <div className={cardCls}>
          <h2 className={cardTitleCls}>{t("timelineTitle")}</h2>
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-900/60">
                  <th className={tableTh}>{t("timelineColWeek")}</th>
                  <th className={tableTh}>{t("timelineColCompany")}</th>
                  <th className={tableTh}>{t("timelineColDev")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tableTd}>{t("timelineWeek1")}</td>
                  <td className={tableTd}>{t("timelineWeek1Company")}</td>
                  <td className={tableTd}>{t("timelineWeek1Dev")}</td>
                </tr>
                <tr>
                  <td className={tableTd}>{t("timelineWeek12")}</td>
                  <td className={tableTd}>
                    {t("timelineWeek12Company")}
                  </td>
                  <td className={tableTd}>{t("timelineWeek12Dev")}</td>
                </tr>
                <tr>
                  <td className={tableTd}>{t("timelineWeek2")}</td>
                  <td className={tableTd}>
                    {t("timelineWeek2Company")}
                  </td>
                  <td className={tableTd}>{t("timelineWeek2Dev")}</td>
                </tr>
                <tr>
                  <td className={tableTd}>{t("timelineWeek3")}</td>
                  <td className={tableTd}>{t("timelineWeek3Company")}</td>
                  <td className={tableTd}>{t("timelineWeek3Dev")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───────────── 폼 영역 ───────────── */}
      <div className="mb-6 border-t border-neutral-800 pt-10">
        <h2 className="mb-2 text-2xl font-bold text-neutral-50">
          {t("formSectionTitle")}
        </h2>
        <p className="text-sm text-neutral-400">
          {t("formSectionHint")}
        </p>
      </div>
      <PaymentSetupForm />
    </main>
  );
}
