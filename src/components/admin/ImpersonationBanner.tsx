"use client";

import { useEffect, useState, useCallback } from "react";

type ImpersonationStatus =
  | { active: false }
  | {
      active: true;
      targetName: string;
      targetEmail: string;
      expiresAt: number;
    };

function formatRemaining(ms: number): string {
  if (ms <= 0) return "만료됨";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${String(sec).padStart(2, "0")}s`;
}

export function ImpersonationBanner() {
  const [status, setStatus] = useState<ImpersonationStatus | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [ending, setEnding] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/impersonate", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ImpersonationStatus;
      setStatus(data);
      if (data.active) {
        setRemaining(data.expiresAt - Date.now());
      }
    } catch {
      // 네트워크 오류 시 배너 숨김
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 남은 시간 카운트다운
  useEffect(() => {
    if (!status?.active) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          // 만료 → 상태 갱신
          fetchStatus();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status?.active, fetchStatus]);

  async function handleEnd() {
    setEnding(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
    } finally {
      window.location.reload();
    }
  }

  if (!status?.active) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "oklch(0.35 0.18 20)",
        borderBottom: "1px solid oklch(0.55 0.22 20)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "8px 20px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "oklch(0.96 0.04 20)",
          fontFamily: "var(--font-body)",
          letterSpacing: "0.01em",
        }}
      >
        ⚠ Impersonating:{" "}
        <span style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
          {status.targetName}
        </span>{" "}
        &lt;{status.targetEmail}&gt;
      </span>

      <span
        style={{
          fontSize: 12,
          color: "oklch(0.75 0.1 20)",
          fontFamily: "var(--font-mono)",
          background: "oklch(0.25 0.12 20 / 0.5)",
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid oklch(0.5 0.15 20 / 0.4)",
        }}
      >
        {formatRemaining(remaining)} 남음
      </span>

      <span
        style={{
          fontSize: 12,
          color: "oklch(0.75 0.1 20)",
          fontFamily: "var(--font-body)",
        }}
      >
        결제·삭제·2FA 차단됨
      </span>

      <button
        onClick={handleEnd}
        disabled={ending}
        style={{
          padding: "4px 14px",
          borderRadius: 6,
          border: "1px solid oklch(0.7 0.15 20)",
          background: ending ? "oklch(0.3 0.12 20)" : "oklch(0.28 0.15 20 / 0.6)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "var(--font-body)",
          cursor: ending ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!ending) {
            (e.currentTarget as HTMLButtonElement).style.background =
              "oklch(0.45 0.2 20)";
          }
        }}
        onMouseLeave={(e) => {
          if (!ending) {
            (e.currentTarget as HTMLButtonElement).style.background =
              "oklch(0.28 0.15 20 / 0.6)";
          }
        }}
      >
        {ending ? "종료 중..." : "⏹ 종료"}
      </button>
    </div>
  );
}
