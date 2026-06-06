"use client";

import Image from "next/image";

const OFFSETS = [
  { rotate: "-3deg", y: "0px", x: "0px", z: 30, scale: 1, delay: "0.3s" },
  { rotate: "1.5deg", y: "20px", x: "24px", z: 20, scale: 0.96, delay: "0.42s" },
  { rotate: "4deg", y: "38px", x: "44px", z: 10, scale: 0.92, delay: "0.54s" },
];

type HeroStackEnabler = {
  userId: string;
  fullName: string;
  avatarUrl: string;
  avatarInitial: string;
  university: string;
  degreeType: string;
  specialties: string[];
  rating: number;
  sessionCount: number;
  creditRate: number;
};

export default function HeroEnablerStack({ enablers }: { enablers: HeroStackEnabler[] }) {
  const cards = enablers.slice(0, 3);

  if (cards.length === 0) {
    return (
      <div className="relative w-full max-w-[340px] h-[220px] mx-auto lg:ml-auto">
        <div
          className="rounded-2xl p-6 h-full flex flex-col justify-between"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-accent)" }}>
              Verified Enablers
            </p>
            <h2 className="text-2xl font-black leading-tight" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
              New profiles are being reviewed
            </h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-dim)" }}>
            Approved experts appear here after their public profile and availability are ready.
          </p>
        </div>
      </div>
    );
  }

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
              {enabler.avatarUrl ? (
                <Image
                  src={enabler.avatarUrl}
                  alt={enabler.fullName}
                  width={100}
                  height={100}
                  priority={i === 0}
                  style={{ borderRadius: "9999px", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-full font-bold"
                  style={{
                    width: 100,
                    height: 100,
                    flexShrink: 0,
                    backgroundColor: "var(--color-dark)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-accent)",
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                  }}
                >
                  {enabler.avatarInitial}
                </div>
              )}
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
                  {enabler.rating > 0 ? enabler.rating.toFixed(1) : "New"}
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
                {enabler.sessionCount > 0 ? `${enabler.sessionCount}회 세션` : "신규 Enabler"}
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
