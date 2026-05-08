"use client";

// 개발·스테이징 전용 퀵로그인 패널.
// 운영(production) 환경에서는 자동 비활성화.
// super_admin은 localStorage "__admin_test_mode"="on" 으로 운영에서도 활성화 가능.
const TEST_PASSWORD = "Test!GetItDone2026";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TestAccount {
  label: string;
  email: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  { label: "Super Admin", email: "test.superadmin.01@getitdonework.test" },
  { label: "Org Admin — Test Sandbox", email: "test.orgadmin.01@getitdonework.test" },
  { label: "Startup 01 — B2B SaaS", email: "test.startup.01@getitdonework.test" },
  { label: "Startup 02 — Fintech", email: "test.startup.02@getitdonework.test" },
  { label: "Startup 03 — Healthcare", email: "test.startup.03@getitdonework.test" },
  { label: "Enabler 01 — SaaS (approved)", email: "test.enabler.01@getitdonework.test" },
  { label: "Enabler 02 — Fintech (approved)", email: "test.enabler.02@getitdonework.test" },
  { label: "Enabler 03 — Healthcare (approved)", email: "test.enabler.03@getitdonework.test" },
  { label: "Enabler 04 — AI (pending)", email: "test.enabler.04@getitdonework.test" },
];

export default function TestLoginPanel() {
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isProd =
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ||
      process.env.NODE_ENV === "production";
    const flagOn = process.env.NEXT_PUBLIC_SHOW_TEST_DATA === "true";
    const adminOverride =
      typeof window !== "undefined" &&
      localStorage.getItem("__admin_test_mode") === "on";

    if (isProd && !adminOverride) {
      setVisible(false);
      return;
    }
    if (!isProd && !flagOn && !adminOverride) {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  async function handleTestLogin(email: string) {
    setLoadingEmail(email);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: TEST_PASSWORD,
    });

    if (authError) {
      console.error("[TestLoginPanel] 로그인 실패:", authError);
      setError(`로그인 실패: ${authError.message}`);
      setLoadingEmail(null);
      return;
    }

    router.refresh();
    router.push("/");
  }

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "20px",
        borderRadius: "var(--radius-lg)",
        border: "1px dashed var(--color-border)",
        backgroundColor: "oklch(0.13 0.005 280 / 0.6)",
      }}
    >
      {/* 헤더 */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "4px",
            backgroundColor: "oklch(0.55 0.15 60 / 0.15)",
            border: "1px solid oklch(0.55 0.15 60 / 0.35)",
            fontSize: "11px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "oklch(0.75 0.12 80)",
            letterSpacing: "0.06em",
            marginBottom: "8px",
          }}
        >
          TEST MODE
        </div>
        <p
          style={{
            fontSize: "12px",
            fontFamily: "var(--font-body)",
            color: "var(--color-dim)",
            lineHeight: 1.5,
          }}
        >
          개발자 전용 퀵로그인 &mdash; 테스트 계정으로 즉시 로그인
        </p>
      </div>

      {/* 계정 버튼 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {TEST_ACCOUNTS.map((account) => {
          const isLoading = loadingEmail === account.email;
          const isDisabled = loadingEmail !== null;

          return (
            <button
              key={account.email}
              type="button"
              onClick={() => handleTestLogin(account.email)}
              disabled={isDisabled}
              style={{
                width: "100%",
                padding: "9px 14px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "transparent",
                border: "1px solid oklch(0.24 0.008 280 / 0.7)",
                color: isDisabled ? "var(--color-dim)" : "var(--color-text)",
                fontSize: "13px",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                cursor: isDisabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                transition: "border-color 0.12s ease, background-color 0.12s ease",
                opacity: isDisabled && !isLoading ? 0.5 : 1,
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(0.38 0.01 280)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "oklch(0.18 0.006 280 / 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(0.24 0.008 280 / 0.7)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }
              }}
            >
              <span>{isLoading ? "로그인 중..." : account.label}</span>
              {!isLoading && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "oklch(0.45 0.005 280)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 400,
                    flexShrink: 0,
                  }}
                >
                  {account.email}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 에러 메시지 */}
      {error !== null && (
        <p
          style={{
            marginTop: "12px",
            fontSize: "12px",
            fontFamily: "var(--font-body)",
            color: "oklch(0.65 0.18 25)",
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
