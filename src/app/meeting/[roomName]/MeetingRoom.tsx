// 이 파일의 역할: LiveKit 기반 화상회의 메인 컴포넌트 — 로비→연결→세션 흐름 관리
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { DisconnectReason } from "livekit-client";
import "@livekit/components-styles";
import { PreCallLobby } from "./PreCallLobby";
import { MeetingErrorBoundary } from "./MeetingErrorBoundary";
import type { BookingInfo } from "./PreCallLobby";

interface ConnectionDetails {
  serverUrl: string;
  participantToken: string;
  roomName: string;
  participantName: string;
}

interface MeetingRoomProps {
  roomName: string;
  participantName: string;
  bookingId: string | null;
  bookingInfo: BookingInfo | null;
}

// ── 재연결 관련 상수 ─────────────────────────────────────
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_INTERVAL_MS = 2000;

// ── 세션 경과 시간 표시 ──────────────────────────────────
function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return <span>{mm}:{ss}</span>;
}

// ── 세션 헤더 ────────────────────────────────────────────
function SessionHeader({
  bookingInfo,
  startedAt,
  onEndSession,
}: {
  bookingInfo: BookingInfo;
  startedAt: number;
  onEndSession: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const scheduledEnd = new Date(
    new Date(bookingInfo.scheduledAt).getTime() + 60 * 60 * 1000
  ).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  function handleEndClick() {
    setConfirming(true);
  }

  function handleConfirm() {
    onEndSession();
  }

  function handleCancel() {
    setConfirming(false);
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          backgroundColor: "var(--color-dark)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        {/* 좌측: 경과 시간 */}
        <div style={{ fontSize: 13, color: "var(--color-dim)", display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "var(--color-green, #4caf50)",
              animation: "pulse 2s infinite",
            }}
          />
          세션 진행 중 · <ElapsedTimer startedAt={startedAt} />
        </div>

        {/* 우측: 예정 종료 + 종료 버튼 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--color-dim)" }}>
            예정 종료 {scheduledEnd}
          </span>
          <button
            onClick={handleEndClick}
            style={{
              padding: "6px 14px",
              background: "var(--color-red)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            종료
          </button>
        </div>
      </div>

      {/* 종료 확인 다이얼로그 */}
      {confirming && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              padding: 32,
              maxWidth: 400,
              width: "90%",
              textAlign: "center",
            }}
          >
            <h3 style={{ color: "var(--color-text)", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
              세션을 종료하시겠습니까?
            </h3>
            <p style={{ color: "var(--color-dim)", fontSize: 14, marginBottom: 24 }}>
              토큰은 세션 길이에 따라 자동 정산됩니다.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: "10px 24px",
                  background: "var(--color-card)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: "10px 24px",
                  background: "var(--color-red)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── RoomDisconnector: LiveKitRoom 내부에서 disconnect 요청을 받아 실행 ──
function RoomDisconnector({ shouldDisconnect }: { shouldDisconnect: boolean }) {
  const room = useRoomContext();
  useEffect(() => {
    if (shouldDisconnect) {
      room.disconnect();
    }
  }, [shouldDisconnect, room]);
  return null;
}

// ── 재연결 중 상태 표시 UI ────────────────────────────────
function ReconnectingOverlay({ attempt, maxAttempts }: { attempt: number; maxAttempts: number }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid var(--color-accent, #ffd700)",
            borderTopColor: "transparent",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <h3
          style={{
            color: "var(--color-text, #fff)",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          연결 복구 중...
        </h3>
        <p
          style={{
            color: "var(--color-dim, #999)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          네트워크 연결을 복구하고 있습니다. ({attempt}/{maxAttempts})
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────
export function MeetingRoom({ roomName, participantName, bookingId, bookingInfo }: MeetingRoomProps) {
  const [stage, setStage] = useState<"lobby" | "joined">("lobby");
  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartedAt] = useState(() => Date.now());
  const [shouldDisconnect, setShouldDisconnect] = useState(false);

  // 재연결 상태 관리
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/livekit?roomName=${encodeURIComponent(roomName)}&participantName=${encodeURIComponent(participantName)}`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "연결에 실패했습니다.");
        return;
      }
      const data: ConnectionDetails = await res.json();
      setConnection(data);
    } catch {
      setError("서버에 연결할 수 없습니다.");
    }
  }, [roomName, participantName]);

  // lobby → joined 전환 시 토큰 fetch
  useEffect(() => {
    if (stage === "joined") {
      fetchToken();
    }
  }, [stage, fetchToken]);

  // 재연결 시도 함수
  const attemptReconnect = useCallback(async (currentAttempt: number) => {
    if (currentAttempt > MAX_RECONNECT_ATTEMPTS) {
      // 모든 재연결 시도 실패 → session-ended로 이동
      setIsReconnecting(false);
      const dest = bookingId
        ? `/meeting/session-ended?bookingId=${bookingId}`
        : `/meeting/session-ended`;
      window.location.href = dest;
      return;
    }

    setReconnectAttempt(currentAttempt);
    setIsReconnecting(true);

    try {
      // 새 토큰을 받아서 재연결 시도
      const res = await fetch(
        `/api/livekit?roomName=${encodeURIComponent(roomName)}&participantName=${encodeURIComponent(participantName)}`
      );
      if (res.ok) {
        const data: ConnectionDetails = await res.json();
        setConnection(data);
        setIsReconnecting(false);
        setReconnectAttempt(0);
        return;
      }
    } catch {
      // 네트워크 에러 — 다음 시도로 이동
    }

    // 다음 재연결 시도 예약 (2초 후)
    reconnectTimerRef.current = setTimeout(() => {
      attemptReconnect(currentAttempt + 1);
    }, RECONNECT_INTERVAL_MS);
  }, [bookingId, roomName, participantName]);

  const handleDisconnected = useCallback((reason?: DisconnectReason) => {
    // 사용자/서버 의도적 종료 시에는 재연결 시도하지 않음
    // CLIENT_INITIATED(0): 사용자가 직접 종료
    // PARTICIPANT_REMOVED(2): 서버가 참가자 제거
    // ROOM_DELETED(3): 방이 삭제됨
    const intentionalReasons: DisconnectReason[] = [
      DisconnectReason.CLIENT_INITIATED,
      DisconnectReason.PARTICIPANT_REMOVED,
      DisconnectReason.ROOM_DELETED,
    ];

    if (reason !== undefined && intentionalReasons.includes(reason)) {
      // 의도적 종료 → 세션 종료 페이지로 이동
      const dest = bookingId
        ? `/meeting/session-ended?bookingId=${bookingId}`
        : `/meeting/session-ended`;
      window.location.href = dest;
      return;
    }

    // 비의도적 끊김 (네트워크 등) → 재연결 시도
    attemptReconnect(1);
  }, [bookingId, attemptReconnect]);

  const handleEndSession = useCallback(() => {
    setShouldDisconnect(true);
  }, []);

  // ── 로비 단계 ──
  if (stage === "lobby") {
    const info = bookingInfo ?? {
      partnerName: "상대방",
      scheduledAt: new Date().toISOString(),
      type: "세션",
      creditsAmount: 0,
    };
    return <PreCallLobby bookingInfo={info} onJoin={() => setStage("joined")} />;
  }

  // ── 에러 ──
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-black)" }}
      >
        <div className="text-center space-y-4 max-w-sm px-5">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ backgroundColor: "oklch(0.63 0.2 25 / 0.1)" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-red)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}
          >
            연결 실패
          </h2>
          <p className="text-sm" style={{ color: "var(--color-dim)" }}>
            {error}
          </p>
          <a
            href="/bookings"
            className="inline-block mt-2 px-6 py-2.5 rounded-xl text-sm font-bold"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "oklch(0.1 0 0)",
              fontFamily: "var(--font-display)",
            }}
          >
            내 예약 보기
          </a>
        </div>
      </div>
    );
  }

  // ── 로딩 ──
  if (!connection) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-black)" }}
      >
        <div className="text-center space-y-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto"
            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--color-dim)" }}>
            미팅에 연결하는 중...
          </p>
        </div>
      </div>
    );
  }

  // ── 미팅룸 (ErrorBoundary로 감싸기) ──
  return (
    <MeetingErrorBoundary bookingId={bookingId}>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-black)" }}>
        {bookingInfo && (
          <SessionHeader
            bookingInfo={bookingInfo}
            startedAt={sessionStartedAt}
            onEndSession={handleEndSession}
          />
        )}

        {/* 재연결 중 오버레이 */}
        {isReconnecting && (
          <ReconnectingOverlay
            attempt={reconnectAttempt}
            maxAttempts={MAX_RECONNECT_ATTEMPTS}
          />
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          <LiveKitRoom
            token={connection.participantToken}
            serverUrl={connection.serverUrl}
            video={true}
            audio={true}
            onDisconnected={handleDisconnected}
            style={{ height: "100%" }}
            data-lk-theme="default"
          >
            <RoomDisconnector shouldDisconnect={shouldDisconnect} />
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </div>
    </MeetingErrorBoundary>
  );
}
