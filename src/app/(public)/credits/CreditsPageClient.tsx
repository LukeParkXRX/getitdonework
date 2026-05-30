"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// ── 기존 정보성 콘텐츠 데이터 ────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 mb-4 uppercase tracking-widest font-bold"
      style={{ fontSize: 11, color: "var(--color-accent)" }}
    >
      <span
        style={{
          width: 24,
          height: 2,
          background: "var(--color-accent)",
          display: "inline-block",
        }}
      />
      {children}
    </div>
  );
}

const flowNodes = [
  { labelKey: "flowBuyLabel", subKey: "flowBuySub", color: "var(--color-green)" },
  { labelKey: "flowPoolLabel", subKey: "flowPoolSub", color: "var(--color-blue)" },
  { labelKey: "flowAllocateLabel", subKey: "flowAllocateSub", color: "var(--color-accent)" },
  { labelKey: "flowBookLabel", subKey: "flowBookSub", color: "var(--color-amber)" },
  { labelKey: "flowCompleteLabel", subKey: "flowCompleteSub", color: "var(--color-accent)" },
  { labelKey: "flowSettleLabel", subKey: "flowSettleSub", color: "var(--color-green)" },
];

const sessionTypes = [
  {
    name: "Chemistry",
    color: "var(--color-green)",
    priceKey: "sessionChemistryPrice",
    priceDetailKey: "sessionChemistryDetail",
    badgeKey: null,
    featureKeys: [
      "sessionChemistryFeat1",
      "sessionChemistryFeat2",
      "sessionChemistryFeat3",
    ],
  },
  {
    name: "Standard",
    color: "var(--color-blue)",
    priceKey: "sessionStandardPrice",
    priceDetailKey: "sessionStandardDetail",
    badgeKey: "badgePopular",
    featureKeys: [
      "sessionStandardFeat1",
      "sessionStandardFeat2",
      "sessionStandardFeat3",
      "sessionStandardFeat4",
    ],
  },
  {
    name: "Project",
    color: "var(--color-amber)",
    priceKey: "sessionProjectPrice",
    priceDetailKey: "sessionProjectDetail",
    badgeKey: null,
    featureKeys: [
      "sessionProjectFeat1",
      "sessionProjectFeat2",
      "sessionProjectFeat3",
      "sessionProjectFeat4",
    ],
  },
];

const b2bPackages = [
  {
    name: "Starter",
    creditsKey: "b2bStarterCredits",
    priceUSD: "$2,000",
    priceKRW: "₩2,800,000",
    targetKey: "b2bStarterTarget",
    recommended: false,
  },
  {
    name: "Growth",
    creditsKey: "b2bGrowthCredits",
    priceUSD: "$5,700",
    priceKRW: "₩8,000,000",
    targetKey: "b2bGrowthTarget",
    recommended: true,
  },
  {
    name: "Enterprise",
    creditsKey: "b2bEnterpriseCredits",
    priceUSDKey: "b2bEnterprisePrice",
    priceKRW: "",
    targetKey: "b2bEnterpriseTarget",
    recommended: false,
  },
];

// ── Props ─────────────────────────────────────────────────────────────

type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  price_krw: number;
  sort_order: number;
};

type Props = {
  packages: CreditPackage[];
  isLoggedIn: boolean;
  isStartup: boolean;
};

// 결제 모듈 연동 전 운영 플래그. 카드 결제(자동 충전)는 준비 중이며,
// 초기에는 관리자가 어드민에서 크레딧을 직접 지급한다. 연동 완료 시 true 로.
const PAYMENT_ENABLED = false;

// ── Component ─────────────────────────────────────────────────────────

