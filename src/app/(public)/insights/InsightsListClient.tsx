"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FEATURED_ARTICLE,
  ARTICLES,
  CATEGORIES,
  type Article,
  type Category,
} from "./articles-data";

// ─── Sub-Components ───────────────────────────────────────────────────────────

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: Category;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: active ? "var(--color-accent)" : "var(--color-card)",
        color: active ? "oklch(0.1 0 0)" : "var(--color-dim)",
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
        fontFamily: "var(--font-display)",
        letterSpacing: "0.01em",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-dim)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
        }
      }}
    >
      {label}
    </button>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: "var(--color-accent-dim)",
        color: "var(--color-accent)",
        border: "1px solid oklch(0.91 0.2 110 / 0.2)",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </span>
  );
}

function ReadTimeBadge({ minutes }: { minutes: number }) {
  return (
    <span
      className="text-xs"
      style={{ color: "var(--color-dim)", fontFamily: "var(--font-body)" }}
    >
      {minutes}분 읽기
    </span>
  );
}

// ─── Featured Article Card ─────────────────────────────────────────────────────

function FeaturedCard({ article }: { article: Article }) {
  return (
    <article
      className="group relative rounded-2xl overflow-hidden"
      style={{
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      {/* Accent glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 0 1px oklch(0.91 0.2 110 / 0.25)",
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[5fr_4fr]">
        {/* Left: Image placeholder */}
        <div
          className="relative min-h-[260px] lg:min-h-[360px] overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${article.gradientFrom}, ${article.gradientTo})`,
          }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.91 0.2 110 / 0.06) 1px, transparent 1px), linear-gradient(90deg, oklch(0.91 0.2 110 / 0.06) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Large ghost text decoration */}
          <div
            className="absolute -bottom-4 -left-3 text-[120px] font-black leading-none select-none pointer-events-none"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.91 0.2 110 / 0.07)",
              letterSpacing: "-0.05em",
            }}
          >
            GTM
          </div>

          {/* Category label floating */}
          <div className="absolute top-6 left-6">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{
                backgroundColor: "oklch(0.91 0.2 110 / 0.15)",
                color: "var(--color-accent)",
                border: "1px solid oklch(0.91 0.2 110 / 0.25)",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.1em",
              }}
            >
              {article.category}
            </span>
          </div>

          {/* Featured label */}
          <div className="absolute top-6 right-6 flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "var(--color-accent)" }}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--color-accent)", fontFamily: "var(--font-display)" }}
            >
              Featured
            </span>
          </div>

          {/* Bottom accent line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, oklch(0.91 0.2 110 / 0.3), transparent)",
            }}
          />
        </div>

        {/* Right: Content */}
        <div className="flex flex-col justify-between p-8 lg:p-10">
          <div className="flex flex-col gap-5">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </div>

            {/* Title */}
            <h2
              className="leading-snug tracking-tight group-hover:text-accent transition-colors duration-200"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(18px, 2.2vw, 22px)",
                color: "var(--color-text)",
              }}
            >
              {article.title}
            </h2>

            {/* Excerpt */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-dim)", maxWidth: "420px" }}
            >
              {article.excerpt}
            </p>
          </div>

          {/* Bottom: Author + meta */}
          <div className="flex flex-col gap-6 mt-8">
            {/* Divider */}
            <div className="h-px" style={{ backgroundColor: "var(--color-border)" }} />

            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Author */}
              <div className="flex items-center gap-3">
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover shrink-0"
                  style={{ border: "2px solid var(--color-border)" }}
                />
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-lg font-semibold leading-none"
                    style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
                  >
                    {article.author.name}
                  </span>
                  <span
                    className="text-[11px] leading-none"
                    style={{ color: "var(--color-dim)" }}
                  >
                    {article.author.title}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "var(--color-dim)" }}>
                  {article.date}
                </span>
                <span style={{ color: "var(--color-border)" }}>·</span>
                <ReadTimeBadge minutes={article.readTime} />
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/insights/${article.id}`}
              className="group/btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 w-fit"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "oklch(0.1 0 0)",
                fontFamily: "var(--font-display)",
                boxShadow: "var(--shadow-accent)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
              }}
            >
              아티클 읽기
              <span className="transition-transform duration-200 group-hover/btn:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Article Grid Card ─────────────────────────────────────────────────────────

function ArticleCard({ article, index }: { article: Article; index: number }) {
  return (
    <Link
      href={`/insights/${article.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-accent)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-border)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
      }}
    >
      {/* Image area */}
      <div
        className="relative h-[160px] overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${article.gradientFrom}, ${article.gradientTo})`,
        }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.9 0 0 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.9 0 0 / 0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{
              backgroundColor: "oklch(0.1 0 0 / 0.45)",
              color: article.accentColor,
              border: `1px solid ${article.accentColor}33`,
              backdropFilter: "blur(8px)",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.1em",
            }}
          >
            {article.category}
          </span>
        </div>

        {/* Read time badge top-right */}
        <div
          className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: "oklch(0.1 0 0 / 0.45)",
            color: "var(--color-dim)",
            backdropFilter: "blur(8px)",
          }}
        >
          {article.readTime}분
        </div>

        {/* Accent accent-color line bottom */}
        <div
          className="absolute bottom-0 left-0 w-12 h-0.5 group-hover:w-full transition-all duration-500"
          style={{ backgroundColor: article.accentColor }}
        />
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 gap-3 p-5">
        {/* Title */}
        <h3
          className="transition-colors duration-200 group-hover:text-accent"
          style={{
            fontSize: "18px",
            fontWeight: 700,
            lineHeight: 1.35,
            color: "var(--color-text)",
            fontFamily: "var(--font-display)",
          }}
        >
          {article.title}
        </h3>

        {/* Excerpt */}
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.6,
            color: "var(--color-dim)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {article.excerpt}
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="h-px" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Author + meta row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              src={article.author.avatar}
              alt={article.author.name}
              width={48}
              height={48}
              className="rounded-full object-cover"
              style={{ flexShrink: 0, border: "1.5px solid var(--color-border)" }}
            />
            <span
              className="text-[17px] font-semibold truncate"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
            >
              {article.author.name}
            </span>
          </div>

          <span
            className="text-[11px] shrink-0"
            style={{ color: "var(--color-dim)" }}
          >
            {article.date.split(". ").slice(1).join(".")}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Insights List (Filter + Cards) ───────────────────────────────────────────

