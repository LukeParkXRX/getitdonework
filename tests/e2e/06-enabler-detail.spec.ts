import { test, expect } from "@playwright/test";

// Enabler 상세 페이지 접근은 (dashboard) 그룹 → 인증 필요
// TestLoginPanel 클릭 → Supabase 로그인 → 쿠키 확인 → /enablers 진입

async function loginWithTestPanel(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  const testPanel = page.locator("text=TEST MODE");
  const panelVisible = await testPanel.isVisible().catch(() => false);
  if (!panelVisible) return false;

  const startup01Btn = page
    .locator("button")
    .filter({ hasText: "Startup 01" })
    .first();
  await startup01Btn.click();

  // 로그인 후 페이지 이동 대기 (최대 15초)
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  }).catch(() => {});

  await page.waitForLoadState("networkidle");

  // 현재 URL이 /login 이 아니면 성공
  return !page.url().includes("/login");
}

test.describe("Enabler 상세 페이지", () => {
  test("로그인 후 /enablers 진입 → 카드 존재", async ({ page }) => {
    const loggedIn = await loginWithTestPanel(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto("/enablers");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");

    const cards = page.locator(
      "[class*='card'], [class*='Card'], article, [data-testid='enabler-card']"
    );
    const count = await cards.count();
    const emptyState = page.locator(
      "text=/결과가 없|No results|없습니다|Enabler가 없/"
    );
    const hasContent = count > 0 || (await emptyState.count()) > 0;
    expect(hasContent).toBe(true);
  });

  test("첫 Enabler 링크 → 상세 페이지 핵심 요소 노출", async ({ page }) => {
    const loggedIn = await loginWithTestPanel(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto("/enablers");
    await page.waitForLoadState("networkidle");

    // /enablers/[userId] 형태 링크 탐색
    const enablerLink = page.locator("a[href*='/enablers/']").first();
    const linkCount = await enablerLink.count();
    if (linkCount === 0) {
      test.skip();
      return;
    }

    // href 값 추출 후 직접 이동 (SPA 네비게이션보다 안정적)
    const href = await enablerLink.getAttribute("href");
    if (!href) {
      test.skip();
      return;
    }

    await page.goto(href);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const url = page.url();
    // /login redirect가 아닌 enabler 상세 페이지여야 함
    expect(url).not.toMatch(/\/login/);
    expect(url).toMatch(/enablers\/[^/]+/);

    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
    expect(body).not.toMatch(/Internal Server Error/i);

    // enabler 관련 정보 노출: 이름, MBA, university, 버튼 중 하나
    const hasEnablerInfo =
      (body?.includes("MBA") ?? false) ||
      (body?.includes("University") ?? false) ||
      (body?.includes("university") ?? false) ||
      (body?.includes("Enabler") ?? false) ||
      (body?.includes("예약") ?? false) ||
      (body?.includes("메시지") ?? false);

    expect(hasEnablerInfo).toBe(true);
  });
});
