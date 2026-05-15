/**
 * AI 아바타 생성 스크립트 (Gemini 2.5 Flash Image — nano-banana)
 * 실행: bun run scripts/generate-avatars.ts
 *
 * 동작:
 *  1. 시드 유저 목록 조회 (is_test = true)
 *  2. avatar_url이 pravatar.cc 패턴인 유저만 처리 (이미 Supabase Storage URL이면 스킵)
 *  3. Gemini 2.5 Flash Image API → 이미지 생성
 *  4. Supabase Storage avatars/{user_id}/headshot.png 업로드
 *  5. public URL로 users.avatar_url UPDATE
 *
 * 비용 안내: 10~20명 생성 시 약 $0.30 ~ $1 예상 (Gemini Flash Image 기준)
 */

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { Buffer } from "node:buffer";

// ─── 환경변수 검증 ────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "오류: 다음 환경변수가 필요합니다: GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

// ─── 클라이언트 초기화 ────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── 유저 타입 ────────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
};

type EnablerProfileRow = {
  user_id: string;
  specialties: string[];
};

// ─── 프롬프트 생성 ────────────────────────────────────────────────────────────

type EthnicityHint = {
  description: string;
  gender: "male" | "female";
};

// enabler 이름 → ethnicity/gender 힌트 매핑
const ENABLER_HINTS: Record<string, EthnicityHint> = {
  "James Park":        { description: "Korean-American man in his 30s",     gender: "male"   },
  "Sarah Chen":        { description: "Chinese-American woman in her 30s",  gender: "female" },
  "Michael O'Brien":   { description: "Irish-American man in his 30s",      gender: "male"   },
  "Priya Mehta":       { description: "Indian-American woman in her 30s",   gender: "female" },
  "David Kim":         { description: "Korean-American man in his 30s",     gender: "male"   },
  "Elena Rodriguez":   { description: "Latina woman in her 30s",            gender: "female" },
  "Marcus Johnson":    { description: "African-American man in his 30s",    gender: "male"   },
  "Yuki Tanaka":       { description: "Japanese-American woman in her 30s", gender: "female" },
  "Alex Nguyen":       { description: "Vietnamese-American man in his 30s", gender: "male"   },
  "Rachel Thompson":   { description: "Caucasian woman in her 30s",         gender: "female" },
};

function buildPrompt(fullName: string, role: string, specialties?: string[]): string {
  const hint = ENABLER_HINTS[fullName];
  const ethnicityDesc = hint?.description ?? "professional person in their 30s";
  const specialtyNote =
    specialties && specialties.length > 0
      ? ` Expert in ${specialties.slice(0, 2).join(" and ")}.`
      : "";

  if (role === "enabler") {
    return (
      `Professional LinkedIn-style headshot photo of a ${ethnicityDesc}, named ${fullName}.` +
      ` Smiling warmly and confidently, wearing business casual attire (blazer or smart casual, no tie).` +
      ` Looking directly at camera. Soft natural lighting, neutral light grey background.` +
      ` Photo-realistic, high detail, sharp focus on face. Square format, head and shoulders framing.` +
      `${specialtyNote}`
    );
  }

  // startup / admin 유저: 중립적 프로페셔널 사진
  return (
    `Professional LinkedIn-style headshot photo of a professional person in their 20s-30s, named ${fullName}.` +
    ` Business casual attire, warm smile, looking at camera. Neutral background, soft lighting.` +
    ` Photo-realistic, head and shoulders framing. Square format.`
  );
}

// ─── pravatar.cc URL 판별 ──────────────────────────────────────────────────────

function isPravatrUrl(url: string | null): boolean {
  return url !== null && url.includes("pravatar.cc");
}

// ─── 5초 카운트다운 ───────────────────────────────────────────────────────────

