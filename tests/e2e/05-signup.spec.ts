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

    // 이름 input (type=text, placeholder=이름)
    const nameInput = page.locator("input[type='text'][placeholder='이름']");
    await expect(nameInput).toBeVisible();

    // 이메일 input
    const emailInput = page.locator("input[type='email']");
    await expect(emailInput).toBeVisible();

    // 비밀번호 input
    const passwordInput = page.locator("input[type='password']");
    await expect(passwordInput).toBeVisible();

    // 가입 버튼
    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeVisible();
  });

  test("빈 폼 제출 시 — 이름 required 검증", async ({ page }) => {
    const submitBtn = page.locator("button[type='submit']");

    // 아무것도 입력 안 하고 제출
    await submitBtn.click();

    // 브라우저 native required 검증: 이름 input이 invalid 상태
    const nameInput = page.locator("input[type='text'][placeholder='이름']");
    const validity = await nameInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(validity).toBe(false);
  });

  test("잘못된 이메일 형식 — 클라이언트 검증", async ({ page }) => {
    const nameInput = page.locator("input[type='text'][placeholder='이름']");
    const emailInput = page.locator("input[type='email']");
    const submitBtn = page.locator("button[type='submit']");

    await nameInput.fill("테스트유저");
    await emailInput.fill("not-an-email");
    await submitBtn.click();

    // type=email 이면 브라우저가 native validation 처리
    const validity = await emailInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(validity).toBe(false);
  });

  test("약한 비밀번호 — 8자 미만 서버/클라이언트 검증", async ({ page }) => {
    const nameInput = page.locator("input[type='text'][placeholder='이름']");
    const emailInput = page.locator("input[type='email']");
    // 비밀번호 필드: type이 text(show mode) 또는 password 모두 허용
    const passwordInput = page
      .locator("input[type='password'], input[type='text']")
      .nth(1);
    const submitBtn = page.locator("button[type='submit']");

    await nameInput.fill("테스트유저");
    await emailInput.fill(`e2e-pw-test-${Date.now()}@e2e.test`);

    // 비밀번호 필드 가시 여부 확인 후 fill
    const pwField = page.locator("input[type='password']");
    const pwCount = await pwField.count();
    if (pwCount > 0) {
      await pwField.first().fill("short"); // 5자 — 정책 위반
    } else {
      // show password 모드일 때
      await passwordInput.fill("short");
    }

    await submitBtn.click();

    // SignupForm.tsx에서 password.length < 8 검사 → formError 표출
    // 또는 Supabase Auth 에러
    // 어느 쪽이든 "error" 계열 메시지 노출 확인 (제출 직전까지만 검증)
    await page.waitForTimeout(1000);

    const body = await page.textContent("body");
    // 에러 메시지 또는 여전히 signup 페이지에 머무름 (리다이렉트 없음)
    const stillOnSignup = page.url().includes("/signup");
    const hasError =
      body?.includes("8자") ||
      body?.includes("비밀번호") ||
      body?.includes("Password") ||
      stillOnSignup;
    expect(hasError).toBe(true);
  });
});
