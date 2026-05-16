/**
 * Launch Hub 시드 스크립트 — 외부 서비스 + 계정 정보
 * 실행: bun run scripts/seed-launch-hub.ts
 *       또는 bun run seed:hub
 *
 * 전제조건: 045_launch_hub.sql 마이그레이션이 Supabase 콘솔에서 적용된 상태여야 함.
 * Idempotent: ON CONFLICT DO UPDATE로 중복 실행 안전.
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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── 외부 서비스 데이터 ───────────────────────────────────────────────────────

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  url: string | null;
  description: string;
  monthly_cost_usd: number;
  cost_note: string;
  is_active: boolean;
  display_order: number;
}

const SERVICES: ServiceRow[] = [
  {
    id: "supabase",
    name: "Supabase",
    category: "Database/Auth",
    url: "https://supabase.com",
    description: "PostgreSQL + Auth + Storage. Production DB + RLS.",
    monthly_cost_usd: 25,
    cost_note: "Pro plan",
    is_active: true,
    display_order: 1,
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "Hosting",
    url: "https://vercel.com",
    description: "Next.js 호스팅 + Edge Functions + cron jobs.",
    monthly_cost_usd: 20,
    cost_note: "Pro plan / seat",
    is_active: true,
    display_order: 2,
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Payment",
    url: "https://stripe.com",
    description: "결제 처리 + Connect (Enabler 정산).",
    monthly_cost_usd: 0,
    cost_note: "거래 수수료 2.9% + $0.30",
    is_active: true,
    display_order: 3,
  },
  {
    id: "livekit",
    name: "LiveKit Cloud",
    category: "Video",
    url: "https://livekit.io",
    description: "1:1 영상 세션 (WebRTC).",
    monthly_cost_usd: 50,
    cost_note: "Build plan",
    is_active: true,
    display_order: 4,
  },
  {
    id: "resend",
    name: "Resend",
    category: "Email",
    url: "https://resend.com",
    description: "트랜잭셔널 이메일 (가입/결제/알림).",
    monthly_cost_usd: 20,
    cost_note: "Pro plan",
    is_active: true,
    display_order: 5,
  },
  {
    id: "sentry",
    name: "Sentry",
    category: "Monitoring",
    url: "https://sentry.io",
    description: "에러 모니터링 + 성능 분석.",
    monthly_cost_usd: 26,
    cost_note: "Team plan",
    is_active: true,
    display_order: 6,
  },
  {
    id: "upstash",
    name: "Upstash Redis",
    category: "Rate Limit",
    url: "https://upstash.com",
    description: "API rate limiting + 임시 캐시.",
    monthly_cost_usd: 0,
    cost_note: "Free tier (요청량 따라 ~$10)",
    is_active: true,
    display_order: 7,
  },
  {
    id: "gemini",
    name: "Google Gemini API",
    category: "AI",
    url: "https://aistudio.google.com",
    description: "Nano Banana — Enabler 아바타 AI 생성.",
    monthly_cost_usd: 5,
    cost_note: "사용량 기반 (~$0.05/이미지)",
    is_active: true,
    display_order: 8,
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    category: "Analytics",
    url: "https://analytics.google.com",
    description: "웹사이트 방문/전환 분석.",
    monthly_cost_usd: 0,
    cost_note: "Free",
    is_active: true,
    display_order: 9,
  },
  {
    id: "github",
    name: "GitHub",
    category: "Code",
    url: "https://github.com",
    description: "코드 저장소 + Actions CI.",
    monthly_cost_usd: 0,
    cost_note: "Free (public repo)",
    is_active: true,
    display_order: 10,
  },
  {
    id: "domain",
    name: "Domain (getitdonework.com)",
    category: "Domain",
    url: null,
    description: "사이트 도메인 등록.",
    monthly_cost_usd: 1.25,
    cost_note: "$15/yr 환산",
    is_active: true,
    display_order: 11,
  },
  // ─ AI 개발 도구 (한국 개발팀이 코드 생산에 사용) ─
  {
    id: "anthropic-claude",
    name: "Anthropic Claude (Claude Code)",
    category: "AI Development",
    url: "https://www.anthropic.com/claude-code",
    description: "한국 개발팀의 메인 코딩 AI. 모든 코드 작성·리뷰·디버깅·문서화·시드 자동화에 사용 (Sprint 1~55 전부). 본 dashboard도 Claude Code로 구현됨.",
    monthly_cost_usd: 200,
    cost_note: "Claude Max plan $200/mo (Opus 4.7 1M context 포함)",
    is_active: true,
    display_order: 12,
  },
  {
    id: "openai",
    name: "OpenAI ChatGPT / API",
    category: "AI Development",
    url: "https://openai.com",
    description: "보조 LLM — 디자인 컨설팅, 카피라이팅, 비교 검증 용도.",
    monthly_cost_usd: 20,
    cost_note: "ChatGPT Plus $20/mo (선택)",
    is_active: true,
    display_order: 13,
  },
  {
    id: "cursor",
    name: "Cursor IDE",
    category: "AI Development",
    url: "https://cursor.com",
    description: "AI-first 코드 에디터. 한국 개발팀의 보조 IDE (선택적).",
    monthly_cost_usd: 20,
    cost_note: "Pro plan $20/mo (사용 시)",
    is_active: false,
    display_order: 14,
  },
  // ─ 협업 도구 ─
  {
    id: "notion",
    name: "Notion",
    category: "Collaboration",
    url: "https://notion.so",
    description: "기획·요구사항·디자인 문서 작성 (한국팀 → 개발 위임 시 source).",
    monthly_cost_usd: 10,
    cost_note: "Plus $10/seat (선택, Free 플랜으로도 가능)",
    is_active: false,
    display_order: 15,
  },
  {
    id: "figma",
    name: "Figma",
    category: "Design",
    url: "https://figma.com",
    description: "UI 디자인·프로토타입·핸드오프. 디자인 시스템 (DESIGN.md) 시각 reference.",
    monthly_cost_usd: 0,
    cost_note: "Free 플랜 사용 중 (필요 시 Pro $15/mo)",
    is_active: false,
    display_order: 16,
  },
];

// ─── 계정 정보 데이터 ─────────────────────────────────────────────────────────

interface AccountRow {
  id: string;
  name: string;
  account_id: string;
  url: string | null;
  description: string;
  notes: string;
  display_order: number;
}

const ACCOUNTS: AccountRow[] = [
  // ─ 코드 저장소 / CI ─
  {
    id: "github-repo",
    name: "GitHub Repository",
    account_id: "LukeParkXRX/getitdonework",
    url: "https://github.com/LukeParkXRX/getitdonework",
    description: "메인 코드 저장소. main 브랜치 자동 배포 (Vercel).",
    notes: "Owner: LukeParkXRX (Luke). 미국 파트너 collaborator 추가 시 GitHub 핸들 알려주세요.",
    display_order: 1,
  },
  {
    id: "github-actions",
    name: "GitHub Actions (CI)",
    account_id: "LukeParkXRX/getitdonework",
    url: "https://github.com/LukeParkXRX/getitdonework/actions",
    description: "PR/push 시 자동 빌드·린트·E2E (Sprint 36에서 셋업).",
    notes: "비용 무료 (public repo).",
    display_order: 2,
  },
  // ─ 호스팅 / 배포 ─
  {
    id: "vercel",
    name: "Vercel Project",
    account_id: "getitdonework (LukeParkXRX team 추정)",
    url: "https://vercel.com/dashboard",
    description: "Next.js 16 prod 호스팅 + Edge Functions + 4 cron jobs.",
    notes: "Production 도메인: getitdonework.com. 환경변수(LAUNCH_DASHBOARD_ALLOWED_EMAILS, STRIPE_*) 등록 필요.",
    display_order: 3,
  },
  // ─ 도메인 ─
  {
    id: "domain-registrar",
    name: "Domain Registrar",
    account_id: "getitdonework.com",
    url: null,
    description: "도메인 등록 + DNS 관리. Vercel A/CNAME 레코드 연결됨.",
    notes: "등록처(가비아/Cloudflare/Namecheap 등) + 갱신일 채워주세요.",
    display_order: 4,
  },
  // ─ DB / Auth / Storage ─
  {
    id: "supabase",
    name: "Supabase Project",
    account_id: "isgkgywrkonlqrhfipes",
    url: "https://supabase.com/dashboard/project/isgkgywrkonlqrhfipes",
    description: "PostgreSQL DB + Auth + Storage(avatars bucket). RLS 정책 적용. 마이그레이션 45개 누적.",
    notes: "Org: LukeParkXRX's Org · Plan: Pro · 한국팀 자체 결제 중.",
    display_order: 5,
  },
  // ─ 결제 ─
  {
    id: "stripe",
    name: "Stripe Account",
    account_id: "(미국 법인 명의로 신규 발급 예정)",
    url: "https://dashboard.stripe.com",
    description: "결제 처리 + Connect (Enabler 정산). Live mode 검증 1~5일 소요.",
    notes: "체크리스트 2번 카테고리(Stripe Live) 완료되면 EIN/은행 등록 후 API 키 발급.",
    display_order: 6,
  },
  // ─ 이메일 ─
  {
    id: "resend",
    name: "Resend Account",
    account_id: "(getitdonework 도메인으로 신규 등록 예정)",
    url: "https://resend.com/dashboard",
    description: "트랜잭셔널 이메일 (가입/결제/세션/주간 다이제스트). 현재 dev: onboarding@resend.dev.",
    notes: "Prod 전환 시 noreply@getitdonework.com 도메인 인증 (SPF/DKIM/DMARC) 필요.",
    display_order: 7,
  },
  // ─ 영상 ─
  {
    id: "livekit",
    name: "LiveKit Cloud Project",
    account_id: "move37-kx21p4j3",
    url: "https://cloud.livekit.io",
    description: "WebRTC 1:1 영상 세션 인프라. Pre-call lobby + 자동 완료 + 시간 가드.",
    notes: "URL: wss://move37-kx21p4j3.livekit.cloud · API key/secret은 Vercel env 등록.",
    display_order: 8,
  },
  // ─ Rate limit ─
  {
    id: "upstash",
    name: "Upstash Redis",
    account_id: "(Free tier 사용 중)",
    url: "https://console.upstash.com",
    description: "API rate limiting + 임시 캐시 (Sprint 39).",
    notes: "Free tier 한도 초과 시 ~$10/mo 유료 전환.",
    display_order: 9,
  },
  // ─ 모니터링 ─
  {
    id: "sentry",
    name: "Sentry Project",
    account_id: "(env: SENTRY_ORG / SENTRY_PROJECT)",
    url: "https://sentry.io",
    description: "에러 모니터링 + 성능 분석 + 소스맵 업로드.",
    notes: "Team plan $26/mo. 알림 채널(Slack/이메일) 연동 권장.",
    display_order: 10,
  },
  // ─ 분석 ─
  {
    id: "ga4",
    name: "Google Analytics 4",
    account_id: "(env: NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX)",
    url: "https://analytics.google.com",
    description: "웹사이트 방문/전환/funnel 분석.",
    notes: "Free. Conversion event 정의 필요 (signup/booking/purchase).",
    display_order: 11,
  },
  // ─ AI 개발 도구 ─
  {
    id: "anthropic",
    name: "Anthropic Console (Claude)",
    account_id: "luke@xrx.studio (한국팀 본인 계정)",
    url: "https://console.anthropic.com",
    description: "Claude Code (Opus 4.7 1M context) — 한국 개발팀의 메인 코딩 AI. 본 프로젝트 거의 모든 코드를 Claude Code로 생산.",
    notes: "Max plan $200/mo. 미국 파트너는 별도 계정 불필요 — 한국팀 자체 사용.",
    display_order: 12,
  },
  {
    id: "google-aistudio",
    name: "Google AI Studio (Gemini)",
    account_id: "(env: GEMINI_API_KEY)",
    url: "https://aistudio.google.com/apikey",
    description: "Gemini 2.5 Flash Image (nano-banana) — Enabler AI 아바타 생성.",
    notes: "사용량 기반 (~$0.05/이미지, 17명 1회 생성 ~$1).",
    display_order: 13,
  },
  {
    id: "openai",
    name: "OpenAI Platform",
    account_id: "(보조 LLM, 옵션)",
    url: "https://platform.openai.com",
    description: "보조 LLM — 디자인 컨설팅, 카피라이팅, 비교 검증.",
    notes: "필수 아님. 사용 시 ChatGPT Plus $20/mo 또는 API 사용량 청구.",
    display_order: 14,
  },
  // ─ 운영 메일 ─
  {
    id: "google-workspace",
    name: "Google Workspace (운영 메일)",
    account_id: "(미국 파트너 셋업 예정)",
    url: "https://workspace.google.com",
    description: "운영 메일 호스팅 — support@/no-reply@/legal@/payouts@ @getitdonework.com.",
    notes: "체크리스트 4번 카테고리(Email) 완료 시 발급. $7/user/mo.",
    display_order: 15,
  },
  // ─ 한국팀 도메인 (참조) ─
  {
    id: "xrx-studio",
    name: "XRX Studio (한국 개발팀)",
    account_id: "luke@xrx.studio · info@xrx.studio · woosub@xrx.studio · sson@xrx.studio",
    url: "https://xrx.studio",
    description: "한국 개발팀 운영 도메인. Git 커밋 author email = info@xrx.studio.",
    notes: "Launch Dashboard 화이트리스트 이메일 = luke/woosub/sson @xrx.studio.",
    display_order: 16,
  },
];

// ─── 시드 실행 ────────────────────────────────────────────────────────────────

async function seedServices(): Promise<void> {
  console.log(`\n[1/2] launch_services 시드 중... (${SERVICES.length}건)`);

  const { error } = await supabase.from("launch_services").upsert(SERVICES, {
    onConflict: "id",
  });

  if (error) {
    console.error("  ✗ launch_services 오류:", error.message);
    throw error;
  }

  console.log(`  ✓ ${SERVICES.length}건 완료`);
}

async function seedAccounts(): Promise<void> {
  console.log(`\n[2/2] launch_accounts 시드 중... (${ACCOUNTS.length}건)`);

  const { error } = await supabase.from("launch_accounts").upsert(ACCOUNTS, {
    onConflict: "id",
  });

  if (error) {
    console.error("  ✗ launch_accounts 오류:", error.message);
    throw error;
  }

  console.log(`  ✓ ${ACCOUNTS.length}건 완료`);
}

async function main(): Promise<void> {
  console.log("=".repeat(55));
  console.log("Launch Hub 시드 스크립트");
  console.log("=".repeat(55));
  console.log("전제조건: 045_launch_hub.sql 마이그레이션 적용 완료");

  await seedServices();
  await seedAccounts();

  // 비용 합계 계산
  const fixedTotal = SERVICES.reduce((sum, s) => sum + s.monthly_cost_usd, 0);
  console.log(`\n월 고정 비용 합계: $${fixedTotal.toFixed(2)}/mo`);
  console.log("(사용량 기반 항목 별도: Stripe 수수료, Upstash, Gemini API)");

  console.log("\n" + "=".repeat(55));
  console.log("✅ Launch Hub 시드 완료");
  console.log("=".repeat(55));
  console.log("\n다음 단계:");
  console.log("  - /launch?view=services 에서 서비스 목록 확인");
  console.log("  - /launch?view=accounts 에서 계정 ID 업데이트");
  console.log("=".repeat(55) + "\n");
}

main().catch((err: unknown) => {
  console.error("예상치 못한 오류:", err);
  process.exit(1);
});
