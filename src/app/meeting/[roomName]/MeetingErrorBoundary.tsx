// 이 파일의 역할: LiveKit 화상회의 컴포넌트의 에러를 포착하여 사용자 친화적 UI 제공
"use client";

import React from "react";

interface MeetingErrorBoundaryProps {
  children: React.ReactNode;
  bookingId?: string | null;
}

interface MeetingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * LiveKit 컴포넌트 내부에서 발생하는 런타임 에러를 포착하여
 * 흰 화면(white screen) 대신 재시도/내 예약 보기 버튼이 있는
 * 사용자 친화적 에러 화면을 표시합니다.
 */
export class MeetingErrorBoundary extends React.Component<
  MeetingErrorBoundaryProps,
  MeetingErrorBoundaryState
> {
  constructor(props: MeetingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): MeetingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 프로덕션에서 에러 로깅 서비스로 전송 가능
    console.error("[MeetingErrorBoundary] 화상회의 컴포넌트 에러:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
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
              maxWidth: 420,
              width: "100%",
              textAlign: "center",
            }}
          >
            {/* 에러 아이콘 */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: "oklch(0.63 0.2 25 / 0.1)",
                marginBottom: 20,
              }}
            >
              <svg
                width="32"
                height="32"
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

            {/* 에러 메시지 */}
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--color-text)",
                fontFamily: "var(--font-display)",
                marginBottom: 8,
              }}
            >
              문제가 발생했습니다
            </h2>
            <p
              style={{
                color: "var(--color-dim)",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              화상회의 중 예기치 않은 오류가 발생했습니다.
              <br />
              재시도하거나, 문제가 지속되면 예약 페이지로 이동해주세요.
            </p>

            {/* 액션 버튼 */}
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={this.handleRetry}
                style={{
                  padding: "12px 28px",
                  background: "var(--color-accent)",
                  color: "var(--color-black)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                }}
              >
                재시도
              </button>
              <a
                href="/bookings"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "12px 28px",
                  background: "var(--color-card)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                내 예약 보기
              </a>
            </div>

            {/* 개발자용 에러 디테일 (개발 환경에서만 표시) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details
                style={{
                  marginTop: 32,
                  textAlign: "left",
                  padding: 16,
                  background: "var(--color-dark)",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                }}
              >
                <summary
                  style={{
                    color: "var(--color-dim)",
                    fontSize: 12,
                    cursor: "pointer",
                    marginBottom: 8,
                  }}
                >
                  개발자 정보 (디버그)
                </summary>
                <pre
                  style={{
                    color: "var(--color-red)",
                    fontSize: 11,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    margin: 0,
                  }}
                >
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
