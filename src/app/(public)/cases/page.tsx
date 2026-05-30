import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-static";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4 uppercase tracking-widest font-bold" style={{ fontSize: 11, color: "var(--color-accent)" }}>
      <span style={{ width: 24, height: 2, background: "var(--color-accent)", display: "inline-block" }} />
      {children}
    </div>
  );
}

const cases = [
  {
    id: 1,
    iconLetter: "N",
    iconBg: "var(--color-blue)",
    companyKey: "case1Company",
    subtitleKey: "case1Subtitle",
    tag: "Fintech",
    tagColor: "var(--color-blue)",
    quoteKey: "case1Quote",
    metrics: [
      { valueKey: "case1Metric1Value", labelKey: "case1Metric1Label" },
      { valueKey: "case1Metric2Value", labelKey: "case1Metric2Label" },
      { valueKey: "case1Metric3Value", labelKey: "case1Metric3Label" },
    ],
    enablerInitials: "JP",
    enablerInitialsBg: "var(--color-amber)",
    enablerName: "James Park",
    enablerDesc: "Wharton · IR Strategy",
    rating: "5.0",
  },
  {
    id: 2,
    iconLetter: "A",
    iconBg: "var(--color-accent)",
    companyKey: "case2Company",
    subtitleKey: "case2Subtitle",
    tag: "AI/Tech",
    tagColor: "var(--color-accent)",
    quoteKey: "case2Quote",
    metrics: [
      { valueKey: "case2Metric1Value", labelKey: "case2Metric1Label" },
      { valueKey: "case2Metric2Value", labelKey: "case2Metric2Label" },
      { valueKey: "case2Metric3Value", labelKey: "case2Metric3Label" },
    ],
    enablerInitials: "DK",
    enablerInitialsBg: "var(--color-blue)",
    enablerName: "David Kim",
    enablerDesc: "MIT Sloan · AI Strategy",
    rating: "5.0",
  },
  {
    id: 3,
    iconLetter: "G",
    iconBg: "var(--color-green)",
    companyKey: "case3Company",
    subtitleKey: "case3Subtitle",
    tag: "CleanTech",
    tagColor: "var(--color-green)",
    quoteKey: "case3Quote",
    metrics: [
      { valueKey: "case3Metric1Value", labelKey: "case3Metric1Label" },
      { valueKey: "case3Metric2Value", labelKey: "case3Metric2Label" },
      { valueKey: "case3Metric3Value", labelKey: "case3Metric3Label" },
    ],
    enablerInitials: "ER",
    enablerInitialsBg: "var(--color-amber)",
    enablerName: "Emily Rodriguez",
    enablerDesc: "HBS · Market Research",
    rating: "4.7",
  },
] as const;

const testimonials = [
  { textKey: "testimonial1Text", authorKey: "testimonial1Author" },
  { textKey: "testimonial2Text", authorKey: "testimonial2Author" },
  { textKey: "testimonial3Text", authorKey: "testimonial3Author" },
] as const;

