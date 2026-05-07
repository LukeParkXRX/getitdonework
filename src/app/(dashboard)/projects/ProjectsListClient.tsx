"use client";

import Link from "next/link";
import type { ProjectStatus } from "@/lib/constants/project-options";

export type ProjectSummary = {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string | null;
  budget: string | null;
  status: ProjectStatus;
  created_at: string;
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "초안",
  open: "모집중",
  matched: "매칭됨",
  in_progress: "진행중",
  completed: "완료",
  cancelled: "취소됨",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: "oklch(0.55 0.01 280)",
  open: "var(--color-green)",
  matched: "#60a5fa",
  in_progress: "var(--color-accent)",
  completed: "oklch(0.5 0.01 280)",
  cancelled: "#f87171",
};

export default function ProjectsListClient({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-black)" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", marginBottom: "48px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(28px, 3.5vw, 40px)", color: "var(--color-text)", marginBottom: "8px", wordBreak: "keep-all" }}>
              내 프로젝트
            </h1>
            <p style={{ fontSize: "16px", color: "var(--color-dim)" }}>
              등록한 프로젝트를 관리하고 진행 상황을 확인하세요.
            </p>
          </div>
          <Link
            href="/projects/new"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              backgroundColor: "var(--color-accent)",
              color: "oklch(0.1 0 0)",
              borderRadius: "10px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            새 프로젝트 등록
          </Link>
        </div>

        {/* 빈 상태 */}
        {projects.length === 0 ? (
          <div style={{
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            padding: "80px 40px",
            textAlign: "center",
            backgroundColor: "var(--color-card)",
          }}>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text)", marginBottom: "12px", fontFamily: "var(--font-display)" }}>
              아직 등록한 프로젝트가 없어요.
            </p>
            <p style={{ fontSize: "15px", color: "var(--color-dim)", marginBottom: "32px", wordBreak: "keep-all" }}>
              첫 프로젝트를 만들어 매칭을 시작하세요.
            </p>
            <Link
              href="/projects/new"
              style={{
                display: "inline-block",
                padding: "14px 32px",
                fontSize: "15px",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                backgroundColor: "var(--color-accent)",
                color: "oklch(0.1 0 0)",
                borderRadius: "10px",
                textDecoration: "none",
              }}
            >
              프로젝트 등록하기
            </Link>
          </div>
        ) : (
          /* 카드 그리드 */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
            gap: "20px",
          }}>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "14px",
                    padding: "24px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    transition: "border-color 0.15s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                >
                  {/* 뱃지 행 */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 700, padding: "3px 10px",
                      borderRadius: "9999px",
                      border: `1px solid ${STATUS_COLORS[p.status]}`,
                      color: STATUS_COLORS[p.status],
                      backgroundColor: `${STATUS_COLORS[p.status]}18`,
                    }}>
                      {STATUS_LABELS[p.status]}
                    </span>
                    <span style={{
                      fontSize: "11px", fontWeight: 600, padding: "3px 10px",
                      borderRadius: "9999px",
                      backgroundColor: "oklch(0.91 0.2 110 / 0.1)",
                      color: "var(--color-accent)",
                      border: "1px solid oklch(0.91 0.2 110 / 0.2)",
                    }}>
                      {p.category}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h2 style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: "17px",
                    color: "var(--color-text)",
                    lineHeight: 1.4,
                    wordBreak: "keep-all",
                  }}>
                    {p.title}
                  </h2>

                  {/* 설명 (2줄 clamp) */}
                  <p style={{
                    fontSize: "14px",
                    color: "var(--color-dim)",
                    lineHeight: 1.6,
                    flex: 1,
                    wordBreak: "keep-all",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {p.description}
                  </p>

                  {/* 기간 + 예산 */}
                  <div style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                  }}>
                    <span style={{ color: "oklch(0.6 0.01 280)" }}>{p.duration ?? "기간 미정"}</span>
                    <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>{p.budget ?? "예산 미정"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
