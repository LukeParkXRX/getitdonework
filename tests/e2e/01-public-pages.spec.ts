import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/", keyword: "Get It Done" },
  { path: "/enablers", keyword: "Enabler" },
  { path: "/about", keyword: "" },
  { path: "/faq", keyword: "" },
  { path: "/credits", keyword: "" },
  { path: "/contact", keyword: "" },
  { path: "/legal", keyword: "Legal Center" },
  { path: "/privacy", keyword: "Privacy" },
  { path: "/terms", keyword: "Terms" },
  { path: "/refund", keyword: "Refund" },
  { path: "/cookie-policy", keyword: "Cookie" },
  { path: "/login", keyword: "" },
  { path: "/signup", keyword: "" },
];

for (const { path, keyword } of PUBLIC_PAGES) {
  test(`공개 페이지 접근 가능: ${path}`, async ({ page }) => {
    const response = await page.goto(path);

    // 500 에러 아닌지
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);

    // Application error 텍스트 없는지
    const body = await page.textContent("body");
    expect(body).not.toContain("Application error");
    expect(body).not.toContain("Internal Server Error");

    // 핵심 텍스트 포함 (있는 경우만)
    if (keyword) {
      await expect(page.locator("body")).toContainText(keyword);
    }
  });
}
