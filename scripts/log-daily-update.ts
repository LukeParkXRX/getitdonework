/**
 * Launch Dashboard 자동 daily update 스크립트
 *
 * 사용법 (한국 개발팀 / Claude 자동화):
 *   bun run log:update --title "Sprint 56 완료" --body "Phase 2 작업 완료"
 *   bun run log:update --title "Stripe webhook 테스트 통과" --type milestone
 *   bun run log:update --title "QA 피드백" --body "..." --type feedback --related-item 2.3
 *
 * 전제조건:
 *   - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경 변수 설정
 *   - 044_launch_dashboard.sql 마이그레이션 적용된 상태
 */

import { createClient } from "@supabase/supabase-js";

// ─── 환경 변수 검증 ────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "오류: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다."
  );
  console.error("  .env.local 파일에 해당 값을 설정해주세요.");
  process.exit(1);
}

// ─── CLI 인자 파싱 ─────────────────────────────────────────────────────────────

type UpdateType = "daily" | "feedback" | "milestone" | "question" | "blocker";

interface Args {
  title: string;
  body: string;
  type: UpdateType;
  relatedItem: string | null;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | null => {
    const idx = argv.indexOf(flag);
    return idx !== -1 && idx + 1 < argv.length ? argv[idx + 1] : null;
  };

  const title = get("--title");
  const body = get("--body") ?? "";
  const rawType = get("--type") ?? "daily";
  const relatedItem = get("--related-item");

  if (!title) {
    console.error("오류: --title 인자가 필요합니다.");
    console.error(
      '  예시: bun run log:update --title "Sprint 56 완료" --body "작업 내용"'
    );
    process.exit(1);
  }

  const validTypes: UpdateType[] = [
    "daily",
    "feedback",
    "milestone",
    "question",
    "blocker",
  ];
  if (!validTypes.includes(rawType as UpdateType)) {
    console.error(
      `오류: --type은 ${validTypes.join(", ")} 중 하나여야 합니다. (입력값: ${rawType})`
    );
    process.exit(1);
  }

  return {
    title,
    body,
    type: rawType as UpdateType,
    relatedItem,
  };
}

// ─── 메인 ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  console.log("\n Launch Dashboard — daily update 등록 중...");
  console.log(`  제목: ${args.title}`);
  console.log(`  유형: ${args.type}`);
  if (args.body) console.log(`  본문: ${args.body.slice(0, 80)}${args.body.length > 80 ? "..." : ""}`);
  if (args.relatedItem) console.log(`  연결 항목: ${args.relatedItem}`);

  const row = {
    author_name: "Korea Dev (Claude)",
    author_role: "korea_dev" as const,
    type: args.type,
    title: args.title,
    body: args.body,
    ...(args.relatedItem ? { related_item_id: args.relatedItem } : {}),
  };

  const { data, error } = await supabase
    .from("launch_updates")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("\n오류: INSERT 실패");
    console.error(`  코드: ${error.code}`);
    console.error(`  메시지: ${error.message}`);
    if (error.hint) console.error(`  힌트: ${error.hint}`);
    process.exit(1);
  }

  const dashboardUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001") +
    "/launch?view=updates";

  console.log("\n 등록 완료!");
  console.log(`  Row ID: ${data.id}`);
  console.log(`  Dashboard: ${dashboardUrl}`);
}

main().catch((err: unknown) => {
  console.error("예기치 않은 오류:", err);
  process.exit(1);
});