async function countdown(seconds: number): Promise<void> {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r  ${i}초 후 시작... (취소: Ctrl+C)  `);
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
  }
  process.stdout.write("\r  시작합니다!                      \n");
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Get It Done Work — AI 아바타 생성 (nano-banana) ===\n");
  console.log(
    "⚠️  이 스크립트는 Gemini API 호출 비용이 발생합니다.\n" +
    "    10~20명 생성 시 약 $0.30 ~ $1 예상 (Gemini 2.5 Flash Image 기준).\n"
  );

  await countdown(5);

  // 0. avatars bucket 확인/생성 (042 마이그레이션을 SQL로 별도 적용하지 않아도 동작)
  console.log("\n[0] Storage bucket 확인/생성...");
  const { data: buckets, error: listBucketsErr } = await supabase.storage.listBuckets();
  if (listBucketsErr) {
    console.error("Storage 목록 조회 실패:", listBucketsErr);
    process.exit(1);
  }
  const bucketExists = buckets?.some((b) => b.id === "avatars") ?? false;
  if (!bucketExists) {
    const { error: createBucketErr } = await supabase.storage.createBucket("avatars", {
      public: true,
    });
    if (createBucketErr) {
      console.error("avatars bucket 생성 실패:", createBucketErr);
      process.exit(1);
    }
    console.log("  → avatars bucket 생성 완료 (public read)");
  } else {
    console.log("  → avatars bucket 이미 존재");
  }

  // 1. 시드 유저 조회
  console.log("\n[1] 시드 유저 조회...");
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, full_name, role, avatar_url")
    .eq("is_test", true);

  if (usersErr) {
    console.error("users 조회 실패:", usersErr);
    process.exit(1);
  }

  const allUsers = (users ?? []) as UserRow[];
  const targets = allUsers.filter((u) => isPravatrUrl(u.avatar_url));
  console.log(`  → 전체 시드 유저: ${allUsers.length}명, pravatar.cc 교체 대상: ${targets.length}명`);

  if (targets.length === 0) {
    console.log("  → 교체 대상이 없습니다. (이미 모든 아바타가 생성됐거나 null 상태)");
    return;
  }

  // 2. enabler_profiles 조회 (specialties 프롬프트 활용)
  const enablerIds = targets.filter((u) => u.role === "enabler").map((u) => u.id);
  let enablerSpecialtiesMap = new Map<string, string[]>();

  if (enablerIds.length > 0) {
    const { data: profiles, error: profilesErr } = await supabase
      .from("enabler_profiles")
      .select("user_id, specialties")
      .in("user_id", enablerIds);

    if (profilesErr) {
      console.warn("  경고: enabler_profiles 조회 실패 (프롬프트에 specialties 미포함):", profilesErr);
    } else {
      for (const p of (profiles ?? []) as EnablerProfileRow[]) {
        enablerSpecialtiesMap.set(p.user_id, p.specialties);
      }
    }
  }

  // 3. 각 유저별 AI 이미지 생성 + 업로드
  console.log("\n[2] AI 이미지 생성 및 업로드 시작...\n");

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const user of targets) {
    const specialties = enablerSpecialtiesMap.get(user.id);
    const prompt = buildPrompt(user.full_name, user.role, specialties);

    process.stdout.write(`  처리 중: ${user.full_name} (${user.role})...`);

    try {
      // Gemini 2.5 Flash Image (nano-banana) 호출
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "1:1" },
        },
      });

      const imagePart = result.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data
      );

      if (!imagePart?.inlineData?.data) {
        throw new Error("이미지 데이터 없음 (응답에 inlineData 없음)");
      }

      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      const mimeType: string = imagePart.inlineData.mimeType ?? "image/png";
      const ext = mimeType.includes("jpeg") ? "jpg" : "png";
      const storagePath = `${user.id}/headshot.${ext}`;

      // Supabase Storage 업로드 (upsert)
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadErr) throw new Error(`Storage 업로드 실패: ${uploadErr.message}`);

      // public URL 조회
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData.publicUrl;

      // users.avatar_url UPDATE
      const { error: updateErr } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateErr) throw new Error(`users UPDATE 실패: ${updateErr.message}`);

      process.stdout.write(` 완료\n`);
      successCount++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(` 실패: ${message}\n`);
      failCount++;
    }

    // API 요청 사이 짧은 딜레이 (rate limit 방지)
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  }

  // 4. 결과 요약
  console.log("\n=== 완료 ===");
  console.log(`  성공: ${successCount}명`);
  console.log(`  실패: ${failCount}명`);
  console.log(`  스킵: ${skipCount}명 (이미 Storage URL)`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("예상치 못한 오류:", message);
  process.exit(1);
});
