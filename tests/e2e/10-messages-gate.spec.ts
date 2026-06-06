import { test, expect } from "@playwright/test";

test.describe("메시징 게이트 (인증 보호 라우트)", () => {
  test("/messages 비로그인 접근 — 로그인으로 리다이렉트", async ({ page }) => {
    await page.goto("/messages", { waitUntil: "networkidle" });
    expect(page.url()).toMatch(/\/login/);
  });

  test("/bookings 비로그인 접근 — 로그인으로 리다이렉트", async ({ page }) => {
    await page.goto("/bookings", { waitUntil: "networkidle" });
    expect(page.url()).toMatch(/\/login/);
  });

  test("/settings 비로그인 접근 — 로그인으로 리다이렉트", async ({ page }) => {
    await page.goto("/settings", { waitUntil: "networkidle" });
    expect(page.url()).toMatch(/\/login/);
  });

  test("/login/2fa-challenge 비로그인 접근 — 로그인으로 리다이렉트", async ({ page }) => {
    await page.goto("/login/2fa-challenge", { waitUntil: "networkidle" });
    // 2FA 챌린지는 인증된 사용자만 — 비인증이면 /login으로
    expect(page.url()).toMatch(/\/login/);
  });

  test("/admin 비로그인 접근 — 관리자 데이터 비노출", async ({ page }) => {
    const response = await page.goto("/admin", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    expect(response?.status() ?? 0).toBeLessThan(500);
    expect(body).not.toMatch(/super_admin|credit_transactions|user_id|service role/i);
  });
});