export default async function CasesPage() {
  const t = await getTranslations("Cases");
  return (
    <>
      <main>
        {/* Hero */}
        <section
          className="text-center"
          style={{ padding: "80px 24px 60px", background: "var(--color-dark)" }}
        >
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <Eyebrow>{t("heroEyebrow")}</Eyebrow>
            <h1
              className="font-bold leading-tight"
              style={{ fontSize: "clamp(32px, 5vw, 48px)", color: "var(--color-text)", marginBottom: 20 }}
            >
              {t("heroTitleBefore")}{" "}
              <span style={{ color: "var(--color-accent)" }}>{t("heroTitleHighlight")}</span>{" "}
              {t("heroTitleAfter")}
            </h1>
            <p style={{ fontSize: 17, color: "var(--color-dim)", lineHeight: 1.7 }}>
              {t("heroSubtitle")}
            </p>
          </div>
        </section>

        {/* Case Cards */}
        <section style={{ padding: "60px 24px", background: "var(--color-dark)" }}>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            style={{ maxWidth: 1080, margin: "0 auto" }}
          >
            {cases.map((c) => (
              <article
                key={c.id}
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                {/* Card Header */}
                <div style={{ padding: "28px 28px 0" }}>
                  {/* Icon + Company + Tag row */}
                  <div
                    className="flex items-start justify-between"
                    style={{ marginBottom: 20 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center font-bold"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: c.iconBg,
                          color: "#fff",
                          fontSize: 18,
                          fontFamily: "var(--font-display)",
                          flexShrink: 0,
                        }}
                      >
                        {c.iconLetter}
                      </div>
                      <div>
                        <div
                          className="font-bold"
                          style={{ fontSize: 15, color: "var(--color-text)" }}
                        >
                          {t(c.companyKey)}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-dim)", marginTop: 2 }}>
                          {t(c.subtitleKey)}
                        </div>
                      </div>
                    </div>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 99,
                        background: `color-mix(in srgb, ${c.tagColor} 15%, transparent)`,
                        color: c.tagColor,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {c.tag}
                    </span>
                  </div>

                  {/* Quote */}
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-dim)",
                      lineHeight: 1.7,
                      paddingBottom: 20,
                    }}
                  >
                    &ldquo;{t(c.quoteKey)}&rdquo;
                  </p>
                </div>

                {/* Card Body */}
                <div style={{ padding: "20px 28px 28px" }}>
                  {/* Metrics row */}
                  <div
                    className="flex"
                    style={{
                      borderTop: "1px solid var(--color-border)",
                      borderBottom: "1px solid var(--color-border)",
                      padding: "16px 0",
                      marginBottom: 20,
                      gap: 0,
                    }}
                  >
                    {c.metrics.map((m, i) => (
                      <div
                        key={i}
                        className="flex-1 text-center"
                        style={{
                          borderRight: i < c.metrics.length - 1 ? "1px solid var(--color-border)" : "none",
                        }}
                      >
                        <div
                          className="font-bold"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 28,
                            color: "var(--color-accent)",
                            lineHeight: 1,
                          }}
                        >
                          {t(m.valueKey)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-dim)", marginTop: 4 }}>
                          {t(m.labelKey)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Enabler row */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center font-bold"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 99,
                        background: c.enablerInitialsBg,
                        color: "#fff",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {c.enablerInitials}
                    </div>
                    <div className="flex-1">
                      <div
                        className="font-bold"
                        style={{ fontSize: 13, color: "var(--color-text)" }}
                      >
                        {c.enablerName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-dim)", marginTop: 1 }}>
                        {c.enablerDesc}
                      </div>
                    </div>
                    <div
                      className="font-bold"
                      style={{ fontSize: 13, color: "var(--color-amber)" }}
                    >
                      ★ {c.rating}
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {/* Placeholder CTA card */}
            <article
              className="flex flex-col items-center justify-center text-center"
              style={{
                border: "2px dashed var(--color-border)",
                borderRadius: 20,
                padding: "60px 40px",
                gap: 20,
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 99,
                  border: "2px dashed var(--color-border)",
                  color: "var(--color-dim)",
                  fontSize: 28,
                  lineHeight: 1,
                }}
              >
                +
              </div>
              <p
                className="font-bold"
                style={{ fontSize: 15, color: "var(--color-dim)", lineHeight: 1.6 }}
              >
                {t("ctaCardLine1")}<br />{t("ctaCardLine2")}
              </p>
              <Link
                href="/matching"
                className="font-bold"
                style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  borderRadius: 99,
                  background: "var(--color-accent)",
                  color: "#fff",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                {t("ctaButton")}
              </Link>
            </article>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: "60px 24px 80px", background: "var(--color-dark)" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 20,
                padding: 40,
              }}
            >
              <div
                className="uppercase font-bold tracking-widest"
                style={{ fontSize: 11, color: "var(--color-dim)", marginBottom: 32 }}
              >
                {t("testimonialsTitle")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((item, i) => (
                  <div key={i}>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--color-text)",
                        lineHeight: 1.75,
                        marginBottom: 16,
                      }}
                    >
                      &ldquo;{t(item.textKey)}&rdquo;
                    </p>
                    <p
                      className="font-bold"
                      style={{ fontSize: 12, color: "var(--color-dim)" }}
                    >
                      — {t(item.authorKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
