"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { EnablerBadge } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MatchingEnablerItem = {
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
  badgeLevel: EnablerBadge;
  sessionCount: number;
  rating: number;
  reRequestRate?: number;
};

// ── Filter constants ──────────────────────────────────────────────────────────

const SPECIALTY_FILTERS = [
  "B2B SaaS",
  "Fintech",
  "E-commerce",
  "Healthcare",
  "AI/DeepTech",
  "Consumer",
];

const SCHOOL_FILTERS = [
  "Stanford GSB",
  "Wharton",
  "HBS",
  "MIT Sloan",
  "Columbia",
  "Chicago Booth",
];

const LOCATION_FILTERS = [
  "San Francisco",
  "New York",
  "Boston",
  "Chicago",
  "LA",
];

const RATING_FILTERS = [
  { label: "4.5+", value: 4.5 },
  { label: "4.0+", value: 4.0 },
  { label: "3.5+", value: 3.5 },
];

type SortKey = "recommended" | "rating" | "sessions" | "credit_asc";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "추천순", value: "recommended" },
  { label: "평점순", value: "rating" },
  { label: "세션순", value: "sessions" },
  { label: "크레딧 낮은순", value: "credit_asc" },
];

// ── Badge helpers ─────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<
  EnablerBadge,
  { label: string; color: string; bg: string }
> = {
  top_rated: {
    label: "Top Rated",
    color: "var(--color-gold)",
    bg: "oklch(0.82 0.15 85 / 0.12)",
  },
  verified: {
    label: "Verified",
    color: "var(--color-blue)",
    bg: "oklch(0.65 0.15 250 / 0.12)",
  },
  rising_star: {
    label: "Rising Star",
    color: "var(--color-green)",
    bg: "oklch(0.72 0.19 155 / 0.12)",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2.5"
      style={{
        fontSize: "11px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-dim)",
      }}
    >
      {children}
    </p>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="transition-all duration-150"
      style={{
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontFamily: "var(--font-body)",
        fontWeight: active ? 600 : 400,
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
        backgroundColor: active ? "var(--color-accent-dim)" : "var(--color-dark)",
        color: active ? "var(--color-accent)" : "var(--color-dim)",
        cursor: "pointer",
        lineHeight: "1.6",
      }}
    >
      {label}
    </button>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span style={{ color: "var(--color-gold)", fontSize: "12px" }}>
      {"★".repeat(Math.floor(value))}
      {value % 1 >= 0.5 ? "½" : ""}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function EnablerAvatar({
  avatarUrl,
  avatarInitial,
  fullName,
}: {
  avatarUrl: string | null;
  avatarInitial: string;
  fullName: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-accent-dim)",
        border: "1px solid oklch(0.91 0.2 110 / 0.2)",
        fontSize: "14px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        color: "var(--color-accent)",
      }}
    >
      {avatarInitial || "?"}
    </div>
  );
}

// ── Enabler Card ──────────────────────────────────────────────────────────────

