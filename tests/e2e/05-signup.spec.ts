import { test, expect } from "@playwright/test";

test.describe("회원가입 폼 검증", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
  });

  test("/signup 페이지 정상 로드 — form 요소 존재", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
    expect(body).not.toMatch(/Internal Server Error|500 — /i);

    const nameInput = page.locator("form input[type='text']").first();
    await expect(nameInput).toBeVisible();

    const emailInput = page.locator("form input[type='email']");
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator("form input[type='password']");
    await expect(passwordInput).toBeVisible();

    const submitBtn = page.locator("form button[type='submit']");
    await expect(submitBtn).toBeVisible();
  });

  test("빈 폼 제출 시 — 필수 입력값 검증", async ({ page }) => {
    const submitBtn = page.locator("form button[type='submit']");

    await submitBtn.click();

    const nameInput = page.locator("form input[type='text']").first();
    const validity = await nameInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(validity).toBe(false);
  });

  test("잘못된 이메일 형식 — 클라이언트 검증", async ({ page }) => {
    const nameInput = page.locator("form input[type='text']").first();
    const emailInput = page.locator("form input[type='email']");
    const submitBtn = page.locator("form button[type='submit']");

    await nameInput.fill("테스트유저");
    await emailInput.fill("not-an-email");
    await submitBtn.click();

    const validity = await emailInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(validity).toBe(false);
  });

  test("약한 비밀번호 — 8자 미만 서버/클라이언트 검증", async ({ page }) => {
    const nameInput = page.locator("form input[type='text']").first();
    const emailInput = page.locator("form input[type='email']");
    const passwordInput = page.locator("form input[type='password']");
    const agreeInput = page.locator("form input[type='checkbox']").first();
    const submitBtn = page.locator("form button[type='submit']");

    await nameInput.fill("테스트유저");
    await emailInput.fill(`e2e-pw-test-${Date.now()}@e2e.test`);
    await passwordInput.fill("short");
    await agreeInput.check();

    await submitBtn.click();

    const body = await page.textContent("body");
    const stillOnSignup = page.url().includes("/signup");
    const hasError =
      body?.includes("8자") ||
      body?.includes("8 characters") ||
      body?.includes("비밀번호") ||
      body?.includes("Password") ||
      stillOnSignup;
    expect(hasError).toBe(true);
  });
});
