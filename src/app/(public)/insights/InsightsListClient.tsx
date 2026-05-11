"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "전체" | "SaaS" | "Fintech" | "AI/DeepTech" | "E-commerce" | "전략";

interface Author {
  name: string;
  title: string;
  avatar: string;
}

interface Article {
  id: number;
  title: string;
  excerpt: string;
  category: Category;
  tags: string[];
  readTime: number;
  date: string;
  author: Author;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  featured?: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const FEATURED_ARTICLE: Article = {
  id: 0,
  title: "미국 시장 진출, 첫 번째 고객을 만들기까지: GTM 전략의 모든 것",
  excerpt:
    "많은 한국 스타트업이 훌륭한 제품을 가지고도 미국 시장에서 첫 번째 고객을 확보하는 데 실패합니다. 문제는 제품이 아닙니다. GTM 전략의 부재입니다. Wharton MBA 출신 Market Enabler가 직접 경험한 실패와 성공 사례를 바탕으로, 한국 스타트업이 미국에서 첫 계약을 따내기까지의 실전 전략을 공유합니다.",
  category: "전략",
  tags: ["GTM", "미국진출", "영업전략"],
  readTime: 12,
  date: "2026. 03. 20",
  author: {
    name: "Sarah Chen",
    title: "Wharton MBA · GTM Strategy",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
  },
  gradientFrom: "oklch(0.22 0.04 280)",
  gradientTo: "oklch(0.14 0.02 280)",
  accentColor: "var(--color-accent)",
  featured: true,
};

const ARTICLES: Article[] = [
  {
    id: 1,
    title: "한국 SaaS 기업이 미국 시장에서 흔히 하는 5가지 실수",
    excerpt:
      "현지화 없는 가격 정책부터 잘못된 ICP 설정까지. 미국 B2B SaaS 시장에서 반복되는 치명적 실수들을 분석합니다.",
    category: "SaaS",
    tags: ["SaaS", "실수", "미국진출"],
    readTime: 8,
    date: "2026. 03. 18",
    author: {
      name: "Sarah Chen",
      title: "Wharton MBA · GTM Strategy",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.91 0.2 110 / 0.12)",
    gradientTo: "oklch(0.91 0.2 110 / 0.03)",
    accentColor: "var(--color-accent)",
  },
  {
    id: 2,
    title: "2026년 미국 핀테크 투자 트렌드와 한국 스타트업의 기회",
    excerpt:
      "금리 인하 사이클이 불러온 핀테크 르네상스. 임베디드 파이낸스와 B2B 결제 인프라 분야에서 한국 스타트업이 노릴 수 있는 틈새 시장을 분석합니다.",
    category: "Fintech",
    tags: ["Fintech", "투자트렌드", "2026"],
    readTime: 10,
    date: "2026. 03. 15",
    author: {
      name: "James Park",
      title: "Harvard MBA · Fintech & VC",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.65 0.15 250 / 0.15)",
    gradientTo: "oklch(0.65 0.15 250 / 0.03)",
    accentColor: "var(--color-blue)",
  },
  {
    id: 3,
    title: "AI 스타트업의 미국 시장 진출: 기술력만으로는 부족하다",
    excerpt:
      "세계 최고 수준의 AI 모델을 가지고도 미국 시장에서 외면받는 한국 AI 스타트업들. Enterprise AI 도입 의사결정자의 실제 구매 기준을 해부합니다.",
    category: "AI/DeepTech",
    tags: ["AI", "DeepTech", "Enterprise"],
    readTime: 9,
    date: "2026. 03. 12",
    author: {
      name: "David Kim",
      title: "Stanford MBA · AI & Enterprise",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.72 0.19 155 / 0.12)",
    gradientTo: "oklch(0.72 0.19 155 / 0.02)",
    accentColor: "var(--color-green)",
  },
  {
    id: 4,
    title: "미국 D2C 시장 진출을 위한 브랜딩 전략 가이드",
    excerpt:
      "아마존 의존에서 벗어나 독립 브랜드로 성장하는 법. 미국 소비자 심리와 퍼포먼스 마케팅을 결합한 D2C 진출 로드맵을 공유합니다.",
    category: "E-commerce",
    tags: ["D2C", "브랜딩", "E-commerce"],
    readTime: 7,
    date: "2026. 03. 10",
    author: {
      name: "Emily Rodriguez",
      title: "Kellogg MBA · Consumer & Brand",
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.78 0.15 75 / 0.13)",
    gradientTo: "oklch(0.78 0.15 75 / 0.02)",
    accentColor: "var(--color-amber)",
  },
  {
    id: 5,
    title: "미국 헬스케어 스타트업의 규제 환경 완벽 가이드",
    excerpt:
      "FDA, HIPAA, ONC 인증까지. 복잡한 미국 헬스케어 규제를 한국 스타트업 관점에서 단계별로 정리합니다. 규제를 피하는 법이 아닌 규제를 무기로 만드는 법.",
    category: "전략",
    tags: ["헬스케어", "규제", "FDA"],
    readTime: 14,
    date: "2026. 03. 07",
    author: {
      name: "Michelle Lee",
      title: "Columbia MBA · Healthcare & Regulatory",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.63 0.2 25 / 0.12)",
    gradientTo: "oklch(0.63 0.2 25 / 0.02)",
    accentColor: "var(--color-red)",
  },
  {
    id: 6,
    title: "엔터프라이즈 세일즈: 한국 B2B SaaS의 미국 대기업 공략법",
    excerpt:
      "포춘 500 기업에 소프트웨어를 판매하는 일. 12개월 영업 사이클, 멀티스레딩, 챔피언 빌딩까지 Enterprise 세일즈의 모든 것을 다룹니다.",
    category: "SaaS",
    tags: ["Enterprise", "B2B", "세일즈"],
    readTime: 11,
    date: "2026. 03. 04",
    author: {
      name: "Alex Turner",
      title: "Booth MBA · Enterprise Sales",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    },
    gradientFrom: "oklch(0.82 0.15 85 / 0.12)",
    gradientTo: "oklch(0.82 0.15 85 / 0.02)",
    accentColor: "var(--color-gold)",
  },
];

const CATEGORIES: Category[] = ["전체", "SaaS", "Fintech", "AI/DeepTech", "E-commerce", "전략"];

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
