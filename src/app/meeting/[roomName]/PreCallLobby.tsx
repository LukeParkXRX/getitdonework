"use client";
import { useEffect, useState, useRef } from "react";

export interface BookingInfo {
  partnerName: string;
  scheduledAt: string;
  type: string;
  creditsAmount: number;
}

export function PreCallLobby({
  bookingInfo,
  onJoin,
}: {
  bookingInfo: BookingInfo;
  onJoin: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let s: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        s = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      })
      .catch((e: unknown) => {
        // 미디어 장치 에러 타입에 따른 한국어 안내 메시지
        if (e instanceof DOMException) {
          if (e.name === "NotAllowedError") {
            setError("카메라/마이크 접근이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.");
          } else if (e.name === "NotFoundError") {
            setError("카메라 또는 마이크가 감지되지 않습니다. 장치를 연결해주세요.");
          } else {
            setError("미디어 장치 접근에 실패했습니다.");
          }
        } else {
          setError("미디어 장치 접근에 실패했습니다.");
        }
      });
    return () => {
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function toggleVideo() {
    setVideoOn((v) => {
      stream?.getVideoTracks().forEach((t) => {
        t.enabled = !v;
      });
      return !v;
    });
  }

  function toggleAudio() {
    setAudioOn((a) => {
      stream?.getAudioTracks().forEach((t) => {
        t.enabled = !a;
      });
      return !a;
    });
  }

  function handleJoin() {
    stream?.getTracks().forEach((t) => t.stop());
    onJoin();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-black)",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 640,
          width: "100%",
          background: "var(--color-card)",
          borderRadius: 16,
          padding: 32,
          border: "1px solid var(--color-border)",
        }}
      >
        {/* booking 정보 */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {bookingInfo.type} · {bookingInfo.creditsAmount} 토큰
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginTop: 8,
              color: "var(--color-text)",
            }}
          >
            {bookingInfo.partnerName} 님과 세션
          </h1>
          <p
            style={{
              color: "var(--color-dim)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {new Date(bookingInfo.scheduledAt).toLocaleString("ko-KR")}
          </p>
        </div>

        {/* 카메라 미리보기 */}
        <div
          className="precall-video-preview"
          style={{
            aspectRatio: "16/9",
            background: "var(--color-dark)",
            borderRadius: 12,
            overflow: "hidden",
            position: "relative",
            marginBottom: 16,
            maxHeight: "50vh",
          }}
        >
          {error ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--color-red)",
                padding: 24,
                textAlign: "center",
                fontSize: 14,
              }}
            >
              카메라/마이크 권한이 필요합니다: {error}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
          )}
          {!videoOn && stream && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--color-black)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-dim)",
                fontSize: 14,
              }}
            >
              카메라 꺼짐
            </div>
          )}
        </div>

        {/* 컨트롤 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <button
            onClick={toggleAudio}
            style={{
              padding: "10px 16px",
              background: audioOn ? "var(--color-card)" : "var(--color-red)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            🎤 마이크 {audioOn ? "ON" : "OFF"}
          </button>
          <button
            onClick={toggleVideo}
            style={{
              padding: "10px 16px",
              background: videoOn ? "var(--color-card)" : "var(--color-red)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            📹 카메라 {videoOn ? "ON" : "OFF"}
          </button>
        </div>

        {/* 입장 버튼 */}
        <button
          className="precall-join-btn"
          onClick={handleJoin}
          style={{
            width: "100%",
            padding: "16px",
            background: "var(--color-accent)",
            color: "var(--color-black)",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          지금 입장하기
        </button>

        <p
          style={{
            textAlign: "center",
            color: "var(--color-dim)",
            fontSize: 12,
            marginTop: 16,
          }}
        >
          입장 시 양쪽이 모두 들어오면 세션이 시작됩니다. 5분 미만 종료 시 토큰 환불됩니다.
        </p>
      </div>

      {/* 모바일 반응형: 버튼 확대 + 비디오 영역 높이 제한 */}
      <style>{`
        @media (max-width: 480px) {
          .precall-video-preview {
            max-height: 40vh;
          }
          .precall-join-btn {
            padding: 18px !important;
            font-size: 17px !important;
          }
        }
      `}</style>
    </div>
  );
}
