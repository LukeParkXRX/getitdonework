"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4 uppercase tracking-widest font-bold" style={{ fontSize: 11, color: "var(--color-accent)" }}>
      <span style={{ width: 24, height: 2, background: "var(--color-accent)", display: "inline-block" }} />
      {children}
    </div>
  );
}

const cultureCards = [
  {
    icon: "⚡",
    titleKey: "cultureFastTitle",
    descKey: "cultureFastDesc",
  },
  {
    icon: "🌏",
    titleKey: "cultureRemoteTitle",
    descKey: "cultureRemoteDesc",
  },
  {
    icon: "🎯",
    titleKey: "cultureImpactTitle",
    descKey: "cultureImpactDesc",
  },
] as const;

const jobs = [
  {
    title: "Founding Engineer (Full-stack)",
    tagKey: "tagOpen",
    tagType: "accent" as const,
    subtitleKey: "jobEngineerSubtitle",
    dept: "Engineering",
    opacity: 1,
    descKey: "jobEngineerDesc",
    mailto: "mailto:contact@getitdonework.com?subject=Application:Founding Engineer",
  },
  {
    title: "Growth Marketer (Korea + US)",
    tagKey: "tagOpen",
    tagType: "accent" as const,
    subtitleKey: "jobGrowthSubtitle",
    dept: "Growth",
    opacity: 1,
    descKey: "jobGrowthDesc",
    mailto: "mailto:contact@getitdonework.com?subject=Application:Growth Marketer",
  },
  {
    title: "Enabler Success Manager",
    tagKey: "tagOpen",
    tagType: "accent" as const,
    subtitleKey: "jobEnablerSubtitle",
    dept: "Partnership",
    opacity: 1,
    descKey: "jobEnablerDesc",
    mailto: "mailto:contact@getitdonework.com?subject=Application:Enabler Success Manager",
  },
  {
    title: "Product Designer",
    tagKey: "tagUpcoming",
    tagType: "muted" as const,
    subtitleKey: "jobDesignerSubtitle",
    dept: "Design",
    opacity: 1,
    descKey: "jobDesignerDesc",
    mailto: "mailto:contact@getitdonework.com?subject=Application:Product Designer",
  },
  {
    titleKey: "jobSalesTitle",
    tagKey: "tagUpcoming",
    tagType: "muted" as const,
    subtitleKey: "jobSalesSubtitle",
    dept: "Sales",
    opacity: 0.6,
    descKey: "jobSalesDesc",
    mailto: "mailto:contact@getitdonework.com?subject=Application:B2B Sales",
  },
] as const;

export default function CareersPage() {
  const t = useTranslations("Careers");
  return (
    <>
      <main>
        {/* Hero */}
        <section style={{ padding: "80px 0 56px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>{t("heroEyebrow")}</Eyebrow>
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
              {t("heroTitlePrefix")}{" "}
              <span style={{ color: "var(--color-accent)" }}>{t("heroTitleAccent")}</span>{" "}
              {t("heroTitleSuffix")}
            </h1>
            <p style={{ fontSize: 17, color: "var(--color-dim)", maxWidth: 560, lineHeight: 1.7 }}>
              {t("heroSubtitle")}
            </p>
          </div>
        </section>

        {/* Culture */}
        <section
          style={{
            background: "var(--color-dark)",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
            padding: "56px 0",
          }}
        >
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>{t("cultureEyebrow")}</Eyebrow>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              {cultureCards.map((card) => (
                <div
                  key={card.titleKey}
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: 28,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "var(--color-accent-dim)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      marginBottom: 16,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
                    {t(card.titleKey)}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.6 }}>
                    {t(card.descKey)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Job List */}
        <section style={{ padding: "80px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>{t("positionsEyebrow")}</Eyebrow>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--color-text)",
                marginBottom: 32,
              }}
            >
              {t("positionsHeading")}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {jobs.map((job) => (
                <div
                  key={"titleKey" in job ? job.titleKey : job.title}
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 14,
                    padding: "24px 24px",
                    opacity: job.opacity,
                    transition: "border-color 0.2s, background 0.2s",
                    minWidth: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (job.opacity >= 0.9) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(200,255,0,0.3)";
                      (e.currentTarget as HTMLDivElement).style.background = "var(--color-card-hover, oklch(0.18 0.006 280))";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
                    (e.currentTarget as HTMLDivElement).style.background = "var(--color-card)";
                  }}
                >
                  {/* 상단 행 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
                          {"titleKey" in job ? t(job.titleKey) : job.title}
                        </span>
                        <span
                          style={
                            job.tagType === "accent"
                              ? {
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  background: "var(--color-accent-dim)",
                                  color: "var(--color-accent)",
                                  border: "1px solid rgba(200,255,0,0.2)",
                                }
                              : {
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  background: "rgba(255,255,255,0.05)",
                                  color: "var(--color-dim)",
                                  border: "1px solid var(--color-border)",
                                }
                          }
                        >
                          {t(job.tagKey)}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--color-dim)" }}>{job.dept}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--color-dim)" }}>{t(job.subtitleKey)}</div>
                    </div>

                    {job.tagType === "accent" && (
                      <Link
                        href={job.mailto}
                        style={{
                          flexShrink: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 18px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "var(--font-display)",
                          backgroundColor: "var(--color-accent)",
                          color: "oklch(0.1 0 0)",
                          textDecoration: "none",
                        }}
                      >
                        {t("applyButton")}
                      </Link>
                    )}
                  </div>

                  {/* 설명 */}
                  {job.descKey && (
                    <p style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.7, marginTop: 14, marginBottom: 0 }}>
                      {t(job.descKey)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Open Application CTA */}
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between"
              style={{
                marginTop: 40,
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 20,
                padding: 32,
                gap: 24,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
                  {t("openAppTitle")}
                </div>
                <div style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.6 }}>
                  {t("openAppDesc")}
                </div>
              </div>
              <Link
                href="mailto:careers@getitdonework.com"
                className="landing-btn-ghost"
                style={{ flexShrink: 0, whiteSpace: "nowrap" }}
              >
                {t("openAppButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
