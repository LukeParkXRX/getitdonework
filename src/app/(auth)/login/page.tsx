import { Suspense } from "react";
import LoginForm from "./LoginForm";
import AuthLeftPanel from "../_components/AuthLeftPanel";

// ══════════════════════════════════════════════════════
// SERVER PAGE — no "use client"
// ══════════════════════════════════════════════════════
export default function LoginPage() {
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

        {/* ── RIGHT HALF shell — static wrapper ── */}
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
          {/* Subtle top-right glow */}
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
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
