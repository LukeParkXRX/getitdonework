import Link from "next/link";
import { getTranslations } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-static";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4 uppercase tracking-widest font-bold" style={{ fontSize: 11, color: "var(--color-accent)" }}>
      <span style={{ width: 24, height: 2, background: "var(--color-accent)", display: "inline-block" }} />
      {children}
    </div>
  );
}

const faqCategories = [
  {
    labelKey: "catGeneralLabel",
    marginTop: 0,
    items: [
      { qKey: "q1Q", aKey: "q1A" },
      { qKey: "q2Q", aKey: "q2A" },
      { qKey: "q3Q", aKey: "q3A" },
      { qKey: "q4Q", aKey: "q4A" },
    ],
  },
  {
    labelKey: "catMatchingLabel",
    marginTop: 40,
    items: [
      { qKey: "q5Q", aKey: "q5A" },
      { qKey: "q6Q", aKey: "q6A" },
      { qKey: "q7Q", aKey: "q7A" },
      { qKey: "q8Q", aKey: "q8A" },
      { qKey: "q9Q", aKey: "q9A" },
    ],
  },
  {
    labelKey: "catPaymentLabel",
    marginTop: 40,
    items: [
      { qKey: "q10Q", aKey: "q10A" },
      { qKey: "q11Q", aKey: "q11A" },
      { qKey: "q12Q", aKey: "q12A" },
    ],
  },
  {
    labelKey: "catEnablerLabel",
    marginTop: 40,
    items: [
      { qKey: "q13Q", aKey: "q13A" },
      { qKey: "q14Q", aKey: "q14A" },
      { qKey: "q15Q", aKey: "q15A" },
    ],
  },
  {
    labelKey: "catAccountLabel",
    marginTop: 40,
    items: [
      { qKey: "q16Q", aKey: "q16A" },
      { qKey: "q17Q", aKey: "q17A" },
    ],
  },
];

export default async function FAQPage() {
  const t = await getTranslations("Faq");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap(({ items }) =>
      items.map(({ qKey, aKey }) => ({
        "@type": "Question",
        name: t(qKey),
        acceptedAnswer: { "@type": "Answer", text: t(aKey) },
      }))
    ),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <main>
        {/* Hero */}
        <section style={{ padding: "80px 24px 48px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 6vw, 56px)",
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: 20,
                color: "var(--color-text)",
              }}
            >
              {t("title")}
            </h1>
            <p style={{ fontSize: 17, color: "var(--color-dim)", lineHeight: 1.7 }}>
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section style={{ padding: "0 24px 80px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            {faqCategories.map((category) => (
              <div key={category.labelKey} style={{ marginTop: category.marginTop }}>
                {/* Category Header */}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    borderBottom: "1px solid rgba(200,255,0,0.2)",
                    paddingBottom: 8,
                    marginBottom: 16,
                  }}
                >
                  {t(category.labelKey)}
                </div>

                {/* FAQ Items */}
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      padding: "24px 0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--color-text)",
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ color: "var(--color-accent)", fontWeight: 700, flexShrink: 0 }}>Q.</span>
                      <span>{t(item.qKey)}</span>
                    </div>
                    <p
                      className="pl-4 md:pl-8"
                      style={{
                        fontSize: 15,
                        color: "var(--color-dim)",
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {t(item.aKey)}
                    </p>
                  </div>
                ))}
              </div>
            ))}

            {/* CTA Card */}
            <div
              style={{
                marginTop: 48,
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 20,
                textAlign: "center",
                padding: 32,
              }}
            >
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>
                {t("ctaTitle")}
              </p>
              <p style={{ fontSize: 14, color: "var(--color-dim)", margin: "0 0 24px" }}>
                {t("ctaSubtitle")}
              </p>
              <Link href="/contact" className="landing-btn-primary">
                {t("ctaButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
