import { createServerSupabaseClient } from "@/lib/supabase/server";
import { rateLimitBackend } from "@/lib/rate-limit";
import {
  getAdminNotificationEmails,
  getPaymentSetupRecipientEmails,
} from "@/lib/admin-notifications";

export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "warning" | "error";

interface HealthReport {
  status: "ok" | "degraded" | "error";
  checks: Record<string, { status: CheckStatus; [k: string]: unknown }>;
  timestamp: string;
}

function envCheck(...keys: string[]): { status: CheckStatus; missing: string[] } {
  const missing = keys.filter((k) => !process.env[k]);
  return {
    status: missing.length === 0 ? "ok" : "error",
    missing,
  };
}

function envWarningCheck(...keys: string[]): { status: CheckStatus; missing: string[] } {
  const missing = keys.filter((k) => !process.env[k]);
  return {
    status: missing.length === 0 ? "ok" : "warning",
    missing,
  };
}

export async function GET() {
  const checks: HealthReport["checks"] = {};
  let dbOk = false;

  // 1. DB (실제 ping — Supabase Seoul)
  const dbStart = Date.now();
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("enabler_profiles").select("user_id").limit(1);
    if (error) {
      checks.db = { status: "error", latency_ms: Date.now() - dbStart, error: error.message };
    } else {
      checks.db = { status: "ok", latency_ms: Date.now() - dbStart };
      dbOk = true;
    }
  } catch (err) {
    checks.db = {
      status: "error",
      latency_ms: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "unknown",
    };
  }

  // 2. Payment mode. Stripe keys are required only after Stripe live mode is enabled.
  const paymentMode = (process.env.PAYMENT_MODE ?? "manual_credits").trim();
  if (paymentMode === "stripe_live") {
    checks.stripe = envCheck("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET");
  } else if (paymentMode === "manual_credits") {
    checks.stripe = {
      status: "ok",
      mode: paymentMode,
      note: "Stripe deferred; admins grant credits manually.",
    };
  } else {
    checks.stripe = {
      status: "error",
      mode: paymentMode,
      error: "PAYMENT_MODE must be manual_credits or stripe_live.",
    };
  }

  // 3. LiveKit (key 존재만)
  checks.livekit = envCheck("LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET");

  // 4. Resend (이메일 발송)
  checks.resend = envCheck("RESEND_API_KEY", "RESEND_FROM");

  // 5. Admin notification routing. 이메일 주소 자체는 공개 health 응답에 노출하지 않는다.
  const adminNotificationEmails = getAdminNotificationEmails();
  checks.admin_notifications = {
    status: adminNotificationEmails.length > 0 ? "ok" : "warning",
    recipient_count: adminNotificationEmails.length,
    note: "Enabler applications and contact forms route to admin recipients.",
  };

  const paymentSetupRecipientEmails = getPaymentSetupRecipientEmails();
  checks.payment_setup_notifications = {
    status: paymentSetupRecipientEmails.length > 0 ? "ok" : "warning",
    recipient_count: paymentSetupRecipientEmails.length,
    note: "Payment setup submissions route to these recipients.",
  };

  // 6. Sentry (모니터링). Missing Sentry is launch-risk, not runtime-down.
  checks.sentry = envWarningCheck("NEXT_PUBLIC_SENTRY_DSN");

  // 7. Rate limit backend — prod에서 in-memory면 warning
  const rlBackend = rateLimitBackend();
  const rlInProd =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" && rlBackend === "in-memory";
  checks.rate_limit = {
    status: rlInProd ? "warning" : "ok",
    backend: rlBackend,
    ...(rlInProd && {
      hint: "in-memory fallback is per-instance — set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN",
    }),
  };

  // 종합 상태
  const hasError = Object.values(checks).some((c) => c.status === "error");
  const hasWarning = Object.values(checks).some((c) => c.status === "warning");
  const overall: HealthReport["status"] = !dbOk || hasError ? "error" : hasWarning ? "degraded" : "ok";

  const body: HealthReport = {
    status: overall,
    checks,
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, {
    status: overall === "error" ? 503 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
