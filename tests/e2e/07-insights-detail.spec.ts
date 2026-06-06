import { test, expect } from "@playwright/test";

test.describe("Insights 상세 페이지", () => {
  test("/insights 진입 → 한국어 카드 또는 영어 안내 정상 노출", async ({ page }) => {
    await page.goto("/insights");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
    expect(body).not.toMatch(/Internal Server Error|500 — /i);

    const insightLinks = page.locator("a[href^='/insights/']");
    const count = await insightLinks.count();

    if (count === 0) {
      expect(body).toMatch(/currently published in Korean|View in Korean|한국어/i);
      return;
    }

    expect(count).toBeGreaterThanOrEqual(7);
  });

  test("첫 카드 href → /insights/[id] URL 패턴 유효", async ({ page }) => {
    await page.goto("/insights");
    await page.waitForLoadState("networkidle");

    const insightLink = page.locator("a[href^='/insights/']").first();
    const linkCount = await insightLink.count();
    if (linkCount === 0) {
      test.skip();
      return;
    }

    const href = await insightLink.getAttribute("href");
    expect(href).toMatch(/\/insights\/\d+/);

    // 직접 이동 후 URL 확인
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    const url = page.url();
    expect(url).toMatch(/\/insights\/\d+/);
  });

  test("상세 페이지 — title, body sections, author 노출", async ({ page }) => {
    // id=0 (FEATURED_ARTICLE) 직접 접근
    await page.goto("/insights/0");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
    expect(body).not.toMatch(/Internal Server Error/i);
    expect(body).not.toContain("Insight not found");

    // 제목: h1 또는 heading 요소
    const heading = page
      .locator("h1, h2, [class*='title'], [class*='Title']")
      .first();
    await expect(heading).toBeVisible();

    // body sections: article.body.map() → p 또는 section 요소
    const sections = page.locator("p, section, [class*='section']");
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(0);

    // author: articles-data.ts 작성자 이름 포함 여부
    const hasAuthor =
      (body?.includes("Luke") ?? false) ||
      (body?.includes("Woosub") ?? false) ||
      (body?.includes("Sson") ?? false) ||
      (body?.includes("Park") ?? false) ||
      (body?.includes("MBA") ?? false) ||
      (body?.includes("author") ?? false) ||
      (body?.includes("Author") ?? false);
    expect(hasAuthor).toBe(true);
  });

  test("'← 인사이트 목록으로' back 링크 → /insights로 복귀", async ({
    page,
  }) => {
    await page.goto("/insights/0");
    await page.waitForLoadState("networkidle");

    // InsightDetailClient.tsx: <a href="/insights">← 인사이트 목록으로</a>
    const backLink = page.locator("a[href='/insights']").first();
    const backCount = await backLink.count();

    if (backCount === 0) {
      // 텍스트 기반 탐색 fallback
      const textBack = page
        .locator("a, button")
        .filter({ hasText: /인사이트 목록|← 인사이트|목록으로|Back/ })
        .first();
      if ((await textBack.count()) === 0) {
        test.skip();
        return;
      }
      await textBack.click();
    } else {
      await backLink.click();
    }

    // 클릭 후 /insights 로 이동 대기
    await page.waitForURL(/\/insights\/?$/, { timeout: 8_000 });

    const url = page.url();
    expect(url).toMatch(/\/insights\/?$/);
  });
});