export default function CreditsPageClient({ packages, isLoggedIn, isStartup }: Props) {
  const t = useTranslations("Credits");
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handlePurchase(pkg: CreditPackage) {
    if (!PAYMENT_ENABLED) return; // 결제 모듈 준비 전 — 버튼 비활성, 방어적 차단
    if (!isLoggedIn) {
      router.push("/login?redirect=/credits");
      return;
    }
    if (!isStartup) {
      setCheckoutError(t("errStartupRequired"));
      return;
    }
    setLoadingId(pkg.id);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCheckoutError(json.error ?? t("errCheckout"));
        return;
      }
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      setCheckoutError(t("errNetwork"));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div
      style={{
        background: "var(--color-dark)",
        minHeight: "100vh",
        color: "var(--color-text)",
      }}
    >
      <main>
        {/* Hero */}
        <section className="text-center px-6 py-24">
          <Eyebrow>{t("heroEyebrow")}</Eyebrow>
          <h1
            className="font-bold mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              color: "var(--color-text)",
              lineHeight: 1.15,
            }}
          >
            {t("heroTitle")}
          </h1>
          <p
            className="mx-auto"
            style={{
              maxWidth: 560,
              color: "var(--color-dim)",
              fontSize: 17,
              lineHeight: 1.7,
            }}
          >
            {t("heroSubtitle")}
          </p>
        </section>

        {/* Credit Flow */}
        <section className="px-6 pb-24">
          <div
            className="mx-auto"
            style={{
              maxWidth: 900,
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 20,
              padding: "40px 32px",
            }}
          >
            <div className="text-center mb-10">
              <Eyebrow>{t("flowEyebrow")}</Eyebrow>
              <h2
                className="font-bold"
                style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--color-text)" }}
              >
                {t("flowTitle")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {flowNodes.map((node, i) => (
                <div key={node.labelKey} className="flex items-center gap-2">
                  <div
                    style={{
                      background: `${node.color}18`,
                      border: `1.5px solid ${node.color}55`,
                      borderRadius: 10,
                      padding: "10px 16px",
                      minWidth: 100,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: node.color, lineHeight: 1.3 }}>
                      {t(node.labelKey)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-dim)", marginTop: 2 }}>
                      {t(node.subKey)}
                    </div>
                  </div>
                  {i < flowNodes.length - 1 && (
                    <span style={{ color: "var(--color-dim)", fontSize: 18, fontWeight: 300, flexShrink: 0 }}>
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 개인 구매 패키지 (Stripe) ── */}
        {packages.length > 0 && (
          <section className="px-6 pb-24">
            <div className="mx-auto" style={{ maxWidth: 900 }}>
              <div className="text-center mb-12">
                <Eyebrow>{t("buyEyebrow")}</Eyebrow>
                <h2
                  className="font-bold"
                  style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--color-text)" }}
                >
                  {t("buyTitle")}
                </h2>
                <p style={{ fontSize: 15, color: "var(--color-dim)", marginTop: 8 }}>
                  {t("buySubtitle")}
                </p>
              </div>

              {!PAYMENT_ENABLED && (
                <div
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderLeft: "4px solid var(--color-accent)",
                    borderRadius: 12,
                    padding: "16px 20px",
                    marginBottom: 28,
                    textAlign: "left",
                  }}
                >
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                    {t("paymentPrepTitle")}
                  </p>
                  <p style={{ fontSize: 14, color: "var(--color-dim)", margin: "8px 0 0", lineHeight: 1.6 }}>
                    {t("paymentPrepBefore")}{" "}
                    <a href="mailto:hello@getitdonework.com" style={{ color: "var(--color-accent)" }}>
                      hello@getitdonework.com
                    </a>
                    {t("paymentPrepAfter")}
                  </p>
                </div>
              )}

              {checkoutError && (
                <div
                  style={{
                    background: "oklch(0.25 0.08 15)",
                    border: "1px solid oklch(0.40 0.15 15)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    color: "oklch(0.80 0.18 15)",
                    fontSize: 14,
                    marginBottom: 24,
                    textAlign: "center",
                  }}
                >
                  {checkoutError}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-4 sm:grid-cols-2">
                {packages.map((pkg, idx) => {
                  const isPopular = idx === 1;
                  const isLoading = loadingId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      style={{
                        background: "var(--color-card)",
                        border: `1.5px solid ${isPopular ? "var(--color-accent)" : "var(--color-border)"}`,
                        borderRadius: 20,
                        padding: 28,
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {isPopular && (
                        <div
                          style={{
                            position: "absolute",
                            top: -13,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "var(--color-accent)",
                            color: "var(--color-dark)",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 20,
                            padding: "3px 12px",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {t("badgePopular")}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--color-text)",
                          marginBottom: 12,
                        }}
                      >
                        {pkg.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 36,
                          fontWeight: 700,
                          color: "var(--color-accent)",
                          lineHeight: 1.1,
                          marginBottom: 4,
                        }}
                      >
                        {pkg.credits.toLocaleString()}
                        <span style={{ fontSize: 18, fontWeight: 500 }}> C</span>
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "var(--color-text)",
                          marginBottom: 20,
                        }}
                      >
                        {t("priceKrw", { amount: pkg.price_krw.toLocaleString() })}
                      </div>
                      <div style={{ flex: 1 }} />
                      <button
                        onClick={() => handlePurchase(pkg)}
                        disabled={isLoading || !PAYMENT_ENABLED}
                        style={{
                          width: "100%",
                          padding: "10px 0",
                          background: isPopular
                            ? "var(--color-accent)"
                            : "transparent",
                          color: isPopular
                            ? "var(--color-dark)"
                            : "var(--color-accent)",
                          border: isPopular
                            ? "none"
                            : "1.5px solid var(--color-accent)",
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: isLoading || !PAYMENT_ENABLED ? "not-allowed" : "pointer",
                          opacity: isLoading || !PAYMENT_ENABLED ? 0.6 : 1,
                          transition: "opacity 0.15s",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {!PAYMENT_ENABLED
                          ? t("btnPaymentPrep")
                          : isLoading
                          ? t("btnProcessing")
                          : !isLoggedIn
                          ? t("btnLoginToBuy")
                          : t("btnBuy")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Session Types */}
        <section className="px-6 pb-24">
          <div className="mx-auto" style={{ maxWidth: 900 }}>
            <div className="text-center mb-12">
              <Eyebrow>{t("sessionEyebrow")}</Eyebrow>
              <h2
                className="font-bold"
                style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--color-text)" }}
              >
                {t("sessionTitle")}
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {sessionTypes.map((session) => (
                <div
                  key={session.name}
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: 28,
                    position: "relative",
                  }}
                >
                  {session.badgeKey && (
                    <div
                      className="absolute top-5 right-5"
                      style={{
                        background: "var(--color-blue)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        padding: "2px 8px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {t(session.badgeKey)}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: session.color,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    {session.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 40,
                      fontWeight: 700,
                      color: "var(--color-text)",
                      lineHeight: 1.1,
                      marginBottom: 4,
                    }}
                  >
                    {t(session.priceKey)}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-dim)", marginBottom: 24 }}>
                    {t(session.priceDetailKey)}
                  </div>
                  <ul className="flex flex-col gap-2">
                    {session.featureKeys.map((featKey) => (
                      <li
                        key={featKey}
                        className="flex items-start gap-2"
                        style={{ fontSize: 14, color: "var(--color-dim)" }}
                      >
                        <span style={{ color: session.color, marginTop: 1, flexShrink: 0, fontSize: 13 }}>
                          ✓
                        </span>
                        {t(featKey)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* B2B Packages */}
        <section className="px-6 pb-24">
          <div
            className="mx-auto"
            style={{
              maxWidth: 900,
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 20,
              padding: "48px 32px",
            }}
          >
            <div className="text-center mb-12">
              <Eyebrow>{t("b2bEyebrow")}</Eyebrow>
              <h2
                className="font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  color: "var(--color-text)",
                  marginBottom: 8,
                }}
              >
                {t("b2bTitle")}
              </h2>
              <p style={{ fontSize: 15, color: "var(--color-dim)" }}>
                {t("b2bSubtitle")}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {b2bPackages.map((pkg) => (
                <div
                  key={pkg.name}
                  style={{
                    background: "var(--color-dark)",
                    border: `1.5px solid ${pkg.recommended ? "var(--color-accent)" : "var(--color-border)"}`,
                    borderRadius: 16,
                    padding: 28,
                    position: "relative",
                  }}
                >
                  {pkg.recommended && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                      style={{
                        background: "var(--color-accent)",
                        color: "var(--color-dark)",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 20,
                        padding: "3px 12px",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {t("badgeRecommended")}
                    </div>
                  )}
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
                    {pkg.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      marginBottom: 4,
                    }}
                  >
                    {t(pkg.creditsKey)}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.3 }}>
                    {"priceUSDKey" in pkg && pkg.priceUSDKey ? t(pkg.priceUSDKey) : pkg.priceUSD}
                  </div>
                  {pkg.priceKRW && (
                    <div style={{ fontSize: 13, color: "var(--color-dim)", marginBottom: 16 }}>
                      {pkg.priceKRW}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--color-dim)",
                      marginTop: pkg.priceKRW ? 0 : 16,
                      paddingTop: 16,
                      borderTop: "1px solid var(--color-border)",
                    }}
                  >
                    {t(pkg.targetKey)}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <a href="/contact" className="landing-btn-primary">
                {t("b2bContactCta")}
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
