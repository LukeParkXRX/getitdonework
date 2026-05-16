/**
 * Production Readiness Audit Script
 * 실행: bun run scripts/audit-prod-readiness.ts
 *
 * prod 배포 전 필수 항목 자동 점검. 오류 항목이 있으면 exit code 1 반환.
 */

import { createClient } from "@supabase/supabase-js";

// ─── 환경 변수 ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "오류: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── 결과 추적 ──────────────────────────────────────────────────────────────

type Status = "pass" | "warn" | "fail";

interface CheckResult {
  category: string;
  label: string;
  status: Status;
  detail: string;
}

const results: CheckResult[] = [];

function pass(category: string, label: string, detail: string) {
  results.push({ category, label, status: "pass", detail });
}

function warn(category: string, label: string, detail: string) {
  results.push({ category, label, status: "warn", detail });
}

function fail(category: string, label: string, detail: string) {
  results.push({ category, label, status: "fail", detail });
}

// ─── 점검 함수들 ─────────────────────────────────────────────────────────────

async function checkTestData() {
  const tables = [
    "users",
    "organizations",
    "bookings",
    "reviews",
  ] as const;

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("is_test", true);

    if (error) {
      // is_test 컬럼이 없는 테이블은 경고 없이 스킵
      if (error.message.includes("column") && error.message.includes("is_test")) {
        continue;
      }
      warn("테스트 데이터", `${table}.is_test 조회`, `오류: ${error.message}`);
      continue;
    }

    if (count && count > 0) {
      fail("테스트 데이터", `${table} is_test 레코드`, `${count}건 남아있음 — bun run seed:clear 실행`);
    } else {
      pass("테스트 데이터", `${table} is_test 레코드`, "없음");
    }
  }
}

function checkEnvFlags() {
  // NEXT_PUBLIC_SHOW_TEST_DATA
  const showTestData = process.env.NEXT_PUBLIC_SHOW_TEST_DATA;
  if (showTestData === "true") {
    fail("환경 변수", "NEXT_PUBLIC_SHOW_TEST_DATA", `현재 "true" — prod에서 반드시 false 또는 미설정`);
  } else {
    pass("환경 변수", "NEXT_PUBLIC_SHOW_TEST_DATA", `"${showTestData ?? "미설정"}" (OK)`);
  }

  // STRIPE_SECRET_KEY — sk_live_ 로 시작해야 prod
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  if (!stripeKey) {
    fail("환경 변수", "STRIPE_SECRET_KEY", "미설정");
  } else if (stripeKey.startsWith("sk_live_")) {
    pass("환경 변수", "STRIPE_SECRET_KEY", "sk_live_ (prod mode)");
  } else if (stripeKey.startsWith("sk_test_")) {
    fail("환경 변수", "STRIPE_SECRET_KEY", "sk_test_ — Stripe prod key로 교체 필요");
  } else {
    warn("환경 변수", "STRIPE_SECRET_KEY", "알 수 없는 prefix — 확인 필요");
  }

  // RESEND_FROM
  const resendFrom = process.env.RESEND_FROM ?? "";
  if (!resendFrom) {
    fail("환경 변수", "RESEND_FROM", "미설정");
  } else if (resendFrom.includes("onboarding@resend.dev") || resendFrom.includes("yourdomain")) {
    warn("환경 변수", "RESEND_FROM", `현재 "${resendFrom}" — prod 도메인으로 교체 권장`);
  } else {
    pass("환경 변수", "RESEND_FROM", `"${resendFrom}"`);
  }

  // NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!appUrl) {
    fail("환경 변수", "NEXT_PUBLIC_APP_URL", "미설정");
  } else if (appUrl.startsWith("http://localhost") || appUrl.includes("yourdomain")) {
    fail("환경 변수", "NEXT_PUBLIC_APP_URL", `현재 "${appUrl}" — prod URL로 교체 필요`);
  } else if (appUrl.startsWith("https://")) {
    pass("환경 변수", "NEXT_PUBLIC_APP_URL", `"${appUrl}"`);
  } else {
    warn("환경 변수", "NEXT_PUBLIC_APP_URL", `"${appUrl}" — https:// 로 시작하는지 확인`);
  }

  // 보안 시크릿 존재 여부
  const secrets: [string, string][] = [
    ["CRON_SECRET", "Vercel cron 인증"],
    ["IMPERSONATION_SECRET", "admin impersonation"],
    ["UNSUBSCRIBE_SECRET", "이메일 unsubscribe 서명"],
    ["SUPABASE_SERVICE_ROLE_KEY", "Supabase service role"],
    ["STRIPE_WEBHOOK_SECRET", "Stripe webhook"],
    ["RESEND_API_KEY", "Resend 이메일"],
    ["LIVEKIT_API_KEY", "LiveKit"],
    ["LIVEKIT_API_SECRET", "LiveKit secret"],
  ];

  for (const [key, desc] of secrets) {
    const val = process.env[key];
    if (!val) {
      fail("환경 변수", key, `미설정 (${desc})`);
    } else {
      pass("환경 변수", key, `설정됨 (${desc})`);
    }
  }
}

// ─── 출력 ────────────────────────────────────────────────────────────────────

function printResults() {
  const icon: Record<Status, string> = {
    pass: "✓",
    warn: "⚠",
    fail: "✗",
  };

  const categories = [...new Set(results.map((r) => r.category))];

  console.log("\n=== Production Readiness Audit ===\n");

  for (const cat of categories) {
    console.log(`[${cat}]`);
    const catResults = results.filter((r) => r.category === cat);
    for (const r of catResults) {
      console.log(`  ${icon[r.status]} ${r.label}: ${r.detail}`);
    }
    console.log();
  }

  const failCount = results.filter((r) => r.status === "fail").length;
  const warnCount = results.filter((r) => r.status === "warn").length;
  const passCount = results.filter((r) => r.status === "pass").length;

  console.log(`결과: ✓ ${passCount}  ⚠ ${warnCount}  ✗ ${failCount}`);

  if (failCount > 0) {
    console.log(`\n✗ ${failCount}건 실패 — 배포 전 반드시 해결하세요.\n`);
    process.exit(1);
  } else if (warnCount > 0) {
    console.log(`\n⚠ ${warnCount}건 경고 — 가능하면 해결 후 배포하세요.\n`);
  } else {
    console.log("\n모든 항목 통과. 배포 준비 완료!\n");
  }
}

// ─── 실행 ────────────────────────────────────────────────────────────────────

await checkTestData();
checkEnvFlags();
printResults();
