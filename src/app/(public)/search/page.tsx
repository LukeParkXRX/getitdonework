import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { EnablerBadge } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enabler 검색 — Get It Done at Work",
  description: "전문 분야, 대학, 키워드로 Enabler를 검색하세요.",
};

// ── 타입 ──────────────────────────────────────────────────────────────────────

type RawRow = {
  user_id: string;
  university: string;
  degree_type: string;
  specialties: string[];
  location: string;
  bio: string;
  credit_rate: number;
  badge_level: string;
  rating: number | string;
  session_count: number;
  users:
    | { full_name: string; avatar_url: string | null }
    | { full_name: string; avatar_url: string | null }[]
    | null;
};

const BADGE_LABELS: Record<string, string> = {
  top_rated: "Top Rated",
  verified: "Verified",
  rising_star: "Rising Star",
};

const BADGE_COLOR: Record<string, string> = {
  top_rated: "var(--color-accent)",
  verified: "var(--color-blue)",
  rising_star: "var(--color-amber)",
};

// ── 데이터 fetch ──────────────────────────────────────────────────────────────

async function searchEnablers(q: string) {
  const supabase = await createServerSupabaseClient();

  if (!q.trim()) return [];

  const { data, error } = await supabase
    .from("enabler_profiles")
    .select(`
      user_id,
      university,
      degree_type,
      specialties,
      location,
      bio,
      credit_rate,
      badge_level,
      rating,
      session_count,
      users!inner ( full_name, avatar_url )
    `)
    .eq("status", "approved")
    .or(`university.ilike.%${q}%,degree_type.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`)
    .limit(20);

  if (error) return [];

  const rows = (data ?? []) as unknown as RawRow[];

  return rows.map((row) => {
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    const fullName = u?.full_name ?? "";
    const avatarUrl = u?.avatar_url ?? null;
    const initial = fullName
      .split(" ")
      .map((w: string) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      userId: row.user_id,
      fullName,
      avatarUrl,
      initial,
      university: row.university,
      degreeType: row.degree_type,
      specialties: row.specialties ?? [],
      location: row.location,
      bio: row.bio,
      creditRate: row.credit_rate,
      badgeLevel: row.badge_level as EnablerBadge,
      rating: Number(row.rating),
      sessionCount: row.session_count,
    };
  });
}

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const results = await searchEnablers(q);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)" }}>
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 20px 80px" }}>

        {/* 검색 헤더 */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              color: "var(--color-text)",
              fontFamily: "var(--font-display)",
              marginBottom: "24px",
            }}
          >
            Enabler 검색
          </h1>

          {/* 검색 폼 */}
          <form method="GET" action="/search" style={{ display: "flex", gap: "12px", maxWidth: "600px" }}>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="전문 분야, 대학명, 지역, 키워드로 검색..."
              autoFocus
              style={{
                flex: 1,
                padding: "14px 18px",
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-text)",
                fontSize: "15px",
                fontFamily: "var(--font-body)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "14px 24px",
                backgroundColor: "var(--color-accent)",
                border: "none",
                borderRadius: "12px",
                color: "oklch(0.1 0 0)",
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              검색
            </button>
          </form>
        </div>

        {/* 결과 영역 */}
        {!q ? (
          /* 빈 검색어 안내 */
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "var(--color-dim)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>
              &#x1F50D;
            </div>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-text)", marginBottom: "8px" }}>
              키워드를 입력하고 Enabler를 찾아보세요
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.7 }}>
              전공, 전문 분야, 지역명 등으로 검색할 수 있습니다.
            </p>
            <div style={{ marginTop: "32px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              {["B2B SaaS", "Fintech", "AI", "Healthcare", "Stanford", "MIT"].map((kw) => (
                <Link
                  key={kw}
                  href={`/search?q=${encodeURIComponent(kw)}`}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    color: "var(--color-dim)",
                    textDecoration: "none",
                    transition: "border-color 0.15s",
                  }}
                >
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          /* 빈 결과 */
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "var(--color-dim)",
            }}
          >
            <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-text)", marginBottom: "8px" }}>
              &ldquo;{q}&rdquo;에 대한 검색 결과가 없습니다
            </p>
            <p style={{ fontSize: "14px", marginBottom: "24px" }}>
              다른 키워드로 검색하거나 전체 Enabler를 둘러보세요.
            </p>
            <Link
              href="/enablers"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "var(--color-accent)",
                borderRadius: "10px",
                color: "oklch(0.1 0 0)",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: "var(--font-display)",
              }}
            >
              전체 Enabler 보기
            </Link>
          </div>
        ) : (
          /* 결과 그리드 */
          <div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-dim)",
                marginBottom: "24px",
                fontFamily: "var(--font-body)",
              }}
            >
              &ldquo;{q}&rdquo; 검색 결과 — {results.length}명
            </p>
            <div
              className="grid gap-5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                display: "grid",
              }}
            >
              {results.map((enabler) => (
                <Link
                  key={enabler.userId}
                  href={`/enablers/${enabler.userId}`}
                  style={{ textDecoration: "none" }}
                >
                  <article
                    style={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "16px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px oklch(0.91 0.2 110 / 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    {/* 아바타 + 이름 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {enabler.avatarUrl ? (
                        <Image
                          src={enabler.avatarUrl}
                          alt={enabler.fullName}
                          width={48}
                          height={48}
                          style={{ borderRadius: "9999px", objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "9999px",
                            backgroundColor: "var(--color-accent-dim)",
                            color: "var(--color-accent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {enabler.initial}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: "var(--color-text)",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {enabler.fullName}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              backgroundColor: `${BADGE_COLOR[enabler.badgeLevel]}22`,
                              color: BADGE_COLOR[enabler.badgeLevel],
                              border: `1px solid ${BADGE_COLOR[enabler.badgeLevel]}44`,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {BADGE_LABELS[enabler.badgeLevel]}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "var(--color-dim)",
                            margin: "2px 0 0",
                          }}
                        >
                          {enabler.university} · {enabler.degreeType}
                        </p>
                      </div>
                    </div>

                    {/* 전문 분야 태그 */}
                    {enabler.specialties.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {enabler.specialties.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            style={{
                              fontSize: "12px",
                              padding: "4px 10px",
                              backgroundColor: "oklch(0.18 0.006 280)",
                              color: "var(--color-dim)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "9999px",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                        {enabler.specialties.length > 4 && (
                          <span
                            style={{
                              fontSize: "12px",
                              padding: "4px 10px",
                              color: "var(--color-dim)",
                            }}
                          >
                            +{enabler.specialties.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 하단: 평점 + 크레딧 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--color-border)",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "var(--color-accent)", fontWeight: 600 }}>
                        {enabler.rating > 0 ? `★ ${enabler.rating.toFixed(1)}` : "신규"}
                        {enabler.sessionCount > 0 && (
                          <span style={{ color: "var(--color-dim)", fontWeight: 400, marginLeft: "8px" }}>
                            {enabler.sessionCount}+ 세션
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--color-dim)" }}>
                        {enabler.creditRate} 크레딧/hr
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
