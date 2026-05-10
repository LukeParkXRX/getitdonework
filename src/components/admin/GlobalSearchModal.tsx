"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── 타입 ───────────────────────────────────────────────────────────────────

type UserResult = { id: string; name: string | null; email: string | null; role: string | null; href: string };
type BookingResult = { id: string; status: string | null; scheduled_at: string | null; href: string };
type ApplicationResult = { id: string; name: string | null; email: string | null; status: string | null; href: string };
type InquiryResult = { id: string; name: string | null; email: string | null; inquiry_type: string | null; href: string };
type OrgResult = { id: string; name: string | null; slug: string | null; href: string };

type SearchResults = {
  users: UserResult[];
  bookings: BookingResult[];
  applications: ApplicationResult[];
  inquiries: InquiryResult[];
  organizations: OrgResult[];
};

type FlatItem = {
  key: string;
  label: string;
  sub: string;
  href: string;
};

// ─── 최근 검색어 ──────────────────────────────────────────────────────────

const RECENT_KEY = "admin_search_recent";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const prev = loadRecent().filter((r) => r !== q);
  const next = [q, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

// ─── flatten results → 단일 목록 ─────────────────────────────────────────

function flatten(results: SearchResults): { group: string; items: FlatItem[] }[] {
  const groups: { group: string; items: FlatItem[] }[] = [];

  if (results.users.length > 0) {
    groups.push({
      group: "사용자",
      items: results.users.map((u) => ({
        key: `user-${u.id}`,
        label: u.name ?? u.email ?? u.id,
        sub: u.email ?? u.role ?? "",
        href: u.href,
      })),
    });
  }
  if (results.bookings.length > 0) {
    groups.push({
      group: "예약",
      items: results.bookings.map((b) => ({
        key: `booking-${b.id}`,
        label: b.id.slice(0, 8) + "…",
        sub: b.status ?? "",
        href: b.href,
      })),
    });
  }
  if (results.applications.length > 0) {
    groups.push({
      group: "신청자",
      items: results.applications.map((a) => ({
        key: `app-${a.id}`,
        label: a.name ?? a.email ?? a.id,
        sub: a.email ?? a.status ?? "",
        href: a.href,
      })),
    });
  }
  if (results.inquiries.length > 0) {
    groups.push({
      group: "문의",
      items: results.inquiries.map((i) => ({
        key: `inq-${i.id}`,
        label: i.name ?? i.id,
        sub: i.inquiry_type ?? i.email ?? "",
        href: i.href,
      })),
    });
  }
  if (results.organizations.length > 0) {
    groups.push({
      group: "기관",
      items: results.organizations.map((o) => ({
        key: `org-${o.id}`,
        label: o.name ?? o.id,
        sub: o.slug ?? "",
        href: o.href,
      })),
    });
  }

  return groups;
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────

export default function GlobalSearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cmd+K / Ctrl+K 토글
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  // 열릴 때 포커스 + 최근 검색어 로드
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setActiveIdx(0);
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // 검색 (디바운스 300ms)
  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("search failed");
        const data: SearchResults = await res.json();
        setResults(data);
        setActiveIdx(0);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  function handleQueryChange(v: string) {
    setQuery(v);
    search(v);
  }

  // 그룹 구조 → 플랫 아이템 목록
  const groups = results ? flatten(results) : [];
  const flatItems: FlatItem[] = groups.flatMap((g) => g.items);

  function navigate(href: string, q: string) {
    if (q.trim().length >= 2) saveRecent(q.trim());
    setOpen(false);
    router.push(href);
  }

  // 키보드 네비게이션
  function onKeyDown(e: React.KeyboardEvent) {
    if (flatItems.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIdx];
      if (item) navigate(item.href, query);
    }
  }

  if (!open) return null;

  // 결과를 그룹별로 렌더할 때 activeIdx 계산용 offset
  let offset = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          width: "100%",
          maxWidth: 640,
          background: "var(--color-dark)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
          fontFamily: "var(--font-body)",
        }}
      >
        {/* 검색 입력 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 18px",
            gap: 12,
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {/* Search icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-dim)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="사용자, 예약, 신청자, 문의, 기관 검색…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-text)",
              fontSize: 16,
              fontFamily: "var(--font-body)",
            }}
          />

          {loading && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-dim)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ flexShrink: 0, animation: "spin 0.8s linear infinite" }}
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          )}

          <kbd
            style={{
              fontSize: 11,
              color: "var(--color-dim)",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              padding: "2px 6px",
              fontFamily: "var(--font-display)",
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* 결과 영역 */}
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {/* 최근 검색어 (query 없을 때) */}
          {query.length === 0 && recent.length > 0 && (
            <div>
              <div style={groupHeaderStyle}>최근 검색어</div>
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => handleQueryChange(r)}
                  style={recentItemStyle}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-card)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-dim)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                  </svg>
                  <span style={{ color: "var(--color-text)", fontSize: 14 }}>{r}</span>
                </button>
              ))}
            </div>
          )}

          {/* 검색 결과 */}
          {results && groups.length === 0 && (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: "var(--color-dim)",
                fontSize: 14,
              }}
            >
              &quot;{query}&quot; 에 대한 결과가 없습니다
            </div>
          )}

          {groups.map((group) => {
            const groupOffset = offset;
            offset += group.items.length;

            return (
              <div key={group.group}>
                <div style={groupHeaderStyle}>{group.group}</div>
                {group.items.map((item, itemIdx) => {
                  const idx = groupOffset + itemIdx;
                  const isActive = idx === activeIdx;

                  return (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.href, query)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      style={{
                        ...resultItemStyle,
                        background: isActive ? "var(--color-card)" : "transparent",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          color: "var(--color-text)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          flex: 1,
                          textAlign: "left",
                        }}
                      >
                        {item.label}
                      </span>
                      {item.sub && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--color-dim)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {item.sub}
                        </span>
                      )}
                      {isActive && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0 }}
                        >
                          <polyline points="9 10 4 15 9 20" />
                          <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* 빈 상태 힌트 */}
          {!results && query.length < 2 && recent.length === 0 && (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: "var(--color-dim)",
                fontSize: 14,
              }}
            >
              검색어를 2글자 이상 입력하세요
            </div>
          )}
        </div>

        {/* 푸터 힌트 */}
        <div
          style={{
            padding: "10px 18px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          {[
            { key: "↑↓", desc: "이동" },
            { key: "Enter", desc: "선택" },
            { key: "ESC", desc: "닫기" },
          ].map(({ key, desc }) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <kbd
                style={{
                  fontSize: 11,
                  color: "var(--color-dim)",
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontFamily: "var(--font-display)",
                }}
              >
                {key}
              </kbd>
              <span style={{ fontSize: 12, color: "var(--color-dim)" }}>{desc}</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ─── 스타일 상수 ──────────────────────────────────────────────────────────

const groupHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-dim)",
  padding: "12px 18px 6px",
  fontFamily: "var(--font-display)",
};

const resultItemStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "9px 18px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  transition: "background 0.1s",
};

const recentItemStyle: React.CSSProperties = {
  ...resultItemStyle,
  gap: 10,
};
