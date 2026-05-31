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

        {/* Coming Soon */}
        <section style={{ padding: "80px 24px 120px", background: "var(--color-dark)" }}>
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ maxWidth: 480, margin: "0 auto", gap: 20 }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 99,
                border: "2px dashed var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-dim)",
                fontSize: 28,
              }}
            >
              ✦
            </div>
            <p
              className="font-bold"
              style={{ fontSize: 20, color: "var(--color-text)", lineHeight: 1.5 }}
            >
              {t("comingSoonTitle")}
            </p>
            <p style={{ fontSize: 15, color: "var(--color-dim)", lineHeight: 1.7 }}>
              {t("comingSoonDesc")}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
