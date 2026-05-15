/**
 * articles-data.ts의 author.avatar URL을 시드 enabler의 실제 Supabase Storage URL로 동기화.
 *
 * 실행: bun run scripts/sync-article-avatars.ts
 *
 * 동작:
 *  1. 시드 enabler 6명(글 author와 매핑된)의 users.avatar_url을 DB에서 조회
 *  2. articles-data.ts 파일을 읽어 정규식으로 author.avatar 라인 교체
 *  3. 변경된 파일 저장
 *
 * 안전성: idempotent (이미 Supabase Storage URL이면 동일 URL로 재기록).
 */

import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("오류: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// article author 이름 → 시드 enabler email 매핑
const AUTHOR_TO_EMAIL: Record<string, string> = {
  "Sarah Chen": "test.enabler.02@getitdonework.test",
  "James Park": "test.enabler.01@getitdonework.test",
  "David Kim": "test.enabler.05@getitdonework.test",
  "Elena Rodriguez": "test.enabler.06@getitdonework.test",
  "Michael O'Brien": "test.enabler.03@getitdonework.test",
  "Marcus Johnson": "test.enabler.07@getitdonework.test",
};

async function main() {
  console.log("=== article avatar 동기화 시작 ===\n");

  const { data: authUsers, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("auth 조회 실패:", listErr);
    process.exit(1);
  }
  const emailToId = new Map<string, string>();
  for (const u of authUsers.users) {
    if (u.email) emailToId.set(u.email, u.id);
  }

  const userIds: string[] = [];
  const nameToId = new Map<string, string>();
  for (const [name, email] of Object.entries(AUTHOR_TO_EMAIL)) {
    const id = emailToId.get(email);
    if (!id) {
      console.warn(`경고: ${email} (${name}) 시드 유저 없음 — 건너뜀`);
      continue;
    }
    userIds.push(id);
    nameToId.set(name, id);
  }

  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .in("id", userIds);
  if (usersErr) {
    console.error("users 조회 실패:", usersErr);
    process.exit(1);
  }

  const idToAvatar = new Map<string, string>();
  for (const u of users ?? []) {
    if (u.avatar_url) idToAvatar.set(u.id, u.avatar_url);
  }

  const nameToAvatar = new Map<string, string>();
  for (const [name, id] of nameToId) {
    const avatar = idToAvatar.get(id);
    if (avatar) nameToAvatar.set(name, avatar);
  }

  console.log(`매핑 완료: ${nameToAvatar.size}/${Object.keys(AUTHOR_TO_EMAIL).length}명\n`);
  for (const [name, url] of nameToAvatar) {
    console.log(`  ${name}: ${url.slice(0, 80)}...`);
  }

  const filePath = "src/app/(public)/insights/articles-data.ts";
  let content = await readFile(filePath, "utf-8");

  let replacedCount = 0;
  for (const [name, newUrl] of nameToAvatar) {
    // pattern: author: { name: "Name", ..., avatar: "..." }
    // 단순화: name 매칭 다음에 나오는 avatar 라인을 교체. 단일 패스로 처리.
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `(name:\\s*"${escapedName}"[\\s\\S]*?avatar:\\s*\\n?\\s*)"[^"]+"`,
      "g"
    );
    const before = content;
    content = content.replace(re, `$1"${newUrl}"`);
    const occurrences = (before.match(re) ?? []).length;
    replacedCount += occurrences;
    console.log(`  ${name}: ${occurrences}건 치환`);
  }

  await writeFile(filePath, content, "utf-8");

  console.log(`\n=== 완료 — 총 ${replacedCount}건 치환됨 ===`);
  console.log("다음 단계: bunx tsc --noEmit 으로 검증 후 git diff 확인");
}

main().catch((err) => {
  console.error("예상치 못한 오류:", err);
  process.exit(1);
});
