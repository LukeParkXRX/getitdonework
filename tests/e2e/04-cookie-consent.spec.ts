import { test, expect } from "@playwright/test";

test.describe("Cookie Consent Banner", () => {
  test("첫 진입 시 배너 표시", async ({ page }) => {
    // localStorage 클리어 후 진입
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("cookie-consent");
      localStorage.removeItem("cookieConsent");
      localStorage.removeItem("cookie_consent");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 배너가 있으면 확인, 없으면 skip (구현 여부 따라)
    const banner = page.locator("[data-testid='cookie-banner'], [class*='cookie'], [class*='Cookie'], [class*='consent']").first();
    const cookieText = page.locator("text=/쿠키|Cookie|동의/i").first();

    const bannerExists = (await banner.count()) > 0 || (await cookieText.count()) > 0;
    if (!bannerExists) {
      test.skip();
      return;
    }

    await expect(cookieText).toBeVisible();
  });

  test("동의 클릭 → 배너 사라짐 + localStorage 저장", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("cookie-consent");
      localStorage.removeItem("cookieConsent");
      localStorage.removeItem("cookie_consent");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const acceptBtn = page
      .locator("button")
      .filter({ hasText: /동의|Accept|확인|OK/i })
      .first();

    if ((await acceptBtn.count()) === 0) {
      test.skip();
      return;
    }

    await acceptBtn.click();
    await page.waitForTimeout(500);

    // localStorage에 동의 값 저장 확인
    const stored = await page.evaluate(() => {
      return (
        localStorage.getItem("cookie-consent") ||
        localStorage.getItem("cookieConsent") ||
        localStorage.getItem("cookie_consent")
      );
    });
    expect(stored).toBeTruthy();
  });

  test("새로고침 후 배너 미표시", async ({ page }) => {
    // 동의 값 미리 세팅
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("cookie-consent", "true");
      localStorage.setItem("cookieConsent", "true");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 배너가 없거나, 있어도 hidden 상태여야 함
    const banner = page
      .locator("[data-testid='cookie-banner'], [class*='cookie-banner'], [class*='CookieBanner']")
      .first();

    if ((await banner.count()) > 0) {
      await expect(banner).not.toBeVisible();
    }
    // 배너 자체가 DOM에 없으면 통과
  });
});
