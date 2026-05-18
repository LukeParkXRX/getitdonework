/**
 * Pages Preview 썸네일 캡처 스크립트 (Playwright)
 *
 * 실행 전 dev 서버가 반드시 실행 중이어야 합니다:
 *   bun run dev   (별도 터미널에서 먼저 실행, http://localhost:3001)
 *
 * 그 다음:
 *   bun run capture:thumbs
 *   PAGES_BASE_URL=https://getitdone.work bun run capture:thumbs  (프로덕션 캡처)
 *
 * 결과물: /public/launch-pages-thumbs/{slug}.png (1280×800)
 *
 * Public 라우트는 비로그인, 권한 라우트는 test 계정으로 로그인 후 캡처.
 * test 계정: docs/TEST_DATA.md
 */

import { chromium, type BrowserContext } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── 설정 ──────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.PAGES_BASE_URL ?? "http://localhost:3001";
const OUTPUT_DIR = path.resolve(process.cwd(), "public/launch-pages-thumbs");
const VIEWPORT = { width: 1280, height: 800 };
const TEST_PASSWORD = "Test!GetItDone2026";

interface Route {
  path: string;
  slug: string;
  label: string;
  /** undefined = no login; otherwise the test email to log in as */
  loginAs?: string;
}

/** 캡처 대상 라우트 — 비로그인(Public/Auth) + 역할별 인증 페이지 */
const ROUTES: Route[] = [
  // ── Public (no login) ────────────────────────────────────────
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

  // ── Auth pages (no login required to view) ───────────────────
  { path: "/login",     slug: "login",    label: "Login" },
  { path: "/signup",    slug: "signup",   label: "Signup" },

  // ── Startup (login as test.startup.01) ───────────────────────
  { path: "/my",        slug: "my",       label: "내 대시보드",  loginAs: "test.startup.01@getitdonework.test" },
  { path: "/bookings",  slug: "bookings", label: "예약",        loginAs: "test.startup.01@getitdonework.test" },
  { path: "/matching",  slug: "matching", label: "매칭",        loginAs: "test.startup.01@getitdonework.test" },
  { path: "/messages",  slug: "messages", label: "메시지",      loginAs: "test.startup.01@getitdonework.test" },
  { path: "/projects",  slug: "projects", label: "프로젝트",    loginAs: "test.startup.01@getitdonework.test" },

  // ── Enabler (login as test.enabler.01) ───────────────────────
  { path: "/enabler-dashboard",              slug: "enabler-dashboard",     label: "Enabler 홈",     loginAs: "test.enabler.02@getitdonework.test" },
  { path: "/enabler-dashboard/profile",      slug: "enabler-profile",       label: "Enabler 프로필", loginAs: "test.enabler.02@getitdonework.test" },
  { path: "/enabler-dashboard/availability", slug: "enabler-availability",  label: "가용 시간",      loginAs: "test.enabler.02@getitdonework.test" },
  { path: "/enabler-dashboard/earnings",     slug: "enabler-earnings",      label: "수익",           loginAs: "test.enabler.02@getitdonework.test" },

  // ── Org Admin (login as test.orgadmin.01) ────────────────────
  { path: "/org/dashboard", slug: "org-dashboard", label: "Org 대시보드", loginAs: "test.orgadmin.01@getitdonework.test" },

  // ── Super Admin (login as test.superadmin.01) ────────────────
  { path: "/admin/dashboard",        slug: "admin-dashboard",         label: "관리자 홈",      loginAs: "test.superadmin.01@getitdonework.test" },
  { path: "/admin/enablers",         slug: "admin-enablers",          label: "Enabler 관리",   loginAs: "test.superadmin.01@getitdonework.test" },
  { path: "/admin/users",            slug: "admin-users",             label: "유저 관리",      loginAs: "test.superadmin.01@getitdonework.test" },
  { path: "/admin/applications",     slug: "admin-applications",      label: "지원서",         loginAs: "test.superadmin.01@getitdonework.test" },
  { path: "/admin/disputes",         slug: "admin-disputes",          label: "분쟁",           loginAs: "test.superadmin.01@getitdonework.test" },
  { path: "/admin/payouts",          slug: "admin-payouts",           label: "정산",           loginAs: "test.superadmin.01@getitdonework.test" },
  { path: "/admin/audit-log",        slug: "admin-audit-log",         label: "감사 로그",      loginAs: "test.superadmin.01@getitdonework.test" },
  { path: "/admin/announcements",    slug: "admin-announcements",     label: "공지",           loginAs: "test.superadmin.01@getitdonework.test" },
  { path: "/admin/inquiries",        slug: "admin-inquiries",         label: "문의",           loginAs: "test.superadmin.01@getitdonework.test" },
  { path: "/admin/credit-packages",  slug: "admin-credit-packages",   label: "크레딧 패키지",  loginAs: "test.superadmin.01@getitdonework.test" },
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

async function loginContext(context: BrowserContext, email: string): Promise<void> {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);

    // 클릭 전에 waitForURL 등록 — race condition 방지
    const navPromise = page.waitForURL(
      (url) => !url.pathname.startsWith("/login"),
      { timeout: 20_000 },
    );
    await page.locator('button[type="submit"]').first().click();

    try {
      await navPromise;
    } catch {
      // fallback: URL 폴링 (Next.js router.push가 waitForURL을 놓치는 경우)
      const start = Date.now();
      while (Date.now() - start < 15_000) {
        if (!page.url().includes("/login")) break;
        await page.waitForTimeout(300);
      }
      if (page.url().includes("/login")) {
        const err = await page.locator('p:has-text("일치하지")').first().textContent().catch(() => "");
        throw new Error(err || "redirect after login did not occur");
      }
    }

    // 라우팅 + 쿠키 정착
    await page.waitForTimeout(1500);
  } finally {
    await page.close();
  }
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

  // role별로 그룹화 — 같은 계정은 같은 context 재사용 (로그인 1회)
  const buckets = new Map<string, Route[]>();
  for (const r of ROUTES) {
    const key = r.loginAs ?? "__public__";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }

  let success = 0;
  let skipped = 0;
  let processed = 0;
  const totalStart = Date.now();

  for (const [key, routes] of buckets) {
    const isPublic = key === "__public__";
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });

    if (!isPublic) {
      console.log(`\n  로그인: ${key}`);
      try {
        await loginContext(context, key);
        console.log(`  로그인 완료`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`  로그인 실패 — ${msg.slice(0, 100)} (이 그룹 건너뜀)`);
        skipped += routes.length;
        await context.close();
        continue;
      }
    }

    for (const route of routes) {
      processed++;
      const url = `${BASE_URL}${route.path}`;
      const outFile = path.join(OUTPUT_DIR, `${route.slug}.png`);
      const start = Date.now();

      process.stdout.write(`  [${String(processed).padStart(2, "0")}/${ROUTES.length}] ${route.label.padEnd(20)} ${route.path.padEnd(34)} `);

      try {
        const page = await context.newPage();
        await page.route("**/*.{woff,woff2,ttf,otf}", (r) => r.abort());

        await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: outFile,
          fullPage: false,
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
  }

  await browser.close();

  const totalElapsed = Date.now() - totalStart;

  console.log(`\n 완료: ${success}개 성공, ${skipped}개 스킵 (총 ${formatDuration(totalElapsed)})`);
  console.log(`  결과물: ${OUTPUT_DIR}/`);

  if (skipped > 0) {
    console.log(`\n  스킵된 페이지는 dashboard에서 역할별 mockup placeholder로 표시됩니다.`);
  }
}

main().catch((err: unknown) => {
  console.error("\n예기치 않은 오류:", err);
  process.exit(1);
});
