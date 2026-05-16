"use client";

import { useEffect, useState } from "react";
import { LaunchDashboard } from "./LaunchDashboard";

const EMAIL_KEY = "launch-dashboard-email";

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-black)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid var(--color-border)",
            borderTopColor: "var(--color-accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span
          style={{
            fontSize: "13px",
            color: "var(--color-dim)",
            fontFamily: "var(--font-display)",
          }}
        >
          Verifying session...
        </span>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Email Prompt ─────────────────────────────────────────────────────────────

interface EmailPromptProps {
  onAuthenticated: (email: string) => void;
}

function EmailPrompt({ onAuthenticated }: EmailPromptProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function submit() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/launch/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input.trim().toLowerCase() }),
      });

      if (res.ok) {
        const json = (await res.json()) as { ok: boolean; email: string };
        onAuthenticated(json.email);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-black)",
        padding: "24px",
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .shake-anim {
          animation: shake 0.5s ease-in-out;
        }
        .auth-input:focus {
          border-color: var(--color-accent) !important;
          outline: none;
        }
      `}</style>

      <div
        className={shake ? "shake-anim" : ""}
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "48px 40px",
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 24,
        }}
      >
        {/* Email icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "oklch(0.91 0.2 110 / 0.08)",
              border: "1px solid oklch(0.91 0.2 110 / 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="var(--color-accent)" strokeWidth="1.75" />
              <path
                d="M2 8l10 7 10-7"
                stroke="var(--color-accent)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--color-text)",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Launch Dashboard
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-dim)",
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          등록된 이메일을 입력하세요
          <br />
          Enter your registered email
        </p>

        {/* Email input */}
        <input
          className="auth-input"
          type="email"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toLowerCase());
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder="your.email@example.com"
          autoFocus
          autoComplete="email"
          style={{
            width: "100%",
            padding: "16px 20px",
            fontSize: "16px",
            backgroundColor: "var(--color-black)",
            border: `1px solid ${error ? "oklch(0.65 0.22 25)" : "var(--color-border)"}`,
            borderRadius: 12,
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />

        {/* Error message */}
        {error && (
          <div
            style={{
              color: "oklch(0.65 0.22 25)",
              fontSize: "13px",
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4v3.5M7 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            등록되지 않은 이메일입니다 · Email not authorized
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={() => void submit()}
          disabled={loading || !input.trim()}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "16px",
            backgroundColor: "var(--color-accent)",
            color: "oklch(0.1 0 0)",
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            border: "none",
            borderRadius: 12,
            fontSize: "16px",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
            transition: "opacity 0.2s",
            letterSpacing: "0.01em",
          }}
        >
          {loading ? "Verifying..." : "입장 · Enter"}
        </button>

        {/* Footer */}
        <p
          style={{
            fontSize: "12px",
            color: "oklch(0.52 0.01 280 / 0.5)",
            textAlign: "center",
            marginTop: 28,
            lineHeight: 1.6,
          }}
        >
          Korea Dev (luke/woosub/sson @xrx.studio) + 미국 파트너 전용
          <br />
          Korea Dev + US Partner only
        </p>
      </div>
    </div>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

export default function AuthGate() {
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(EMAIL_KEY);
    if (stored) {
      fetch("/api/launch/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: stored }),
      })
        .then((r) => {
          if (r.ok) {
            setEmail(stored);
          } else {
            localStorage.removeItem(EMAIL_KEY);
          }
          setChecked(true);
        })
        .catch(() => {
          setChecked(true);
        });
    } else {
      setChecked(true);
    }
  }, []);

  const handleAuthenticated = (normalizedEmail: string) => {
    localStorage.setItem(EMAIL_KEY, normalizedEmail);
    setEmail(normalizedEmail);
  };

  const handleLogout = () => {
    localStorage.removeItem(EMAIL_KEY);
    setEmail(null);
  };

  if (!checked) return <LoadingScreen />;

  if (!email) {
    return <EmailPrompt onAuthenticated={handleAuthenticated} />;
  }

  return <LaunchDashboard email={email} onLogout={handleLogout} />;
}
