import { test, expect } from "@playwright/test";

test.describe("결제 게이트 (크레딧 구매 흐름)", () => {
  test("/credits 비로그인 접근 — 로그인으로 리다이렉트", async ({ page }) => {
    const response = await page.goto("/credits", { waitUntil: "networkidle" });
    // requireRole이 /login으로 redirect
    expect(page.url()).toMatch(/\/login/);
    // 200 OK는 OK (redirect 후 login 페이지)
    expect(response?.status() ?? 0).toBeLessThan(500);
  });

  test("/credits 진입 시 redirect 파라미터 보존", async ({ page }) => {
    await page.goto("/credits");
    await page.waitForURL(/\/login/);
    // redirect=/credits 가 URL에 포함되어 로그인 후 복귀 가능
    expect(page.url()).toContain("redirect=");
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
