"use client";

import Link from "next/link";
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
    title: "빠른 실행",
    desc: "완벽함보다 빠른 출시. 배우면서 고쳐나갑니다.",
  },
  {
    icon: "🌏",
    title: "리모트 퍼스트",
    desc: "한국·미국 어디서든 일합니다. 비동기 소통을 선호합니다.",
  },
  {
    icon: "🎯",
    title: "임팩트 중심",
    desc: "내가 한 일이 실제 스타트업의 성과로 이어집니다.",
  },
];

const jobs = [
  {
    title: "프론트엔드 엔지니어",
    tag: "채용 중",
    tagType: "accent" as const,
    subtitle: "풀타임 · 리모트 · Next.js / TypeScript",
    dept: "Engineering",
    opacity: 1,
  },
  {
    title: "Enabler 파트너십 매니저",
    tag: "채용 중",
    tagType: "accent" as const,
    subtitle: "풀타임 · 리모트 · 한영 가능자",
    dept: "Partnership",
    opacity: 1,
  },
  {
    title: "B2B 세일즈 (기관 담당)",
    tag: "향후 채용",
    tagType: "muted" as const,
    subtitle: "풀타임 · 서울 또는 리모트",
    dept: "Sales",
    opacity: 1,
  },
  {
    title: "백엔드 엔지니어",
    tag: "향후 채용",
    tagType: "muted" as const,
    subtitle: "풀타임 · 리모트 · Supabase / Node.js",
    dept: "Engineering",
    opacity: 0.5,
  },
];

export default function CareersPage() {
  return (
    <>
      <main style={{ paddingTop: 56 }}>
        {/* Hero */}
        <section style={{ padding: "80px 0 56px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>채용</Eyebrow>
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
              Get It Done at Work와 함께{" "}
              <span style={{ color: "var(--color-accent)" }}>판을 바꿀</span>{" "}
              사람
            </h1>
            <p style={{ fontSize: 17, color: "var(--color-dim)", maxWidth: 560, lineHeight: 1.7 }}>
              한국 스타트업의 미국 진출이라는 어렵고 의미있는 문제를 함께 풀 팀원을 찾습니다.
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
            <Eyebrow>우리가 일하는 방식</Eyebrow>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              {cultureCards.map((card) => (
                <div
                  key={card.title}
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
                    {card.title}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.6 }}>
                    {card.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Job List */}
        <section style={{ padding: "80px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <Eyebrow>포지션</Eyebrow>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--color-text)",
                marginBottom: 32,
              }}
            >
              열려있는 포지션
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {jobs.map((job) => (
                <div
                  key={job.title}
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 14,
                    padding: "20px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    opacity: job.opacity,
                    cursor: "pointer",
                    transition: "border-color 0.2s, background 0.2s",
                    minWidth: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (job.opacity === 1) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(200,255,0,0.3)";
                      (e.currentTarget as HTMLDivElement).style.background = "var(--color-card-hover, oklch(0.18 0.006 280))";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
                    (e.currentTarget as HTMLDivElement).style.background = "var(--color-card)";
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
                        {job.title}
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
                        {job.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--color-dim)" }}>{job.subtitle}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 24 }}>
                    <span style={{ fontSize: 13, color: "var(--color-dim)" }}>{job.dept}</span>
                    <span style={{ fontSize: 18, color: "var(--color-dim)" }}>→</span>
                  </div>
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
                  원하는 포지션이 없나요?
                </div>
                <div style={{ fontSize: 14, color: "var(--color-dim)", lineHeight: 1.6 }}>
                  관심이 있다면 자유롭게 지원해 주세요. 언제나 특별한 사람을 환영합니다.
                </div>
              </div>
              <Link
                href="mailto:luke@xrx.studio"
                className="landing-btn-ghost"
                style={{ flexShrink: 0, whiteSpace: "nowrap" }}
              >
                지원 이메일 보내기 →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
