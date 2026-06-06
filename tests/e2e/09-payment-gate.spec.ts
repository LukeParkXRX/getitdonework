import { test, expect } from "@playwright/test";

test.describe("결제 게이트 (크레딧 구매 흐름)", () => {
  test("/credits 비로그인 접근 — 공개 안내 페이지 노출", async ({ page }) => {
    const response = await page.goto("/credits", { waitUntil: "networkidle" });
    expect(response?.status() ?? 0).toBeLessThan(400);
    expect(page.url()).toMatch(/\/credits\/?$/);

    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
    expect(body).not.toMatch(/Internal Server Error|500 — /i);
  });

  test("/credits 수동 크레딧 모드 — 구매 버튼이 바로 결제로 이어지지 않음", async ({ page }) => {
    await page.goto("/credits", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).not.toMatch(/Application error|Internal Server Error|500 — /i);
    expect(body).toMatch(/결제 준비|관리자|manual|credit|크레딧|coming soon/i);
  });

  test("/api/checkout manual_credits 모드 — Stripe 결제 세션 생성 차단", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: { packageId: "launch-smoke-test" },
    });
    const json = (await res.json()) as { error?: string; url?: string };

    expect(res.status()).toBe(503);
    expect(json.url).toBeUndefined();
    expect(json.error ?? "").toMatch(/결제|준비|관리자|credit/i);
  });

  test("/credits/success 페이지 단독 접근 — 인증 불요 (안내 페이지)", async ({ page }) => {
    const response = await page.goto("/credits/success", { waitUntil: "networkidle" });
    expect(response?.status()).toBeLessThan(400);
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
  });

  test("/credits/cancel 페이지 단독 접근 — 인증 불요 (안내 페이지)", async ({ page }) => {
    const response = await page.goto("/credits/cancel", { waitUntil: "networkidle" });
    expect(response?.status()).toBeLessThan(400);
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
  });
});
