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
const PAYMENT_MODE = (process.env.PAYMENT_MODE ?? "manual_credits").trim();
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://getitdonework.com").trim().replace(/\/$/, "");
const REQUIRED_ADMIN_EMAILS = [
  "admin@getitdonework.com",
  "luke@xrx.studio",
  "sson@xrx.studio",
];

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
  if (PAYMENT_MODE === "manual_credits") {
    pass(
      "환경 변수",
      "PAYMENT_MODE",
      "manual_credits — Stripe 인증 전 관리자 수동 크레딧 지급 모드"
    );
  } else if (PAYMENT_MODE === "stripe_live") {
    pass("환경 변수", "PAYMENT_MODE", "stripe_live — Stripe 공식 결제 모드");
  } else {
    fail(
      "환경 변수",
      "PAYMENT_MODE",
      `"${PAYMENT_MODE}" — manual_credits 또는 stripe_live만 허용`
    );
  }

  // NEXT_PUBLIC_SHOW_TEST_DATA
  const showTestData = process.env.NEXT_PUBLIC_SHOW_TEST_DATA?.trim();
  if (showTestData === "true") {
    fail("환경 변수", "NEXT_PUBLIC_SHOW_TEST_DATA", `현재 "true" — prod에서 반드시 false 또는 미설정`);
  } else {
    pass("환경 변수", "NEXT_PUBLIC_SHOW_TEST_DATA", `"${showTestData ?? "미설정"}" (OK)`);
  }

  // STRIPE_SECRET_KEY — stripe_live 모드에서만 prod key 필수
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (PAYMENT_MODE === "stripe_live") {
    if (!stripeKey) {
      fail("환경 변수", "STRIPE_SECRET_KEY", "stripe_live 모드인데 미설정");
    } else if (stripeKey.startsWith("sk_live_")) {
      pass("환경 변수", "STRIPE_SECRET_KEY", "sk_live_ (prod mode)");
    } else if (stripeKey.startsWith("sk_test_")) {
      fail("환경 변수", "STRIPE_SECRET_KEY", "sk_test_ — Stripe prod key로 교체 필요");
    } else {
      warn("환경 변수", "STRIPE_SECRET_KEY", "알 수 없는 prefix — 확인 필요");
    }

    if (!stripeWebhookSecret) {
      fail("환경 변수", "STRIPE_WEBHOOK_SECRET", "stripe_live 모드인데 미설정");
    } else {
      pass("환경 변수", "STRIPE_WEBHOOK_SECRET", "설정됨 (Stripe webhook)");
    }
  } else {
    pass("환경 변수", "STRIPE_SECRET_KEY", "manual_credits 모드 — Stripe key 없어도 오픈 가능");
    pass("환경 변수", "STRIPE_WEBHOOK_SECRET", "manual_credits 모드 — Stripe webhook 없어도 오픈 가능");
  }

  // RESEND_FROM
  const resendFrom = process.env.RESEND_FROM?.trim() ?? "";
  if (!resendFrom) {
    fail("환경 변수", "RESEND_FROM", "미설정");
  } else if (resendFrom.includes("onboarding@resend.dev") || resendFrom.includes("yourdomain")) {
    warn("환경 변수", "RESEND_FROM", `현재 "${resendFrom}" — prod 도메인으로 교체 권장`);
  } else {
    pass("환경 변수", "RESEND_FROM", `"${resendFrom}"`);
  }

  const adminEmails = (
    process.env.ADMIN_EMAILS ??
    process.env.ADMIN_EMAIL ??
    ""
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) {
    fail("환경 변수", "ADMIN_EMAILS", "관리자 알림 수신자 미설정");
  } else if (REQUIRED_ADMIN_EMAILS.some((email) => !adminEmails.includes(email))) {
    fail(
      "환경 변수",
      "ADMIN_EMAILS",
      `필수 수신자 누락 — 필요: ${REQUIRED_ADMIN_EMAILS.join(", ")} / 현재: ${adminEmails.join(", ")}`
    );
  } else {
    pass("환경 변수", "ADMIN_EMAILS", adminEmails.join(", "));
  }

  const paymentSetupRecipients = (
    process.env.PAYMENT_SETUP_RECIPIENTS ??
    process.env.PAYMENT_SETUP_RECIPIENT ??
    ""
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (paymentSetupRecipients.length === 0) {
    fail("환경 변수", "PAYMENT_SETUP_RECIPIENTS", "결제 셋업 수신자 미설정");
  } else if (REQUIRED_ADMIN_EMAILS.some((email) => !paymentSetupRecipients.includes(email))) {
    fail(
      "환경 변수",
      "PAYMENT_SETUP_RECIPIENTS",
      `필수 수신자 누락 — 필요: ${REQUIRED_ADMIN_EMAILS.join(", ")} / 현재: ${paymentSetupRecipients.join(", ")}`
    );
  } else {
    pass("환경 변수", "PAYMENT_SETUP_RECIPIENTS", paymentSetupRecipients.join(", "));
  }

  // NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
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

type HealthCheck = { status: "ok" | "warning" | "error"; [key: string]: unknown };
type HealthReport = {
  status: "ok" | "degraded" | "error";
  checks: Record<string, HealthCheck>;
};

async function checkLiveHealth() {
  const url = `${APP_URL}/api/health`;
  let report: HealthReport;

  try {
    const res = await fetch(url, { cache: "no-store" });
    report = (await res.json()) as HealthReport;

    if (res.status >= 500 || report.status === "error") {
      fail("운영 Health", "/api/health", `error 응답 (${res.status})`);
      return;
    }
  } catch (error) {
    fail("운영 Health", "/api/health", error instanceof Error ? error.message : "응답 확인 실패");
    return;
  }

  const requiredChecks = ["db", "stripe", "livekit", "resend", "admin_notifications", "payment_setup_notifications", "rate_limit"];
  for (const key of requiredChecks) {
    const check = report.checks[key];
    if (!check) {
      fail("운영 Health", key, "체크 항목 누락");
    } else if (check.status === "error") {
      fail("운영 Health", key, "error");
    } else if (check.status === "warning") {
      warn("운영 Health", key, "warning");
    } else {
      pass("운영 Health", key, "ok");
    }
  }

  const adminNotifications = report.checks.admin_notifications;
  const recipientCount = adminNotifications?.recipient_count;
  if (typeof recipientCount === "number" && recipientCount >= REQUIRED_ADMIN_EMAILS.length) {
    pass("운영 Health", "admin notification recipients", `${recipientCount}명`);
  } else {
    fail("운영 Health", "admin notification recipients", `현재 ${recipientCount ?? "알 수 없음"}명`);
  }

  const paymentSetupNotifications = report.checks.payment_setup_notifications;
  const paymentSetupRecipientCount = paymentSetupNotifications?.recipient_count;
  if (typeof paymentSetupRecipientCount === "number" && paymentSetupRecipientCount >= REQUIRED_ADMIN_EMAILS.length) {
    pass("운영 Health", "payment setup recipients", `${paymentSetupRecipientCount}명`);
  } else {
    fail("운영 Health", "payment setup recipients", `현재 ${paymentSetupRecipientCount ?? "알 수 없음"}명`);
  }

  const rateLimit = report.checks.rate_limit;
  if (rateLimit?.backend === "upstash") {
    pass("운영 Health", "rate limit backend", "upstash");
  } else {
    warn("운영 Health", "rate limit backend", String(rateLimit?.backend ?? "unknown"));
  }

  const sentry = report.checks.sentry;
  if (sentry?.status === "ok") {
    pass("운영 Health", "Sentry", "ok");
  } else {
    warn("운영 Health", "Sentry", "아직 연결 필요");
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
await checkLiveHealth();
printResults();
