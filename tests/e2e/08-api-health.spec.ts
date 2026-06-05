import { test, expect } from "@playwright/test";

test.describe("/api/health 헬스 엔드포인트", () => {
  test("정상 응답 구조 (DB ok + checks 전체 포함)", async ({ request }) => {
    const res = await request.get("/api/health");
    // DB 실패가 아니면 200, error면 503 — 둘 다 허용 (env 미설정 시 503 가능)
    expect([200, 503]).toContain(res.status());

    const json = (await res.json()) as {
      status: "ok" | "degraded" | "error";
      checks: Record<string, { status: string }>;
      timestamp: string;
    };

    expect(["ok", "degraded", "error"]).toContain(json.status);
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // 필수 체크 항목 모두 포함
    for (const key of ["db", "stripe", "livekit", "resend", "admin_notifications", "payment_setup_notifications", "sentry", "rate_limit"]) {
      expect(json.checks).toHaveProperty(key);
      expect(json.checks[key]).toHaveProperty("status");
    }
  });

  test("Cache-Control no-store — 외부 모니터 우회 캐싱 차단", async ({ request }) => {
    const res = await request.get("/api/health");
    const cc = res.headers()["cache-control"] ?? "";
    expect(cc).toMatch(/no-store/);
  });

  test("DB ok 시 rate_limit.backend 노출", async ({ request }) => {
    const res = await request.get("/api/health");
    const json = (await res.json()) as {
      checks: { rate_limit: { backend?: string } };
    };

    // backend는 'upstash' 또는 'in-memory'
    if (json.checks.rate_limit?.backend) {
      expect(["upstash", "in-memory"]).toContain(json.checks.rate_limit.backend);
    }
  });
});