export default function InsightsListClient() {
  const [activeCategory, setActiveCategory] = useState<Category>("전체");

  const filteredArticles =
    activeCategory === "전체"
      ? ARTICLES
      : ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <>
      {/* Filter pills — inside hero area, passed via slot pattern */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "40px 24px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            width: "100%",
          }}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* ── DIVIDER LINE ────────────────────────────────────────────────── */}
      <div
        className="relative h-px max-w-7xl mx-auto px-6 mt-16"
        style={{ backgroundColor: "var(--color-border)" }}
      >
        <div
          className="absolute inset-y-0 left-6 w-32 h-px"
          style={{
            background: "linear-gradient(90deg, var(--color-accent), transparent)",
          }}
        />
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 24px" }}>
        {/* Featured Article — only shown when "전체" or matching category */}
        {(activeCategory === "전체" || activeCategory === FEATURED_ARTICLE.category) && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{
                  color: "var(--color-accent)",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.14em",
                }}
              >
                Editor's Pick
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
            </div>

            <FeaturedCard article={FEATURED_ARTICLE} />
          </div>
        )}

        {/* Article Grid */}
        {filteredArticles.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{
                  color: "var(--color-dim)",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.14em",
                }}
              >
                {activeCategory === "전체"
                  ? `모든 아티클 · ${ARTICLES.length}편`
                  : `${activeCategory} · ${filteredArticles.length}편`}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: "24px",
              }}
            >
              {filteredArticles.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <span style={{ color: "var(--color-dim)", fontSize: "20px" }}>✦</span>
            </div>
            <p
              className="w-full text-sm text-center"
              style={{ color: "var(--color-dim)", fontFamily: "var(--font-body)" }}
            >
              해당 카테고리의 아티클이 곧 업로드됩니다.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
