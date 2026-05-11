"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

type PanelTab = "notes" | "actions" | "files";

interface ActionItem {
  id: number;
  text: string;
  done: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_NOTES = `[세션 노트 — 2026.03.25]

참석자: 넥스트페이 김태호 대표, Sarah Chen (Enabler)
주제: 미국 B2B SaaS GTM 전략 수립

■ 논의 사항
- Target ICP: Mid-market fintech companies (50-500 employees)
- 초기 진입 전략: Product-led growth + outbound combination
- 경쟁사 분석: Stripe, Plaid 에코시스템 내 포지셔닝

■ Sarah 추천사항
- LinkedIn Sales Navigator 활용한 아웃바운드 시퀀스
- 첫 3개월 파일럿 고객 5곳 확보 목표`;

const INITIAL_ACTIONS: ActionItem[] = [
  { id: 1, text: "ICP 정의 문서 작성", done: true },
  { id: 2, text: "타겟 기업 50곳 리스트업", done: false },
  { id: 3, text: "콜드 이메일 템플릿 작성", done: false },
  { id: 4, text: "LinkedIn 프로필 최적화", done: false },
];

const MOCK_FILES = [
  { name: "GTM_Strategy_v2.pdf", size: "1.2 MB", type: "pdf" },
  { name: "ICP_Definition.docx", size: "340 KB", type: "doc" },
  { name: "Competitor_Analysis.xlsx", size: "890 KB", type: "sheet" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ControlButton({
  label,
  icon,
  active = true,
  danger = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex flex-col items-center gap-1.5 group transition-transform duration-150 active:scale-95"
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: danger
            ? "var(--color-red)"
            : active
            ? "oklch(0.9 0.005 280 / 0.12)"
            : "oklch(0.9 0.005 280 / 0.06)",
          border: danger
            ? "1px solid oklch(0.63 0.2 25 / 0.4)"
            : active
            ? "1px solid oklch(0.9 0.005 280 / 0.2)"
            : "1px solid oklch(0.9 0.005 280 / 0.1)",
          transition: "background-color 0.15s, border-color 0.15s, opacity 0.15s",
          cursor: "pointer",
          color: danger
            ? "white"
            : active
            ? "var(--color-text)"
            : "var(--color-dim)",
          fontSize: "18px",
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          if (!danger) el.style.opacity = "0.75";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.opacity = "1";
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontSize: "12px",
          fontFamily: "var(--font-body)",
          color: active ? "var(--color-dim)" : "oklch(0.4 0.01 280)",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function TabButton({
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
      style={{
        flex: 1,
        padding: "8px 0",
        fontSize: "13px",
        fontFamily: "var(--font-display)",
        fontWeight: active ? 700 : 500,
        color: active ? "var(--color-text)" : "var(--color-dim)",
        backgroundColor: "transparent",
        border: "none",
        borderBottom: `2px solid ${active ? "var(--color-accent)" : "transparent"}`,
        cursor: "pointer",
        transition: "color 0.15s, border-color 0.15s",
        letterSpacing: "0.01em",
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "12px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-dim)",
        marginBottom: "8px",
      }}
    >
      {children}
    </p>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SessionPage() {
  const [activeTab, setActiveTab] = useState<PanelTab>("notes");
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [actions, setActions] = useState<ActionItem[]>(INITIAL_ACTIONS);
  const [aiToggle, setAiToggle] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [elapsed, setElapsed] = useState(32 * 60 + 15); // 32:15 start

  // Live timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleAction = useCallback((id: number) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    );
  }, []);

  const doneCount = actions.filter((a) => a.done).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-black)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Main layout — below 56px navbar */}
      <div
        style={{
          paddingTop: "56px",
          height: "100vh",
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT: VIDEO AREA ─────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            gap: "16px",
            overflow: "hidden",
          }}
        >
          {/* Session info bar */}
          <div
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-dim)",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-green)",
                    display: "inline-block",
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                라이브 세션
              </span>
              <span
                style={{
                  width: "1px",
                  height: "12px",
                  backgroundColor: "var(--color-border)",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-dim)",
                }}
              >
                미국 B2B SaaS GTM 전략 수립
              </span>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-dim)",
                letterSpacing: "0.04em",
              }}
            >
              2026.03.25
            </span>
          </div>

          {/* Video container — takes remaining space */}
          <div
            style={{
              flex: 1,
              position: "relative",
              borderRadius: "16px",
              backgroundColor: "var(--color-dark)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            {/* Subtle noise texture overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(ellipse 70% 60% at 50% 40%, oklch(0.2 0.01 280 / 0.6) 0%, transparent 100%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            {/* Center: Enabler avatar + name */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ zIndex: 2 }}
            >
              <div
                style={{
                  position: "relative",
                  marginBottom: "16px",
                }}
              >
                {/* Glow ring */}
                <div
                  style={{
                    position: "absolute",
                    inset: "-4px",
                    borderRadius: "50%",
                    background:
                      "conic-gradient(from 0deg, var(--color-accent), oklch(0.65 0.15 250), var(--color-accent))",
                    animation: "spin-slow 4s linear infinite",
                    opacity: 0.5,
                  }}
                />
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face"
                  alt="Sarah Chen"
                  width={140}
                  height={140}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid var(--color-dark)",
                    position: "relative",
                    zIndex: 1,
                    display: "block",
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: "18px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-text)",
                  marginBottom: "6px",
                  letterSpacing: "-0.01em",
                }}
              >
                Sarah Chen
              </p>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-green)",
                    display: "inline-block",
                    animation: "pulse-dot 1.5s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-body)",
                    color: "var(--color-dim)",
                    letterSpacing: "0.01em",
                  }}
                >
                  Speaking...
                </span>
              </div>
            </div>

            {/* Timer badge — top center */}
            <div
              className="absolute flex items-center gap-2"
              style={{
                top: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "9999px",
                padding: "5px 14px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-red)",
                  display: "inline-block",
                  animation: "pulse-dot 1s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  letterSpacing: "0.06em",
                  minWidth: "42px",
                  textAlign: "center",
                }}
              >
                {formatTime(elapsed)}
              </span>
              <span
                style={{
                  width: "1px",
                  height: "12px",
                  backgroundColor: "var(--color-border)",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  color: "var(--color-accent)",
                  letterSpacing: "0.01em",
                }}
              >
                2 Credits
              </span>
            </div>

            {/* Self PiP — bottom right */}
            <div
              style={{
                position: "absolute",
                bottom: "80px",
                right: "16px",
                zIndex: 10,
                width: "130px",
                borderRadius: "10px",
                overflow: "hidden",
                border: "2px solid var(--color-border)",
                backgroundColor: "oklch(0.12 0.005 280)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face"
                  alt="나"
                  fill
                  style={{ objectFit: "cover" }}
                />
                {/* PiP label */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "5px",
                    left: "6px",
                    fontSize: "10px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: "oklch(0 0 0 / 0.55)",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.02em",
                  }}
                >
                  나
                </div>
              </div>
            </div>

            {/* Controls bar — bottom */}
            <div
              className="absolute flex items-center justify-center gap-4"
              style={{
                bottom: "0",
                left: "0",
                right: "0",
                padding: "14px 20px 16px",
                background:
                  "linear-gradient(to top, oklch(0.14 0.005 280 / 0.95) 0%, transparent 100%)",
                zIndex: 10,
              }}
            >
              <ControlButton
                label="마이크"
                active={micOn}
                onClick={() => setMicOn((v) => !v)}
                icon={
                  micOn ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )
                }
              />
              <ControlButton
                label="카메라"
                active={cameraOn}
                onClick={() => setCameraOn((v) => !v)}
                icon={
                  cameraOn ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a2 2 0 1 1-2.83-2.83" />
                    </svg>
                  )
                }
              />
              <ControlButton
                label="화면 공유"
                active={screenOn}
                onClick={() => setScreenOn((v) => !v)}
                icon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                }
              />
              <ControlButton
                label="채팅"
                active={true}
                icon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                }
              />
              <ControlButton
                label="종료"
                danger={true}
                icon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.26 9.91a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.17 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.15 8.9" />
                    <line x1="23" y1="1" x2="1" y2="23" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: SESSION PANEL ──────────────────────────────────────────── */}
        <aside
          style={{
            width: "320px",
            minWidth: "320px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid var(--color-border)",
            backgroundColor: "var(--color-dark)",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "14px 16px 0",
              borderBottom: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-dim)",
                marginBottom: "10px",
              }}
            >
              세션 패널
            </p>
            {/* Tabs */}
            <div className="flex">
              <TabButton
                label="노트"
                active={activeTab === "notes"}
                onClick={() => setActiveTab("notes")}
              />
              <TabButton
                label="액션아이템"
                active={activeTab === "actions"}
                onClick={() => setActiveTab("actions")}
              />
              <TabButton
                label="파일"
                active={activeTab === "files"}
                onClick={() => setActiveTab("files")}
              />
            </div>
          </div>

          {/* Panel body — scrollable */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* ── NOTES TAB ── */}
            {activeTab === "notes" && (
              <>
                {/* AI toggle row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Toggle */}
                    <button
                      onClick={() => setAiToggle((v) => !v)}
                      role="switch"
                      aria-checked={aiToggle}
                      aria-label="AI 자동 요약 토글"
                      style={{
                        width: "36px",
                        height: "20px",
                        borderRadius: "9999px",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        backgroundColor: aiToggle
                          ? "var(--color-accent)"
                          : "var(--color-border)",
                        transition: "background-color 0.2s",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "2px",
                          left: aiToggle ? "18px" : "2px",
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: aiToggle
                            ? "oklch(0.1 0 0)"
                            : "oklch(0.6 0.01 280)",
                          transition: "left 0.2s var(--ease-out-expo)",
                          display: "block",
                        }}
                      />
                    </button>
                    <span
                      style={{
                        fontSize: "12px",
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        color: aiToggle ? "var(--color-text)" : "var(--color-dim)",
                        transition: "color 0.15s",
                      }}
                    >
                      AI 자동 요약
                    </span>
                  </div>

                  {/* Live save indicator */}
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-green)",
                        display: "inline-block",
                        animation: "pulse-dot 2s ease-in-out infinite",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        fontFamily: "var(--font-body)",
                        color: "var(--color-green)",
                        letterSpacing: "0.01em",
                      }}
                    >
                      실시간 저장 중
                    </span>
                  </div>
                </div>

                {/* Notes textarea */}
                <div>
                  <SectionLabel>노트</SectionLabel>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    spellCheck={false}
                    style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "var(--color-black)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text)",
                      lineHeight: 1.7,
                      resize: "vertical",
                      outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                        "oklch(0.91 0.2 110 / 0.4)";
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                        "var(--color-border)";
                    }}
                  />
                </div>

                {/* Action items section — inside Notes tab */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <SectionLabel>액션 아이템</SectionLabel>
                    <span
                      style={{
                        fontSize: "10px",
                        fontFamily: "var(--font-body)",
                        color: "var(--color-dim)",
                      }}
                    >
                      {doneCount}/{actions.length}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    {actions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleAction(item.id)}
                        className="flex items-center gap-2.5 text-left w-full group transition-opacity duration-150"
                        style={{
                          padding: "8px 10px",
                          borderRadius: "6px",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          opacity: item.done ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            "oklch(0.9 0.005 280 / 0.04)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            "transparent";
                        }}
                      >
                        {/* Checkbox */}
                        <span
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "4px",
                            border: `1.5px solid ${item.done ? "var(--color-accent)" : "var(--color-border)"}`,
                            backgroundColor: item.done
                              ? "var(--color-accent)"
                              : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition:
                              "background-color 0.15s, border-color 0.15s",
                          }}
                        >
                          {item.done && (
                            <svg
                              width="9"
                              height="9"
                              viewBox="0 0 10 10"
                              fill="none"
                              stroke="oklch(0.1 0 0)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                            </svg>
                          )}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontFamily: "var(--font-body)",
                            color: item.done
                              ? "var(--color-dim)"
                              : "var(--color-text)",
                            textDecoration: item.done ? "line-through" : "none",
                            lineHeight: 1.4,
                            transition: "color 0.15s, text-decoration 0.15s",
                          }}
                        >
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── ACTION ITEMS TAB ── */}
            {activeTab === "actions" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>액션 아이템</SectionLabel>
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      backgroundColor: "var(--color-accent-dim)",
                      padding: "1px 8px",
                      borderRadius: "9999px",
                      border: "1px solid oklch(0.91 0.2 110 / 0.2)",
                    }}
                  >
                    {doneCount}/{actions.length} 완료
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: "100%",
                    height: "3px",
                    backgroundColor: "var(--color-border)",
                    borderRadius: "9999px",
                    marginBottom: "16px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(doneCount / actions.length) * 100}%`,
                      backgroundColor: "var(--color-accent)",
                      borderRadius: "9999px",
                      transition: "width 0.4s var(--ease-out-expo)",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {actions.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => toggleAction(item.id)}
                      className="flex items-start gap-3 text-left w-full"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        backgroundColor: item.done
                          ? "oklch(0.9 0.005 280 / 0.03)"
                          : "var(--color-card)",
                        border: `1px solid ${item.done ? "var(--color-border)" : "var(--color-border)"}`,
                        cursor: "pointer",
                        transition: "background-color 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!item.done) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "oklch(0.91 0.2 110 / 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor =
                          "var(--color-border)";
                      }}
                    >
                      <span
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: `1.5px solid ${item.done ? "var(--color-accent)" : "var(--color-border)"}`,
                          backgroundColor: item.done
                            ? "var(--color-accent)"
                            : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "1px",
                          transition:
                            "background-color 0.15s, border-color 0.15s",
                        }}
                      >
                        {item.done && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            stroke="oklch(0.1 0 0)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                          </svg>
                        )}
                      </span>
                      <div>
                        <p
                          style={{
                            fontSize: "13px",
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            color: item.done
                              ? "var(--color-dim)"
                              : "var(--color-text)",
                            textDecoration: item.done ? "line-through" : "none",
                            lineHeight: 1.4,
                            transition: "color 0.15s",
                          }}
                        >
                          {item.text}
                        </p>
                        {item.done && (
                          <p
                            style={{
                              fontSize: "10px",
                              fontFamily: "var(--font-body)",
                              color: "var(--color-accent)",
                              marginTop: "2px",
                            }}
                          >
                            완료됨
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── FILES TAB ── */}
            {activeTab === "files" && (
              <div>
                <SectionLabel>세션 파일</SectionLabel>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {MOCK_FILES.map((file, i) => (
                    <div
                      key={file.name}
                      className="flex items-center gap-3"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "oklch(0.91 0.2 110 / 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "var(--color-border)";
                      }}
                    >
                      {/* File type icon */}
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          backgroundColor:
                            file.type === "pdf"
                              ? "oklch(0.63 0.2 25 / 0.15)"
                              : file.type === "sheet"
                              ? "oklch(0.72 0.19 155 / 0.15)"
                              : "oklch(0.65 0.15 250 / 0.15)",
                        }}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={
                            file.type === "pdf"
                              ? "var(--color-red)"
                              : file.type === "sheet"
                              ? "var(--color-green)"
                              : "var(--color-blue)"
                          }
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "12px",
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            color: "var(--color-text)",
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {file.name}
                        </p>
                        <p
                          style={{
                            fontSize: "10px",
                            fontFamily: "var(--font-body)",
                            color: "var(--color-dim)",
                            marginTop: "2px",
                          }}
                        >
                          {file.size}
                        </p>
                      </div>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--color-dim)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>
                  ))}
                </div>

                {/* Upload area */}
                <div
                  style={{
                    marginTop: "12px",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1.5px dashed var(--color-border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "oklch(0.91 0.2 110 / 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "var(--color-border)";
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-dim)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p
                    style={{
                      fontSize: "11px",
                      fontFamily: "var(--font-body)",
                      color: "var(--color-dim)",
                      textAlign: "center",
                    }}
                  >
                    파일을 드래그하거나 클릭하여 업로드
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Credit ticker — pinned to bottom ── */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--color-accent-dim)",
                border: "1px solid oklch(0.91 0.2 110 / 0.2)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "oklch(0.91 0.2 110 / 0.7)",
                    marginBottom: "2px",
                  }}
                >
                  사용 크레딧
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    style={{
                      fontSize: "28px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      color: "var(--color-accent)",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    2
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontFamily: "var(--font-body)",
                      color: "oklch(0.91 0.2 110 / 0.6)",
                    }}
                  >
                    / 세션
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-green)",
                      animation: "pulse-dot 2s ease-in-out infinite",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      color: "var(--color-green)",
                    }}
                  >
                    세션 진행중
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "oklch(0.91 0.2 110 / 0.55)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {formatTime(elapsed)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Keyframes for spinning ring effect */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
