/**
 * 테스트 데이터 클리어 스크립트
 * 실행: bun run scripts/clear-test-data.ts [--yes]
 *
 * --yes 플래그 없으면 삭제 전 confirm 프롬프트 표시.
 * is_test=true인 users + organizations 삭제 (CASCADE로 관련 데이터 자동 정리).
 */

import { createClient } from "@supabase/supabase-js";

// ─── 환경 변수 ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "오류: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function fail(msg: string, err: unknown): never {
  console.error(`실패: ${msg}`, err);
  process.exit(1);
}

// ─── confirm 프롬프트 ────────────────────────────────────────────────────────

async function confirm(): Promise<boolean> {
  process.stdout.write("테스트 데이터를 모두 삭제하시겠습니까? (y/n): ");
  return new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (chunk) => {
      const answer = String(chunk).trim().toLowerCase();
      resolve(answer === "y" || answer === "yes");
    });
  });
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const autoYes = process.argv.includes("--yes");

  if (!autoYes) {
    const ok = await confirm();
    if (!ok) {
      console.log("취소됨.");
      process.exit(0);
    }
  }

  console.log("\n=== 테스트 데이터 삭제 시작 ===\n");

  // 1. is_test=true 유저 + 조직 ID 수집
  const { data: testUsers, error: usersSelectErr } = await supabase
    .from("users")
    .select("id")
    .eq("is_test", true);
  if (usersSelectErr) fail("users 조회 실패", usersSelectErr);
  const testUserIds = (testUsers ?? []).map((u) => u.id);

  const { data: testOrgs, error: orgsSelectErr } = await supabase
    .from("organizations")
    .select("id")
    .eq("is_test", true);
  if (orgsSelectErr) fail("organizations 조회 실패", orgsSelectErr);
  const testOrgIds = (testOrgs ?? []).map((o) => o.id);

  console.log(`[1/5] 삭제 대상: 유저 ${testUserIds.length}명, 조직 ${testOrgIds.length}건`);

  // 2. ON DELETE CASCADE 없는 의존 row 명시적 삭제
  //    참조 관계: reviews → bookings, credit_transactions → users, insights → users
  if (testUserIds.length > 0) {
    // reviews (author_id 또는 target_id 참조)
    const { error: reviewsAuthorErr } = await supabase
      .from("reviews").delete().in("author_id", testUserIds);
    if (reviewsAuthorErr) fail("reviews(author_id) 삭제 실패", reviewsAuthorErr);
    const { error: reviewsTargetErr } = await supabase
      .from("reviews").delete().in("target_id", testUserIds);
    if (reviewsTargetErr) fail("reviews(target_id) 삭제 실패", reviewsTargetErr);

    // credit_transactions (startup_id, enabler_id, org_id 참조)
    const { error: ctxStartupErr } = await supabase
      .from("credit_transactions").delete().in("startup_id", testUserIds);
    if (ctxStartupErr) fail("credit_transactions(startup_id) 삭제 실패", ctxStartupErr);
    const { error: ctxEnablerErr } = await supabase
      .from("credit_transactions").delete().in("enabler_id", testUserIds);
    if (ctxEnablerErr) fail("credit_transactions(enabler_id) 삭제 실패", ctxEnablerErr);
    if (testOrgIds.length > 0) {
      const { error: ctxOrgErr } = await supabase
        .from("credit_transactions").delete().in("org_id", testOrgIds);
      if (ctxOrgErr) fail("credit_transactions(org_id) 삭제 실패", ctxOrgErr);
    }

    // bookings (startup_id, enabler_id 참조) — reviews 이후 삭제 (reviews.booking_id FK)
    const { error: bookingsStartupErr } = await supabase
      .from("bookings").delete().in("startup_id", testUserIds);
    if (bookingsStartupErr) fail("bookings(startup_id) 삭제 실패", bookingsStartupErr);
    const { error: bookingsEnablerErr } = await supabase
      .from("bookings").delete().in("enabler_id", testUserIds);
    if (bookingsEnablerErr) fail("bookings(enabler_id) 삭제 실패", bookingsEnablerErr);

    // insights (author_id 참조)
    const { error: insightsErr } = await supabase
      .from("insights").delete().in("author_id", testUserIds);
    if (insightsErr) fail("insights 삭제 실패", insightsErr);

    console.log(`[2/5] 참조 row 정리 (reviews/credit_transactions/bookings/insights) 완료`);
  } else {
    console.log("[2/5] 참조 row 정리 스킵 (테스트 유저 없음)");
  }

  // 3. public.users 삭제 (profiles 등 CASCADE 자동 정리)
  let deletedUsers = 0;
  if (testUserIds.length > 0) {
    const { error: usersDeleteErr } = await supabase
      .from("users").delete().eq("is_test", true);
    if (usersDeleteErr) fail("users DELETE 실패", usersDeleteErr);
    deletedUsers = testUserIds.length;

    // 4. auth.users 삭제 (admin API)
    for (const uid of testUserIds) {
      const { error: authDeleteErr } = await supabase.auth.admin.deleteUser(uid);
      if (authDeleteErr) {
        console.warn(`  경고: auth 유저 삭제 실패 (${uid}):`, authDeleteErr.message);
      }
    }
    console.log(`[3/5] public.users + auth.users ${deletedUsers}건 삭제 완료`);
  } else {
    console.log("[3/5] 삭제할 테스트 유저 없음");
  }

  // 5. is_test=true 조직 삭제
  const { data: deletedOrgs, error: orgsDeleteErr } = await supabase
    .from("organizations").delete().eq("is_test", true).select("id");
  if (orgsDeleteErr) fail("organizations DELETE 실패", orgsDeleteErr);
  const deletedOrgCount = (deletedOrgs ?? []).length;
  console.log(`[4/5] organizations ${deletedOrgCount}건 삭제 완료`);

  console.log("[5/5] 완료");
  console.log("\n=== 삭제 완료 ===");
  console.log(`유저: ${deletedUsers}건, 조직: ${deletedOrgCount}건 삭제됨`);
}

main().catch((err) => {
  console.error("예상치 못한 오류:", err);
  process.exit(1);
});
