/**
 * Pages Preview 썸네일 캡처 스크립트 (Playwright)
 *
 * 실행 전 dev 서버가 반드시 실행 중이어야 합니다:
 *   bun run dev   (별도 터미널에서 먼저 실행)
 *
 * 그 다음:
 *   bun run capture:thumbs
 *   PAGES_BASE_URL=https://getitdone.work bun run capture:thumbs  (프로덕션 캡처)
 *
 * 결과물: /public/launch-pages-thumbs/{slug}.png (1280×800)
 */

import { chromium } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── 설정 ──────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.PAGES_BASE_URL ?? "http://localhost:3001";
const OUTPUT_DIR = path.resolve(process.cwd(), "public/launch-pages-thumbs");
const VIEWPORT = { width: 1280, height: 800 };

/** 캡처 대상 라우트 목록 */
const ROUTES: Array<{ path: string; slug: string; label: string }> = [
  { path: "/",          slug: "home",     label: "홈" },
  { path: "/enablers",  slug: "enablers", label: "Enablers" },
  { path: "/insights",  slug: "insights", label: "Insights" },
  { path: "/about",     slug: "about",    label: "About" },
  { path: "/faq",       slug: "faq",      label: "FAQ" },
  { path: "/careers",   slug: "careers",  label: "Careers" },
  { path: "/contact",   slug: "contact",  label: "Contact" },
  { path: "/credits",   slug: "credits",  label: "Credits" },
  { path: "/privacy",   slug: "privacy",  label: "Privacy" },
  { path: "/terms",     slug: "terms",    label: "Terms" },
  { path: "/refund",    slug: "refund",   label: "Refund" },
  { path: "/search",    slug: "search",   label: "Search" },
];

// ─── 유틸 ──────────────────────────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  디렉토리 생성: ${dir}`);
  }
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

// ─── 메인 ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n Pages Preview 썸네일 캡처 시작");
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  출력 경로: ${OUTPUT_DIR}`);
  console.log(`  뷰포트   : ${VIEWPORT.width}×${VIEWPORT.height}`);
  console.log(`  대상     : ${ROUTES.length}개 페이지\n`);

  ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  let success = 0;
  let skipped = 0;
  const totalStart = Date.now();

  for (const route of ROUTES) {
    const url = `${BASE_URL}${route.path}`;
    const outFile = path.join(OUTPUT_DIR, `${route.slug}.png`);
    const start = Date.now();

    process.stdout.write(`  [${String(ROUTES.indexOf(route) + 1).padStart(2, "0")}/${ROUTES.length}] ${route.label.padEnd(12)} ${route.path} ... `);

    try {
      const page = await context.newPage();

      // 불필요한 리소스(폰트, 이미지) 차단해 속도 향상
      await page.route("**/*.{woff,woff2,ttf,otf}", (r) => r.abort());

      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

      // 레이아웃 안정화 대기 (hydration 완료)
      await page.waitForTimeout(800);

      await page.screenshot({
        path: outFile,
        fullPage: false,  // 뷰포트 크기만 (썸네일 목적)
        clip: { x: 0, y: 0, ...VIEWPORT },
      });

      await page.close();

      const elapsed = Date.now() - start;
      console.log(`완료 (${formatDuration(elapsed)})`);
      success++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`스킵 — ${msg.slice(0, 80)}`);
      skipped++;
    }
  }

  await context.close();
  await browser.close();

  const totalElapsed = Date.now() - totalStart;

  console.log(`\n 완료: ${success}개 성공, ${skipped}개 스킵 (총 ${formatDuration(totalElapsed)})`);
  console.log(`  결과물: ${OUTPUT_DIR}/`);

  if (skipped > 0) {
    console.log(`\n  스킵된 페이지는 dashboard에서 placeholder gradient로 표시됩니다.`);
  }
}

main().catch((err: unknown) => {
  console.error("\n예기치 않은 오류:", err);
  process.exit(1);
});
