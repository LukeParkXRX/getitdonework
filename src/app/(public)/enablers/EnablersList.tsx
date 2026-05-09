"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { EnablerBadge } from "@/types";
import { Pagination } from "@/components/ui/Pagination";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export type EnablerListItem = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  avatarInitial: string;
  university: string;
  degreeType: string;
  specialties: string[];
  location: string;
  bio: string;
  creditRate: number;
  badgeLevel: "verified" | "top_rated" | "rising_star";
  sessionCount: number;
  rating: number;
  enablerScore: number;
};

type SortOption = "recommended" | "rating" | "sessions" | "price_low" | "price_high";

const PAGE_SIZE = 12;

type FilterCategory =
  | "All"
  | "B2B SaaS"
  | "Fintech"
  | "AI/DeepTech"
  | "E-commerce"
  | "Healthcare";

// ─── 배지 설정 ────────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<
  EnablerBadge,
  { label: string; color: string; bg: string; dot: string }
> = {
  top_rated: {
    label: "Top Rated",
    color: "var(--color-accent)",
    bg: "var(--color-accent-dim)",
    dot: "var(--color-accent)",
  },
  verified: {
    label: "Verified",
    color: "var(--color-blue)",
    bg: "var(--color-blue-dim)",
    dot: "var(--color-blue)",
  },
  rising_star: {
    label: "Rising Star",
    color: "var(--color-amber)",
    bg: "oklch(0.78 0.15 75 / 0.1)",
    dot: "var(--color-amber)",
  },
};

const SPECIALTY_FILTERS: FilterCategory[] = [
  "All",
  "B2B SaaS",
  "Fintech",
  "AI/DeepTech",
  "E-commerce",
  "Healthcare",
];

// ─── 별점 컴포넌트 ────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const partial = !filled && rating > star - 1;
        return (
          <svg
            key={star}
            width="18"
            height="18"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
              fill={
                filled
                  ? "var(--color-accent)"
                  : partial
                  ? "url(#half)"
                  : "var(--color-border)"
              }
              stroke="none"
            />
          </svg>
        );
      })}
    </div>
  );
}

// ─── Enabler 카드 ─────────────────────────────────────────────────────────────

