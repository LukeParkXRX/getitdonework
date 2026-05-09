import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

function AuthLeftPanel() {
  return (
    <div
      className="auth-left-panel"
      style={{
        flex: 1,
        position: "relative",
        backgroundColor: "var(--color-dark)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 56px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 90% 70% at 35% 45%, oklch(0.2 0.008 280 / 0.6) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          left: "-60px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, oklch(0.91 0.2 110 / 0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Logo */}
      <div style={{ position: "relative", zIndex: 1, animation: "var(--animate-fade-in)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "oklch(0.1 0 0)" }}>
              <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--color-text)", letterSpacing: "-0.02em" }}>
            Get It Done
          </span>
        </div>
      </div>

      {/* Pull-quote */}
      <div style={{ position: "relative", zIndex: 1, animation: "var(--animate-slide-up)", animationDelay: "0.1s" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "120px",
            lineHeight: 0.8,
            color: "oklch(0.91 0.2 110 / 0.12)",
            marginBottom: "8px",
            marginLeft: "-8px",
            userSelect: "none",
          }}
        >
          &ldquo;
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "28px",
            lineHeight: 1.35,
            color: "var(--color-text)",
            letterSpacing: "-0.025em",
            marginBottom: "20px",
          }}
        >
          Get It Done at Work는 단순한 멘토링이 아닙니다.
          <br />
          실제{" "}
          <span style={{ color: "var(--color-accent)", position: "relative", display: "inline-block" }}>
            실행
            <span
              style={{
                position: "absolute",
                bottom: "-2px",
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "var(--color-accent)",
                borderRadius: "2px",
                opacity: 0.5,
              }}
            />
          </span>
          을 대신해주는
          <br />
          미국 현지 파트너입니다.
        </h2>
        <p style={{ fontSize: "14px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.7, maxWidth: "360px" }}>
          탑-티어 MBA 학생과 직접 연결되어, 시장 조사부터 파트너십 체결까지 현지에서 직접 실행합니다.
        </p>
      </div>

      {/* Testimonial */}
      <div style={{ position: "relative", zIndex: 1, animation: "var(--animate-slide-up)", animationDelay: "0.2s" }}>
        <div style={{ width: "40px", height: "1px", backgroundColor: "oklch(0.91 0.2 110 / 0.4)", marginBottom: "20px" }} />
        <div
          style={{
            backgroundColor: "oklch(0.18 0.006 280 / 0.7)",
            border: "1px solid oklch(0.24 0.008 280 / 0.8)",
            borderRadius: "var(--radius-xl)",
            padding: "20px 22px",
            backdropFilter: "blur(8px)",
          }}
        >
          <p style={{ fontSize: "13px", fontFamily: "var(--font-body)", fontStyle: "italic", color: "oklch(0.75 0.005 280)", lineHeight: 1.65, marginBottom: "16px" }}>
            &ldquo;Get It Done 덕분에 Wharton MBA 파트너와 3주 만에 파일럿 계약을 체결했습니다. 혼자였다면 6개월은 걸렸을 일입니다.&rdquo;
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "var(--color-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "12px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "oklch(0.1 0 0)",
              }}
            >
              김
            </div>
            <div>
              <p style={{ fontSize: "13px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", lineHeight: 1.3 }}>김재원</p>
              <p style={{ fontSize: "11px", fontFamily: "var(--font-body)", color: "var(--color-dim)", lineHeight: 1.3 }}>CEO · Nexlayer AI</p>
            </div>
            <div style={{ marginLeft: "auto", color: "var(--color-gold)", fontSize: "12px", letterSpacing: "1px" }}>★★★★★</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .auth-left-panel { display: none !important; }
          .auth-outer { flex-direction: column !important; }
        }
      `}</style>

      <div
        className="auth-outer"
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-black)",
        }}
      >
        <AuthLeftPanel />

        <div
          style={{
            flex: 1,
            backgroundColor: "var(--color-card)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 56px",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, oklch(0.65 0.15 250 / 0.05) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              margin: "0 auto",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
