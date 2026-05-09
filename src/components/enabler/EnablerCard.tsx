"use client";

import Link from "next/link";
import type { EnablerProfile } from "@/types";

type EnablerWithMeta = EnablerProfile & {
  fullName: string;
  avatarInitial: string;
  avatarUrl: string;
};

const BADGE_LABELS: Record<string, string> = {
  top_rated: "Top Rated",
  verified: "Verified",
  rising_star: "Rising Star",
};

export default function EnablerCard({
  enabler,
  delay = 0,
}: {
  enabler: EnablerWithMeta;
  delay?: number;
}) {
  return (
    <div
      className="group rounded-2xl p-6 flex flex-col gap-5 transition-colors duration-300"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={enabler.avatarUrl}
          alt={enabler.fullName}
          style={{ width: "140px", height: "140px", borderRadius: "9999px", objectFit: "cover", flexShrink: 0 }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-display)" }}
            >
              {enabler.fullName}
            </h3>
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{
                backgroundColor: "oklch(0.91 0.2 110 / 0.12)",
                color: "var(--color-accent)",
                border: "1px solid oklch(0.91 0.2 110 / 0.25)",
              }}
            >
              {BADGE_LABELS[enabler.badgeLevel]}
            </span>
          </div>
          <p style={{ fontSize: "14px", fontWeight: 500, marginTop: "2px", color: "var(--color-dim)" }}>
            {enabler.university} · {enabler.degreeType}
          </p>
        </div>
      </div>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1.5">
        {enabler.specialties.map((s) => (
          <span
            key={s}
            className="rounded-full"
            style={{
              fontSize: "13px",
              padding: "6px 12px",
              backgroundColor: "oklch(0.18 0.006 280)",
              color: "var(--color-dim)",
              border: "1px solid var(--color-border)",
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 gap-2 pt-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        {[
          {
            value: enabler.rating > 0 ? `★ ${enabler.rating}` : "신규",
            label: "평점",
            accent: true,
          },
          {
            value: enabler.sessionCount > 0 ? `${enabler.sessionCount}+` : "—",
            label: "세션",
            accent: false,
          },
          {
            value: enabler.reRequestRate > 0 ? `${enabler.reRequestRate}%` : "—",
            label: "재요청",
            accent: false,
          },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                color: stat.accent ? "var(--color-accent)" : "var(--color-text)",
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: "15px", marginTop: "2px", color: "var(--color-dim)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: "16px", color: "var(--color-dim)" }}>
          {enabler.creditRate}크레딧 / 세션
        </span>
        <Link
          href={`/enablers/${enabler.userId}`}
          className="rounded-lg transition-opacity duration-200 hover:opacity-85"
          style={{
            fontSize: "14px",
            fontWeight: 700,
            padding: "8px 16px",
            backgroundColor: "var(--color-accent)",
            color: "oklch(0.1 0 0)",
          }}
        >
          예약하기
        </Link>
      </div>
    </div>
  );
}