function EnablerCard({
  enabler,
}: {
  enabler: EnablerListItem;
  index: number;
}) {
  const t = useTranslations("EnablersList");
  const [hovered, setHovered] = useState(false);
  const badge = BADGE_CONFIG[enabler.badgeLevel];

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: "var(--color-card)",
        border: `1px solid ${hovered ? "var(--color-accent)" : "var(--color-border)"}`,
        boxShadow: hovered
          ? "0 8px 32px oklch(0.91 0.2 110 / 0.08)"
          : "0 2px 8px oklch(0 0 0 / 0.2)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* 호버 시 상단 accent 라인 */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* 헤더: 아바타 + 이름 + 배지 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <div className="relative shrink-0">
              {enabler.avatarUrl ? (
                <img
                  src={enabler.avatarUrl}
                  alt={enabler.fullName}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                  style={{
                    width: "120px",
                    height: "120px",
                    border: "2px solid var(--color-border)",
                  }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center font-bold text-lg"
                  style={{
                    width: "120px",
                    height: "120px",
                    border: "2px solid var(--color-border)",
                    backgroundColor: "var(--color-dark)",
                    color: "var(--color-accent)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {enabler.avatarInitial}
                </div>
              )}
              {/* 온라인 표시 */}
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: "var(--color-green)",
                  borderColor: "var(--color-card)",
                }}
              />
            </div>

            {/* 이름 + 학교 */}
            <div>
              <h3
                className="font-bold text-[17px] leading-tight"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
              >
                {enabler.fullName}
              </h3>
              <p className="text-[13px] mt-0.5 leading-snug" style={{ color: "var(--color-dim)" }}>
                {enabler.university} · {enabler.degreeType}
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: "var(--color-dim)" }}>
                {enabler.location}
              </p>
            </div>
          </div>

          {/* 배지 */}
          <span
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
            style={{ color: badge.color, backgroundColor: badge.bg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
            {badge.label}
          </span>
        </div>

        {/* 자기소개 */}
        <p
          className="text-[14px] leading-relaxed"
          style={{
            color: "var(--color-dim)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {enabler.bio}
        </p>

        {/* 전문 분야 태그 */}
        <div className="flex flex-wrap gap-1.5">
          {enabler.specialties.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-md text-[12px] font-medium"
              style={{
                backgroundColor: "oklch(0.22 0.006 280)",
                color: "var(--color-dim)",
                border: "1px solid var(--color-border)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 구분선 */}
        <div className="h-px" style={{ backgroundColor: "var(--color-border)" }} />

        {/* 하단: 평점 + 크레딧 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StarRating rating={enabler.rating} />
            <span
              className="text-lg font-bold"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
            >
              {enabler.rating.toFixed(1)}
            </span>
            <span className="text-[15px]" style={{ color: "var(--color-dim)" }}>
              ({enabler.sessionCount} {t("sessions")})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span
              className="text-xl font-bold"
              style={{ color: "var(--color-accent)", fontFamily: "var(--font-display)" }}
            >
              {enabler.creditRate}
            </span>
            <span className="text-[15px]" style={{ color: "var(--color-dim)" }}>
              {t("creditPerSession")}
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-5">
        <Link
          href={`/enablers/${enabler.userId}`}
          className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={{
            backgroundColor: hovered ? "var(--color-accent)" : "oklch(0.22 0.006 280)",
            color: hovered ? "oklch(0.1 0 0)" : "var(--color-dim)",
            border: `1px solid ${hovered ? "var(--color-accent)" : "var(--color-border)"}`,
            fontFamily: "var(--font-display)",
          }}
        >
          {t("bookSession")}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="ml-1.5 transition-transform duration-200"
            style={{ transform: hovered ? "translateX(2px)" : "translateX(0)" }}
          >
            <path
              d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </article>
  );
}

// ─── EnablersList (메인 export) ───────────────────────────────────────────────

export type EnablerListStats = {
  enablerCount: number;
  completedSessions: number;
  avgRating: number;
};

export default function EnablersList({
  enablers,
  stats,
}: {
  enablers: EnablerListItem[];
  stats: EnablerListStats;
}) {
  const t = useTranslations("EnablersList");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const base = enablers.filter((e) => {
      const matchesFilter =
        activeFilter === "All" ||
        e.specialties.some((s) =>
          s.toLowerCase().includes(activeFilter.toLowerCase())
        ) ||
        (activeFilter === "B2B SaaS" && e.specialties.some((s) => s.includes("SaaS")));

      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        e.fullName.toLowerCase().includes(q) ||
        e.university.toLowerCase().includes(q) ||
        e.specialties.some((s) => s.toLowerCase().includes(q)) ||
        e.location.toLowerCase().includes(q);

      return matchesFilter && matchesQuery;
    });

    return [...base].sort((a, b) => {
      switch (sortBy) {
        case "recommended":
          if (b.enablerScore !== a.enablerScore) return b.enablerScore - a.enablerScore;
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.sessionCount - a.sessionCount;
        case "rating":
          return b.rating - a.rating;
        case "sessions":
          return b.sessionCount - a.sessionCount;
        case "price_low":
          return a.creditRate - b.creditRate;
        case "price_high":
          return b.creditRate - a.creditRate;
        default:
          return 0;
      }
    });
  }, [query, activeFilter, sortBy, enablers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = (fn: () => void) => { fn(); setPage(1); };

  const noData = enablers.length === 0;
  const noResults = !noData && filtered.length === 0;

  return (
    <>
      {/* ── 검색 + 필터 영역 ─────────────────────────────────────────── */}
      <section className="relative pt-8 pb-16 px-5">
        <div
          className="relative"
          style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}
        >
          {/* 검색 바 + 정렬 */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              maxWidth: "640px",
              margin: "0 auto 24px auto",
              width: "100%",
              alignItems: "center",
            }}
          >
            {/* 검색 인풋 */}
            <div style={{ position: "relative", flex: "1 1 260px", minWidth: 0 }}>
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--color-dim)" }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <input
                type="text"
                value={query}
                onChange={(e) => resetPage(() => setQuery(e.target.value))}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-11 pr-5 py-3.5 rounded-xl text-sm transition-all duration-200 outline-none"
                style={{
                  backgroundColor: "var(--color-dark)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px oklch(0.91 0.2 110 / 0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              {query && (
                <button
                  onClick={() => resetPage(() => setQuery(""))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-colors duration-150"
                  style={{ backgroundColor: "var(--color-border)", color: "var(--color-dim)" }}
                  aria-label="clear search"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* 정렬 select */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <span className="text-sm" style={{ color: "var(--color-dim)", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
                {t("sortLabel")}
              </span>
              <select
                value={sortBy}
                onChange={(e) => resetPage(() => setSortBy(e.target.value as SortOption))}
                className="py-3.5 pl-3 pr-8 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  backgroundColor: "var(--color-dark)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                }}
              >
                <option value="recommended">{t("sortRecommended")}</option>
                <option value="rating">{t("sortRating")}</option>
                <option value="sessions">{t("sortSessions")}</option>
                <option value="price_low">{t("sortPriceLow")}</option>
                <option value="price_high">{t("sortPriceHigh")}</option>
              </select>
            </div>
          </div>

          {/* 필터 pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            {SPECIALTY_FILTERS.map((cat) => {
              const isActive = activeFilter === cat;
              const label = cat === "All" ? t("filterAll") : cat;
              return (
                <button
                  key={cat}
                  onClick={() => resetPage(() => setActiveFilter(cat))}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? "var(--color-accent)" : "var(--color-dark)",
                    color: isActive ? "oklch(0.1 0 0)" : "var(--color-dim)",
                    border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────── */}
      <section className="px-5 mb-12">
        <div
          className="rounded-2xl"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "40px",
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          {[
            { value: `${stats.enablerCount}`, label: t("statsEnabler") },
            { value: `${stats.completedSessions}`, label: t("statsSessions") },
            { value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", label: t("statsRating") },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span
                className="text-3xl font-black"
                style={{ color: "var(--color-accent)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                {stat.value}
              </span>
              <span className="text-[15px]" style={{ color: "var(--color-dim)" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 결과 그리드 ───────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 80px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 4px" }}>
          {/* 결과 카운트 */}
          {!noData && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "28px",
              }}
            >
              <p className="text-sm" style={{ color: "var(--color-dim)" }}>
                <span className="font-bold" style={{ color: "var(--color-text)" }}>
                  {filtered.length}
                </span>
                {" "}Enablers
              </p>
              {(query || activeFilter !== "All") && (
                <button
                  onClick={() => { setQuery(""); setActiveFilter("All"); setPage(1); }}
                  className="text-xs transition-colors duration-150"
                  style={{ color: "var(--color-dim)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-dim)"; }}
                >
                  {t("filterAll")} ×
                </button>
              )}
            </div>
          )}

          {/* DB에 데이터 없음 */}
          {noData && (
            <div
              className="flex flex-col items-center justify-center py-24 rounded-2xl"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--color-dark)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "var(--color-dim)" }}>
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
                {t("noResults")}
              </p>
              <p className="text-sm" style={{ color: "var(--color-dim)" }}>
                {t("noResultsDesc")}
              </p>
            </div>
          )}

          {/* 검색/필터 결과 없음 */}
          {noResults && (
            <div
              className="flex flex-col items-center justify-center py-24 rounded-2xl"
              style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--color-dark)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "var(--color-dim)" }}>
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8.5 11H13.5M11 8.5V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
                {t("noResults")}
              </p>
              <p className="text-sm" style={{ color: "var(--color-dim)" }}>
                {t("noResultsDesc")}
              </p>
              <button
                onClick={() => { setQuery(""); setActiveFilter("All"); setPage(1); }}
                className="mt-5 px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{ backgroundColor: "var(--color-dark)", color: "var(--color-dim)", border: "1px solid var(--color-border)" }}
              >
                {t("filterAll")}
              </button>
            </div>
          )}

          {/* 그리드 */}
          {filtered.length > 0 && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                  gap: "24px",
                }}
              >
                {paginated.map((enabler, i) => (
                  <EnablerCard key={enabler.userId} enabler={enabler} index={i} />
                ))}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