function EnablerCard({
  enabler,
  selected,
  onClick,
}: {
  enabler: MatchingEnablerItem;
  selected: boolean;
  onClick: () => void;
}) {
  const badge = BADGE_CONFIG[enabler.badgeLevel];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="text-left w-full transition-all duration-200"
      style={{
        backgroundColor: selected
          ? "oklch(0.91 0.2 110 / 0.04)"
          : "var(--color-card)",
        border: `1px solid ${selected ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "12px",
        padding: "20px",
        cursor: "pointer",
        boxShadow: selected ? "0 0 0 1px var(--color-accent)" : "none",
        animation: "var(--animate-slide-up)",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "oklch(0.91 0.2 110 / 0.4)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--color-border)";
        }
      }}
    >
      {/* Top row: avatar + name + badge */}
      <div className="flex items-start gap-3 mb-3">
        <EnablerAvatar
          avatarUrl={enabler.avatarUrl}
          avatarInitial={enabler.avatarInitial}
          fullName={enabler.fullName}
        />

        {/* Name + school */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <Link
              href={`/enablers/${enabler.userId}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: "14px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: 1.3,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text)")}
            >
              {enabler.fullName}
            </Link>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                color: badge.color,
                backgroundColor: badge.bg,
                padding: "1px 7px",
                borderRadius: "9999px",
                lineHeight: 1.8,
                whiteSpace: "nowrap",
              }}
            >
              {badge.label}
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--color-dim)",
              fontFamily: "var(--font-body)",
              lineHeight: 1.4,
            }}
          >
            {enabler.university} · {enabler.degreeType}
          </p>
        </div>
      </div>

      {/* Bio */}
      <p
        className="mb-3"
        style={{
          fontSize: "13px",
          color: "var(--color-dim)",
          fontFamily: "var(--font-body)",
          lineHeight: 1.6,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {enabler.bio}
      </p>

      {/* Specialty tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {enabler.specialties.map((s) => (
          <span
            key={s}
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              color: "var(--color-dim)",
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              padding: "1px 8px",
              borderRadius: "9999px",
              lineHeight: 1.8,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Bottom row: rating + sessions | credits + book button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <StarRating value={enabler.rating} />
            <span
              style={{
                fontSize: "12px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text)",
              }}
            >
              {enabler.rating.toFixed(1)}
            </span>
          </div>
          <span
            style={{
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              backgroundColor: "var(--color-border)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-dim)",
              fontFamily: "var(--font-body)",
            }}
          >
            {enabler.sessionCount}회 세션
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            {enabler.creditRate}C
          </span>
          <Link
            href={`/enablers/${enabler.userId}`}
            onClick={(e) => e.stopPropagation()}
            className="transition-all duration-150"
            style={{
              padding: "4px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              backgroundColor: "var(--color-accent)",
              color: "oklch(0.1 0 0)",
              border: "none",
              cursor: "pointer",
              lineHeight: 1.6,
              textDecoration: "none",
              display: "inline-block",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
            }
          >
            예약
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Client ───────────────────────────────────────────────────────────────

export default function MatchingClient({
  enablers,
}: {
  enablers: MatchingEnablerItem[];
}) {
  const [search, setSearch] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [creditRange, setCreditRange] = useState<[number, number]>([1, 3]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  function toggle<T>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  const filtered = useMemo(() => {
    let result = [...enablers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.specialties.some((s) => s.toLowerCase().includes(q)) ||
          e.university.toLowerCase().includes(q)
      );
    }

    if (specialties.length > 0) {
      result = result.filter((e) =>
        specialties.some((s) => e.specialties.includes(s))
      );
    }

    if (schools.length > 0) {
      result = result.filter((e) =>
        schools.some((s) => e.university.toLowerCase().includes(s.toLowerCase()))
      );
    }

    if (locations.length > 0) {
      result = result.filter((e) =>
        locations.some((l) => e.location.toLowerCase().includes(l.toLowerCase()))
      );
    }

    result = result.filter(
      (e) => e.creditRate >= creditRange[0] && e.creditRate <= creditRange[1]
    );

    if (minRating !== null) {
      result = result.filter((e) => e.rating >= minRating);
    }

    switch (sortKey) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "sessions":
        result.sort((a, b) => b.sessionCount - a.sessionCount);
        break;
      case "credit_asc":
        result.sort((a, b) => a.creditRate - b.creditRate);
        break;
      default:
        // "recommended": rating 기준 정렬 (enablerScore 없으므로 rating 대체)
        result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [search, specialties, schools, locations, creditRange, minRating, sortKey, enablers]);

  const hasActiveFilters =
    specialties.length > 0 ||
    schools.length > 0 ||
    locations.length > 0 ||
    minRating !== null ||
    creditRange[0] !== 1 ||
    creditRange[1] !== 3;

  function clearAll() {
    setSpecialties([]);
    setSchools([]);
    setLocations([]);
    setMinRating(null);
    setCreditRange([1, 3]);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-black)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Page shell: below 56px navbar */}
      <div
        style={{
          paddingTop: "56px",
          display: "flex",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT SIDEBAR ── */}
        <aside
          className={mobileFilterOpen ? "flex" : "hidden md:flex"}
          style={{
            width: "280px",
            minWidth: "280px",
            height: "100%",
            overflowY: "auto",
            borderRight: "1px solid var(--color-border)",
            backgroundColor: "var(--color-dark)",
            padding: "20px 16px 32px",
            flexDirection: "column",
            gap: "0",
            position: "relative" as const,
            zIndex: 10,
          }}
        >
          {/* Search input */}
          <div className="relative mb-5">
            <svg
              className="absolute"
              style={{
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "14px",
                height: "14px",
                color: "var(--color-dim)",
                pointerEvents: "none",
              }}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="9" r="6" />
              <path d="M17 17l-4-4" />
            </svg>
            <input
              type="text"
              placeholder="이름, 전문 분야 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "var(--color-black)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "8px 12px 8px 32px",
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                color: "var(--color-text)",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor =
                  "var(--color-accent)")
              }
              onBlur={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor =
                  "var(--color-border)")
              }
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="mb-4 transition-opacity duration-150 hover:opacity-70"
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-body)",
                color: "var(--color-accent)",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: 0,
              }}
            >
              전체 필터 초기화 ×
            </button>
          )}

          {/* ─ 전문 분야 ─ */}
          <div
            style={{
              paddingBottom: "16px",
              marginBottom: "16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <FilterLabel>전문 분야</FilterLabel>
            <div className="flex flex-wrap gap-1.5">
              {SPECIALTY_FILTERS.map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  active={specialties.includes(s)}
                  onClick={() => setSpecialties(toggle(specialties, s))}
                />
              ))}
            </div>
          </div>

          {/* ─ 학교 ─ */}
          <div
            style={{
              paddingBottom: "16px",
              marginBottom: "16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <FilterLabel>학교</FilterLabel>
            <div className="flex flex-wrap gap-1.5">
              {SCHOOL_FILTERS.map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  active={schools.includes(s)}
                  onClick={() => setSchools(toggle(schools, s))}
                />
              ))}
            </div>
          </div>

          {/* ─ 지역 ─ */}
          <div
            style={{
              paddingBottom: "16px",
              marginBottom: "16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <FilterLabel>지역</FilterLabel>
            <div className="flex flex-wrap gap-1.5">
              {LOCATION_FILTERS.map((l) => (
                <FilterChip
                  key={l}
                  label={l}
                  active={locations.includes(l)}
                  onClick={() => setLocations(toggle(locations, l))}
                />
              ))}
            </div>
          </div>

          {/* ─ 크레딧 ─ */}
          <div
            style={{
              paddingBottom: "16px",
              marginBottom: "16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <FilterLabel>크레딧</FilterLabel>
            <div className="flex items-center gap-2 mb-3">
              <span
                style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-accent)",
                }}
              >
                {creditRange[0]}C
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-border)" }}>
                —
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-accent)",
                }}
              >
                {creditRange[1]}C
              </span>
            </div>
            {/* Credit range buttons */}
            <div className="flex gap-1.5">
              {[1, 2, 3].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    if (creditRange[0] === c && creditRange[1] === c) {
                      setCreditRange([1, 3]);
                    } else {
                      setCreditRange([c, c]);
                    }
                  }}
                  className="transition-all duration-150"
                  style={{
                    padding: "3px 12px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    border: `1px solid ${
                      creditRange[0] <= c && c <= creditRange[1]
                        ? "var(--color-accent)"
                        : "var(--color-border)"
                    }`,
                    backgroundColor:
                      creditRange[0] <= c && c <= creditRange[1]
                        ? "var(--color-accent-dim)"
                        : "var(--color-dark)",
                    color:
                      creditRange[0] <= c && c <= creditRange[1]
                        ? "var(--color-accent)"
                        : "var(--color-dim)",
                    cursor: "pointer",
                    lineHeight: "1.6",
                  }}
                >
                  {c}C
                </button>
              ))}
            </div>
          </div>

          {/* ─ 평점 ─ */}
          <div>
            <FilterLabel>평점</FilterLabel>
            <div className="flex flex-wrap gap-1.5">
              {RATING_FILTERS.map((r) => (
                <FilterChip
                  key={r.label}
                  label={r.label}
                  active={minRating === r.value}
                  onClick={() =>
                    setMinRating(minRating === r.value ? null : r.value)
                  }
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main
          className="px-4 py-5 md:px-7 md:py-6"
          style={{
            flex: 1,
            height: "100%",
            overflowY: "auto",
            minWidth: 0,
          }}
        >
          {/* 모바일 필터 토글 버튼 */}
          <button
            className="md:hidden flex items-center gap-2 mb-4"
            onClick={() => setMobileFilterOpen((p) => !p)}
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              color: "var(--color-dim)",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            {mobileFilterOpen ? "필터 닫기 ✕" : `필터${hasActiveFilters ? " ●" : ""} 열기`}
          </button>

          {/* Top bar */}
          <div
            className="flex items-center justify-between mb-6"
            style={{ animation: "var(--animate-fade-in)" }}
          >
            <div className="flex items-center gap-3">
              <h1
                style={{
                  fontSize: "20px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  lineHeight: 1.2,
                }}
              >
                {filtered.length}명의 Enabler
              </h1>
              {hasActiveFilters && (
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    backgroundColor: "var(--color-accent-dim)",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    border: "1px solid oklch(0.91 0.2 110 / 0.3)",
                  }}
                >
                  필터 적용됨
                </span>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  padding: "7px 32px 7px 12px",
                  fontSize: "13px",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    style={{ backgroundColor: "var(--color-dark)" }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              {/* Chevron icon */}
              <svg
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "12px",
                  height: "12px",
                  color: "var(--color-dim)",
                  pointerEvents: "none",
                }}
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center"
              style={{
                paddingTop: "80px",
                animation: "var(--animate-fade-in)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg
                  style={{ width: "22px", height: "22px", color: "var(--color-dim)" }}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="9" r="6" />
                  <path d="M17 17l-4-4" />
                </svg>
              </div>
              <p
                style={{
                  fontSize: "15px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  marginBottom: "6px",
                }}
              >
                검색 결과가 없습니다
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-dim)",
                  fontFamily: "var(--font-body)",
                }}
              >
                필터를 조정하거나 다른 키워드로 검색해 보세요.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
                gap: "16px",
              }}
            >
              {filtered.map((enabler, i) => (
                <div
                  key={enabler.userId}
                  style={{
                    animation: "var(--animate-slide-up)",
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  <EnablerCard
                    enabler={enabler}
                    selected={selectedId === enabler.userId}
                    onClick={() =>
                      setSelectedId(
                        selectedId === enabler.userId ? null : enabler.userId
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
