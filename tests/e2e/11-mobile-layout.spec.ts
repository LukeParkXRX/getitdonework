import { test, expect } from "@playwright/test";

const MOBILE_ROUTES = [
  "/",
  "/signup",
  "/login",
  "/credits",
  "/enablers",
  "/legal",
  "/bookings",
];

test.describe("모바일 레이아웃 기본 점검", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const route of MOBILE_ROUTES) {
    test(`${route} — 390px에서 가로 잘림 없음`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.status() ?? 0).toBeLessThan(500);

      const hasHorizontalOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth + 1;
      });

      expect(hasHorizontalOverflow).toBe(false);
      await expect(page.locator("body")).not.toContainText(/Application error|Internal Server Error/i);
    });
  }
});
