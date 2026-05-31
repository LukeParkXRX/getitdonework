"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import type { Article, Section } from "../articles-data";
import { ALL_ARTICLES } from "../articles-data";

// ─── Section Renderer ──────────────────────────────────────────────────────────

function RenderSection({ section }: { section: Section }) {
  switch (section.type) {
    case "h2":
      return (
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(20px, 2.4vw, 26px)",
            color: "var(--color-text)",
            lineHeight: 1.3,
            marginTop: "48px",
            marginBottom: "16px",
            letterSpacing: "-0.02em",
          }}
        >
          {section.text}
        </h2>
      );

    case "h3":
      return (
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(17px, 2vw, 21px)",
            color: "var(--color-text)",
            lineHeight: 1.35,
            marginTop: "36px",
            marginBottom: "12px",
          }}
        >
          {section.text}
        </h3>
      );

    case "p":
      return (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(16px, 1.8vw, 18px)",
            lineHeight: 1.85,
            color: "var(--color-text)",
            marginBottom: "20px",
            wordBreak: "keep-all",
          }}
        >
          {section.text}
        </p>
      );

    case "ul":
      return (
        <ul
          style={{
            paddingLeft: "20px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {section.items.map((item, i) => (
            <li
              key={i}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(15px, 1.7vw, 17px)",
                lineHeight: 1.75,
                color: "var(--color-text)",
                wordBreak: "keep-all",
                listStyleType: "disc",
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol
          style={{
            paddingLeft: "22px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {section.items.map((item, i) => (
            <li
              key={i}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(15px, 1.7vw, 17px)",
                lineHeight: 1.75,
                color: "var(--color-text)",
                wordBreak: "keep-all",
                listStyleType: "decimal",
              }}
            >
              {item}
            </li>
          ))}
        </ol>
      );

    case "blockquote":
      return (
        <blockquote
          style={{
            borderLeft: "4px solid var(--color-accent)",
            paddingLeft: "24px",
            margin: "32px 0",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(16px, 1.9vw, 19px)",
              lineHeight: 1.7,
              color: "var(--color-text)",
              fontStyle: "italic",
              fontWeight: 500,
              marginBottom: section.attribution ? "8px" : "0",
              wordBreak: "keep-all",
            }}
          >
            &ldquo;{section.text}&rdquo;
          </p>
          {section.attribution && (
            <cite
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--color-dim)",
                fontStyle: "normal",
              }}
            >
              — {section.attribution}
            </cite>
          )}
        </blockquote>
      );

    case "stat":
      return (
        <div
          style={{
            margin: "32px 0",
            padding: "24px 28px",
            borderRadius: "16px",
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 44px)",
              fontWeight: 800,
              color: "var(--color-accent)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {section.value}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            {section.label}
          </div>
          {section.hint && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--color-dim)",
              }}
            >
              {section.hint}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function InsightDetailClient({ article }: { article: Article }) {
  const t = useTranslations("InsightDetail");
  const tIns = useTranslations("Insights");
  const locale = useLocale();

  // Related articles: same category, different id, max 3
  const related = ALL_ARTICLES.filter(
    (a) => a.category === article.category && a.id !== article.id
  ).slice(0, 3);

  // 본문은 한국어 콘텐츠 → EN 로케일에는 노출하지 않고 안내 + 전환 링크만 제공
  if (locale !== "ko") {
    return (
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "120px 24px 80px", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            fontWeight: 800,
            color: "var(--color-text)",
            marginBottom: "12px",
            lineHeight: 1.25,
          }}
        >
          {tIns("koOnlyTitle")}
        </h1>
        <p style={{ fontSize: "15px", color: "var(--color-dim)", lineHeight: 1.7, marginBottom: "28px" }}>
          {tIns("koOnlyDesc")}
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("__locale_manual", "true");
            document.cookie = `NEXT_LOCALE=ko; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
            window.location.reload();
          }}
          style={{
            padding: "12px 24px",
            borderRadius: "10px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "14px",
            backgroundColor: "var(--color-accent)",
            color: "oklch(0.1 0 0)",
            border: "none",
            cursor: "pointer",
          }}
        >
          {tIns("viewInKorean")}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
      }}
    >
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(160deg, ${article.gradientFrom}, ${article.gradientTo})`,
          borderBottom: "1px solid var(--color-border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(oklch(0.91 0.2 110 / 0.05) 1px, transparent 1px), linear-gradient(90deg, oklch(0.91 0.2 110 / 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />

        {/* Ghost text decoration */}
        <div
          style={{
            position: "absolute",
            right: "-20px",
            bottom: "-20px",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(80px, 14vw, 160px)",
            fontWeight: 900,
            color: "oklch(0.91 0.2 110 / 0.04)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {article.tags[0] ?? "INSIGHT"}
        </div>

        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "clamp(48px, 8vw, 80px) 24px clamp(40px, 6vw, 64px)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Back link */}
          <Link
            href="/insights"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: "var(--color-dim)",
              textDecoration: "none",
              marginBottom: "28px",
              letterSpacing: "0.02em",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--color-accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--color-dim)";
            }}
          >
            ← {t("backToList")}
          </Link>

          {/* Category + tags */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                padding: "3px 12px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                backgroundColor: "oklch(0.91 0.2 110 / 0.15)",
                color: "var(--color-accent)",
                border: "1px solid oklch(0.91 0.2 110 / 0.25)",
              }}
            >
              {article.category}
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-dim)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(24px, 3.5vw, 40px)",
              lineHeight: 1.25,
              color: "var(--color-text)",
              letterSpacing: "-0.02em",
              marginBottom: "20px",
              wordBreak: "keep-all",
            }}
          >
            {article.title}
          </h1>

          {/* Excerpt */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(15px, 1.8vw, 18px)",
              lineHeight: 1.7,
              color: "var(--color-dim)",
              marginBottom: "32px",
              wordBreak: "keep-all",
              maxWidth: "660px",
            }}
          >
            {article.excerpt}
          </p>

          {/* Author + meta row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              paddingTop: "24px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={48}
                height={48}
                className="rounded-full object-cover"
                style={{ border: "2px solid var(--color-border)", flexShrink: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "var(--color-text)",
                  }}
                >
                  {article.author.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--color-dim)",
                  }}
                >
                  {article.author.title}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "var(--color-dim)",
                fontFamily: "var(--font-body)",
              }}
            >
              <span>{article.date}</span>
              <span style={{ color: "var(--color-border)" }}>·</span>
              <span>{t("readTime", { minutes: article.readTime })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "clamp(32px, 6vw, 64px) 24px",
        }}
      >
        {/* TL;DR */}
        {article.tldr && article.tldr.length > 0 && (
          <div
            style={{
              marginBottom: "48px",
              padding: "24px 28px",
              borderRadius: "16px",
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderLeft: "4px solid var(--color-accent)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--color-accent)",
                }}
              >
                TL;DR
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--color-dim)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {t("tldrLabel")}
              </span>
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "0", listStyle: "none", margin: 0 }}>
              {article.tldr.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                    lineHeight: 1.65,
                    color: "var(--color-text)",
                    wordBreak: "keep-all",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: "4px",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-accent)",
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article body */}
        <div>
          {article.body.map((section, i) => (
            <RenderSection key={i} section={section} />
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            backgroundColor: "var(--color-border)",
            margin: "56px 0 48px",
          }}
        />

        {/* Author bio card */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "20px",
            padding: "28px",
            borderRadius: "16px",
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            marginBottom: "48px",
            flexWrap: "wrap",
          }}
        >
          <Image
            src={article.author.avatar}
            alt={article.author.name}
            width={72}
            height={72}
            priority
            className="rounded-full object-cover"
            style={{ border: "2px solid var(--color-border)", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "17px",
                color: "var(--color-text)",
                marginBottom: "4px",
              }}
            >
              {article.author.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--color-accent)",
                fontWeight: 600,
                marginBottom: "10px",
              }}
            >
              {article.author.title}
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                lineHeight: 1.65,
                color: "var(--color-dim)",
                wordBreak: "keep-all",
              }}
            >
              {t("authorBio")}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            padding: "40px",
            borderRadius: "20px",
            background: `linear-gradient(135deg, ${article.gradientFrom}, ${article.gradientTo})`,
            border: "1px solid var(--color-border)",
            textAlign: "center",
            marginBottom: "56px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(oklch(0.91 0.2 110 / 0.05) 1px, transparent 1px), linear-gradient(90deg, oklch(0.91 0.2 110 / 0.05) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(18px, 2.5vw, 24px)",
                color: "var(--color-text)",
                marginBottom: "10px",
                letterSpacing: "-0.01em",
              }}
            >
              {t("ctaTitle")}
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                color: "var(--color-dim)",
                marginBottom: "24px",
                wordBreak: "keep-all",
              }}
            >
              {t("ctaDescription", { name: article.author.name })}
            </p>
            <Link
              href="/enablers"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 28px",
                borderRadius: "12px",
                backgroundColor: "var(--color-accent)",
                color: "oklch(0.1 0 0)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                boxShadow: "var(--shadow-accent)",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
              }}
            >
              {t("ctaButton")} →
            </Link>
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--color-dim)",
                }}
              >
                {t("relatedArticles")}
              </span>
              <div
                style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/insights/${rel.id}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    padding: "20px",
                    borderRadius: "14px",
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    textDecoration: "none",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "var(--color-accent)";
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "var(--color-border)";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  {/* Thumbnail gradient */}
                  <div
                    style={{
                      height: "80px",
                      borderRadius: "8px",
                      background: `linear-gradient(135deg, ${rel.gradientFrom}, ${rel.gradientTo})`,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "14px",
                      lineHeight: 1.4,
                      color: "var(--color-text)",
                      wordBreak: "keep-all",
                    }}
                  >
                    {rel.title}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-dim)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {t("readTime", { minutes: rel.readTime })}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to list */}
        <div
          style={{
            marginTop: "56px",
            paddingTop: "32px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <Link
            href="/insights"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: "var(--color-dim)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--color-accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--color-dim)";
            }}
          >
            ← {t("backToListLong")}
          </Link>
        </div>
      </div>
    </div>
  );
}
