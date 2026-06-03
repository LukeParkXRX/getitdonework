import { Suspense } from "react";
import SignupForm from "./SignupForm";
import AuthLeftPanel from "../_components/AuthLeftPanel";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; role?: string }>;
}) {
  const { role } = await searchParams;

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
        <AuthLeftPanel variant={role === "enabler" ? "enabler" : "default"} />

        {/* RIGHT HALF shell */}
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
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
