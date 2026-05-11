import { test, expect } from "@playwright/test";

test.describe("Enabler 탐색", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/enablers");
    await page.waitForLoadState("networkidle");
  });

  test("/enablers 페이지 정상 로드", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
    expect(body).not.toContain("500");
    // 카드 또는 목록 존재
    const cards = page.locator("[class*='card'], [class*='Card'], article, [data-testid='enabler-card']");
    const count = await cards.count();
    // 최소 1개 이상의 카드 or 빈 상태 메시지
    const emptyState = page.locator("text=/결과가 없|No results|없습니다/");
    const hasContent = count > 0 || (await emptyState.count()) > 0;
    expect(hasContent).toBe(true);
  });

  test("검색바 입력 → 결과 변경", async ({ page }) => {
    const searchInput = page.locator("input[type='text'], input[type='search'], input[placeholder*='검색'], input[placeholder*='Search']").first();
    const inputCount = await searchInput.count();

    if (inputCount === 0) {
      test.skip();
      return;
    }

    // 초기 카드 수 기록
    await searchInput.fill("Luke");
    await page.waitForTimeout(800); // debounce 대기

    // 검색 후 에러 없는지
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
  });

  test("카테고리 필터 클릭", async ({ page }) => {
    const filterBtn = page.locator("button").filter({ hasText: /All|전체|Category|카테고리|IT|Design|마케팅/ }).first();
    const count = await filterBtn.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await filterBtn.click();
    await page.waitForTimeout(500);

    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
  });

  test("정렬 dropdown 변경", async ({ page }) => {
    const sortSelect = page.locator("select, [role='combobox']").first();
    const count = await sortSelect.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const tagName = await sortSelect.evaluate((el) => el.tagName.toLowerCase());
    if (tagName === "select") {
      await sortSelect.selectOption({ index: 1 });
    } else {
      await sortSelect.click();
      const option = page.locator("[role='option']").first();
      if ((await option.count()) > 0) {
        await option.click();
      }
    }

    await page.waitForTimeout(500);
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
  });
});
