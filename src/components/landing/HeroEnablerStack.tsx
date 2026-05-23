"use client";

import Image from "next/image";
import { ENABLERS } from "@/lib/constants/mock-data";

const OFFSETS = [
  { rotate: "-3deg", y: "0px", x: "0px", z: 30, scale: 1, delay: "0.3s" },
  { rotate: "1.5deg", y: "20px", x: "24px", z: 20, scale: 0.96, delay: "0.42s" },
  { rotate: "4deg", y: "38px", x: "44px", z: 10, scale: 0.92, delay: "0.54s" },
];

export default function HeroEnablerStack() {
  const cards = ENABLERS.slice(0, 3);

  return (
    <div className="relative w-full max-w-[340px] h-[260px] mx-auto lg:ml-auto">
      {cards.map((enabler, i) => (
        <div
          key={enabler.userId}
          className="absolute w-full"
          style={{
            transform: `rotate(${OFFSETS[i].rotate}) translateY(${OFFSETS[i].y}) translateX(${OFFSETS[i].x}) scale(${OFFSETS[i].scale})`,
            zIndex: OFFSETS[i].z,
            top: 0,
            left: 0,
          }}
        >
          <div
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {/* Avatar + name row */}
            <div className="flex items-center gap-3">
              <Image
                src={enabler.avatarUrl}
                alt={enabler.fullName}
                width={100}
                height={100}
                priority={i === 0}
                style={{ borderRadius: "9999px", objectFit: "cover", flexShrink: 0 }}
              />
              <div className="min-w-0 flex-1">
                <div
                  style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-display)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {enabler.fullName}
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-dim)" }}>
                  {enabler.university} · {enabler.degreeType}
                </div>
              </div>
              {/* Rating */}
              <div className="flex items-center gap-1 shrink-0">
                <span style={{ color: "var(--color-accent)" }}>★</span>
                <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                  {enabler.rating}
                </span>
              </div>
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1.5">
              {enabler.specialties.slice(0, 2).map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "oklch(0.91 0.2 110 / 0.1)",
                    color: "var(--color-accent)",
                    border: "1px solid oklch(0.91 0.2 110 / 0.2)",
                  }}
                >
                  {s}
                </span>
              ))}
              {enabler.specialties.length > 2 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "var(--color-border)",
                    color: "var(--color-dim)",
                  }}
                >
                  +{enabler.specialties.length - 2}
                </span>
              )}
            </div>

            {/* Bottom meta */}
            <div
              className="flex items-center justify-between pt-1"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <span className="text-sm" style={{ color: "var(--color-dim)" }}>
                {enabler.sessionCount}회 세션
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--color-accent)" }}>
                {enabler.creditRate}크레딧 / 세션
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
