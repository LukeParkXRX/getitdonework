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
  {
    id: "github",
    name: "GitHub Repo",
    account_id: "LukeParkXRX/getitdonework",
    url: "https://github.com/LukeParkXRX/getitdonework",
    description: "메인 코드 저장소",
    notes: "",
    display_order: 1,
  },
  {
    id: "vercel",
    name: "Vercel Project",
    account_id: "",
    url: "",
    description: "Next.js 호스팅",
    notes: "프로젝트 ID 채워주세요",
    display_order: 2,
  },
  {
    id: "supabase",
    name: "Supabase Project",
    account_id: "isgkgywrkonlqrhfipes",
    url: "https://supabase.com/dashboard/project/isgkgywrkonlqrhfipes",
    description: "DB/Auth/Storage",
    notes: "",
    display_order: 3,
  },
  {
    id: "stripe",
    name: "Stripe Account",
    account_id: "",
    url: "https://dashboard.stripe.com",
    description: "결제",
    notes: "Live mode 활성화 후 채움",
    display_order: 4,
  },
  {
    id: "resend",
    name: "Resend Account",
    account_id: "",
    url: "https://resend.com/dashboard",
    description: "이메일 발송",
    notes: "",
    display_order: 5,
  },
  {
    id: "sentry",
    name: "Sentry Project",
    account_id: "",
    url: "https://sentry.io",
    description: "에러 모니터링",
    notes: "",
    display_order: 6,
  },
  {
    id: "livekit",
    name: "LiveKit Project",
    account_id: "",
    url: "https://cloud.livekit.io",
    description: "영상 인프라",
    notes: "",
    display_order: 7,
  },
  {
    id: "ga4",
    name: "Google Analytics",
    account_id: "",
    url: "https://analytics.google.com",
    description: "방문 분석",
    notes: "",
    display_order: 8,
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
