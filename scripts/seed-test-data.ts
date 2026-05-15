/**
 * 테스트 데이터 시드 스크립트
 * 실행: bun run scripts/seed-test-data.ts
 *
 * 전제조건: migration 007_test_data_flag.sql 이 Supabase 콘솔에서 적용된 상태여야 함.
 * Idempotent: 이미 존재하는 이메일은 createUser 스킵, UPDATE만 수행.
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

// ─── Admin 클라이언트 (서비스 롤) ────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── 상수 ────────────────────────────────────────────────────────────────────

const PASSWORD = "Test!GetItDone2026";
const TOTAL_STEPS = 9;

function step(n: number, msg: string) {
  console.log(`[${n}/${TOTAL_STEPS}] ${msg}`);
}

function fail(msg: string, err: unknown): never {
  console.error(`실패: ${msg}`, err);
  process.exit(1);
}

// ─── 기존 auth 유저 맵 로드 ───────────────────────────────────────────────────

async function loadExistingEmails(): Promise<Map<string, string>> {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) fail("auth.admin.listUsers 실패", error);
  const map = new Map<string, string>();
  for (const u of data.users) {
    if (u.email) map.set(u.email, u.id);
  }
  return map;
}

// ─── auth 유저 생성 또는 기존 ID 반환 ────────────────────────────────────────

async function upsertAuthUser(
  email: string,
  fullName: string,
  existingEmails: Map<string, string>
): Promise<string> {
  const existing = existingEmails.get(email);
  if (existing) {
    console.log(`  → 이미 존재: ${email} (${existing}), createUser 스킵`);
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) fail(`createUser 실패: ${email}`, error);
  return data.user.id;
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Get It Done Work 테스트 데이터 시드 시작 ===\n");

  // 1. 기존 유저 목록 로드
  step(1, "기존 auth 유저 목록 로드...");
  const existingEmails = await loadExistingEmails();
  console.log(`  → 기존 유저 ${existingEmails.size}명 확인`);

  // ─── 2. Test Sandbox 조직 생성 ─────────────────────────────────────────────
  step(2, "Test Sandbox 조직 생성/확인...");
  const { data: existingOrg, error: orgSelectErr } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "test-sandbox")
    .maybeSingle();
  if (orgSelectErr) fail("조직 조회 실패", orgSelectErr);

  let orgId: string;
  if (existingOrg) {
    orgId = existingOrg.id;
    console.log(`  → 이미 존재: org_id=${orgId}`);
  } else {
    const { data: newOrg, error: orgInsertErr } = await supabase
      .from("organizations")
      .insert({
        name: "Test Sandbox",
        slug: "test-sandbox",
        program_name: "Test Program",
        invite_code: "TEST-SBOX",
        is_test: true,
        total_credits: 0, // 크레딧은 Step 7에서 함수로 지급
      })
      .select("id")
      .single();
    if (orgInsertErr) fail("조직 INSERT 실패", orgInsertErr);
    orgId = newOrg.id;
    console.log(`  → 생성 완료: org_id=${orgId}`);
  }

  // ─── 3. 테스트 유저 17명 auth 생성 ────────────────────────────────────────
  step(3, "테스트 유저 auth 계정 생성...");

  const userDefs = [
    { email: "test.superadmin.01@getitdonework.test", fullName: "Test Super Admin" },
    { email: "test.orgadmin.01@getitdonework.test", fullName: "Test Org Admin" },
    // startups
    { email: "test.startup.01@getitdonework.test", fullName: "Test Startup Alpha" },
    { email: "test.startup.02@getitdonework.test", fullName: "Test Startup Beta" },
    { email: "test.startup.03@getitdonework.test", fullName: "Test Startup Gamma" },
    { email: "test.startup.04@getitdonework.test", fullName: "Test Startup Delta" },
    { email: "test.startup.05@getitdonework.test", fullName: "Test Startup Epsilon" },
    // enablers
    { email: "test.enabler.01@getitdonework.test", fullName: "James Park" },
    { email: "test.enabler.02@getitdonework.test", fullName: "Sarah Chen" },
    { email: "test.enabler.03@getitdonework.test", fullName: "Michael O'Brien" },
    { email: "test.enabler.04@getitdonework.test", fullName: "Priya Mehta" },
    { email: "test.enabler.05@getitdonework.test", fullName: "David Kim" },
    { email: "test.enabler.06@getitdonework.test", fullName: "Elena Rodriguez" },
    { email: "test.enabler.07@getitdonework.test", fullName: "Marcus Johnson" },
    { email: "test.enabler.08@getitdonework.test", fullName: "Yuki Tanaka" },
    { email: "test.enabler.09@getitdonework.test", fullName: "Alex Nguyen" },
    { email: "test.enabler.10@getitdonework.test", fullName: "Rachel Thompson" },
  ] as const;

  const ids: Record<string, string> = {};
  for (const def of userDefs) {
    ids[def.email] = await upsertAuthUser(def.email, def.fullName, existingEmails);
  }
  console.log(`  → 총 ${Object.keys(ids).length}명 처리 완료`);

  // ─── 4. public.users 업데이트 ─────────────────────────────────────────────
  step(4, "public.users 역할·플래그·avatar_url 업데이트...");

  const superAdminId = ids["test.superadmin.01@getitdonework.test"];
  const orgAdminId   = ids["test.orgadmin.01@getitdonework.test"];
  const startup01Id  = ids["test.startup.01@getitdonework.test"];
  const startup02Id  = ids["test.startup.02@getitdonework.test"];
  const startup03Id  = ids["test.startup.03@getitdonework.test"];
  const startup04Id  = ids["test.startup.04@getitdonework.test"];
  const startup05Id  = ids["test.startup.05@getitdonework.test"];
  const enabler01Id  = ids["test.enabler.01@getitdonework.test"];
  const enabler02Id  = ids["test.enabler.02@getitdonework.test"];
  const enabler03Id  = ids["test.enabler.03@getitdonework.test"];
  const enabler04Id  = ids["test.enabler.04@getitdonework.test"];
  const enabler05Id  = ids["test.enabler.05@getitdonework.test"];
  const enabler06Id  = ids["test.enabler.06@getitdonework.test"];
  const enabler07Id  = ids["test.enabler.07@getitdonework.test"];
  const enabler08Id  = ids["test.enabler.08@getitdonework.test"];
  const enabler09Id  = ids["test.enabler.09@getitdonework.test"];
  const enabler10Id  = ids["test.enabler.10@getitdonework.test"];

  // avatar_url: pravatar.cc/300?u={userId} — userId를 seed로 일관된 얼굴
  const avatarUrl = (userId: string) => `https://i.pravatar.cc/300?u=${userId}`;

  const userUpdates = [
    { id: superAdminId, role: "super_admin", is_test: true, org_id: null,  full_name: "Test Super Admin" },
    { id: orgAdminId,   role: "org_admin",   is_test: true, org_id: orgId, full_name: "Test Org Admin"   },
    { id: startup01Id,  role: "startup",     is_test: true, org_id: null,  full_name: "Test Startup Alpha"   },
    { id: startup02Id,  role: "startup",     is_test: true, org_id: null,  full_name: "Test Startup Beta"    },
    { id: startup03Id,  role: "startup",     is_test: true, org_id: null,  full_name: "Test Startup Gamma"   },
    { id: startup04Id,  role: "startup",     is_test: true, org_id: null,  full_name: "Test Startup Delta"   },
    { id: startup05Id,  role: "startup",     is_test: true, org_id: null,  full_name: "Test Startup Epsilon" },
    { id: enabler01Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "James Park"       },
    { id: enabler02Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "Sarah Chen"       },
    { id: enabler03Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "Michael O'Brien"  },
    { id: enabler04Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "Priya Mehta"      },
    { id: enabler05Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "David Kim"        },
    { id: enabler06Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "Elena Rodriguez"  },
    { id: enabler07Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "Marcus Johnson"   },
    { id: enabler08Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "Yuki Tanaka"      },
    { id: enabler09Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "Alex Nguyen"      },
    { id: enabler10Id,  role: "enabler",     is_test: true, org_id: null,  full_name: "Rachel Thompson"  },
  ];

  for (const u of userUpdates) {
    const { error } = await supabase
      .from("users")
      .update({
        role: u.role,
        is_test: u.is_test,
        org_id: u.org_id,
        full_name: u.full_name,
        avatar_url: avatarUrl(u.id),
      })
      .eq("id", u.id);
    if (error) fail(`users UPDATE 실패: ${u.id}`, error);
  }
  console.log("  → 완료");

  // ─── 5. 프로파일 생성 ───────────────────────────────────────────────────────
  step(5, "startup_profiles / enabler_profiles UPSERT...");

  // startup_profiles
  const startupProfiles = [
    {
      user_id: startup01Id,
      company_name: "Alpha B2B",
      industry: ["B2B SaaS"],
      stage: "Seed",
      us_goal: "Expand B2B SaaS GTM",
      credit_balance: 100,
      org_id: orgId,
    },
    {
      user_id: startup02Id,
      company_name: "Beta Fintech",
      industry: ["Fintech"],
      stage: "Series A",
      us_goal: "Raise US round",
      credit_balance: 50,
      org_id: null,
    },
    {
      user_id: startup03Id,
      company_name: "Gamma Health",
      industry: ["Healthcare"],
      stage: "Series B",
      us_goal: "FDA + US launch",
      credit_balance: 80,
      org_id: orgId,
    },
    {
      user_id: startup04Id,
      company_name: "Delta Commerce",
      industry: ["E-commerce", "DTC"],
      stage: "Series A",
      us_goal: "US DTC brand launch",
      credit_balance: 60,
      org_id: null,
    },
    {
      user_id: startup05Id,
      company_name: "Epsilon AI",
      industry: ["AI/ML", "SaaS"],
      stage: "Seed",
      us_goal: "AI agent product GTM",
      credit_balance: 40,
      org_id: null,
    },
  ];

  for (const sp of startupProfiles) {
    const { error } = await supabase
      .from("startup_profiles")
      .upsert(sp, { onConflict: "user_id" });
    if (error) fail(`startup_profiles UPSERT 실패: ${sp.user_id}`, error);
  }

  // enabler_profiles (10명)
  const enablerProfiles = [
    {
      user_id: enabler01Id,
      university: "Stanford GSB",
      degree_type: "MBA '23",
      specialties: ["B2B SaaS", "Go-to-Market", "Sales Strategy", "Channel Partnerships"],
      location: "San Francisco, CA",
      bio: "전 Salesforce 엔터프라이즈 AE로 5년간 Fortune 500 고객 담당 후 Stanford GSB에서 MBA를 취득했습니다. 현재 SF 기반 SaaS 스타트업의 fractional CRO로 활동하며, 한국 B2B SaaS 스타트업의 미국 GTM 전략과 첫 엔터프라이즈 고객 확보를 돕고 있습니다. ICP 정의부터 SDR 채용, channel partner 전략까지 실전 경험을 바탕으로 지원합니다.",
      specialty_details: [
        { icon: "◈", title: "B2B SaaS GTM", description: "미국 시장 ICP 정의와 초기 outbound 파이프라인 구축. Sales Navigator 기반 cold outreach 셋업까지 실전 지원." },
        { icon: "◉", title: "Channel Partnerships", description: "AWS Marketplace, Salesforce AppExchange 등 대형 에코시스템 진입과 채널 파트너 발굴·협상 가이드." },
        { icon: "◐", title: "Sales Strategy", description: "SDR/AE 분업 체계 설계와 CRM 파이프라인 구축. 초기 엔터프라이즈 고객 10개사 확보까지 전 과정 지원." },
        { icon: "◑", title: "Go-to-Market", description: "시장 진입 포지셔닝과 메시징 전략 수립. 경쟁사 대비 차별점 정리부터 첫 랜딩 페이지 카피까지 함께 작업합니다." },
      ],
      credit_rate: 3,
      badge_level: "top_rated",
      status: "approved",
      rating: 4.92,
      session_count: 64,
      enabler_score: 94,
      re_request_rate: 82,
    },
    {
      user_id: enabler02Id,
      university: "Wharton",
      degree_type: "MBA '22",
      specialties: ["Fintech", "Banking", "Compliance", "Fundraising", "IR Strategy"],
      location: "New York, NY",
      bio: "Goldman Sachs M&A 어소시에이트로 6년간 금융 섹터 딜을 담당했고, Wharton MBA 이후 뉴욕 소재 fintech 스타트업의 첫 CFO를 역임했습니다. 미국 SEC, FinCEN, 주별 머니 트랜스미터 라이센스 등 규제 환경에 강하며, 시리즈 A/B 라운드 IR 덱 작성과 VC 미팅 prep을 전문으로 합니다.",
      specialty_details: [
        { icon: "◈", title: "IR Strategy", description: "시리즈 A/B 기준 미국 VC 타겟 리스트 매핑과 IR 덱 피드백. 실제 투자자 관점에서 약점을 짚어드립니다." },
        { icon: "◉", title: "Compliance", description: "SEC, FinCEN, 주별 머니 트랜스미터 라이센스 등 미국 핀테크 규제 경로 분석과 우선순위 설정." },
        { icon: "◐", title: "Fundraising", description: "VC 네트워크 연결과 콜드 아웃리치 전략. Wharton 동문 네트워크를 통한 투자자 인트로도 지원합니다." },
        { icon: "◑", title: "Banking & Fintech", description: "미국 은행·결제 인프라 구조와 BaaS 파트너십 선정 가이드. 라이센싱 없이 빠르게 론칭하는 방법을 알려드립니다." },
      ],
      credit_rate: 4,
      badge_level: "top_rated",
      status: "approved",
      rating: 4.87,
      session_count: 51,
      enabler_score: 92,
      re_request_rate: 76,
    },
    {
      user_id: enabler03Id,
      university: "HBS",
      degree_type: "MBA '23",
      specialties: ["Healthcare", "Biotech", "FDA Regulatory", "Clinical Trials", "BD"],
      location: "Boston, MA",
      bio: "J&J 전략기획팀과 Boston Consulting Group 헬스케어 프랙티스를 거쳐 HBS MBA를 마쳤습니다. FDA 510(k), De Novo, PMA 경로에 대한 실전 경험이 있으며, 한국 디지털 헬스·의료기기 스타트업의 미국 임상·규제·BD 전략을 집중적으로 지원합니다. 현재는 Boston의 헬스테크 VC에서 부분 자문을 병행합니다.",
      specialty_details: [
        { icon: "◈", title: "FDA Regulatory", description: "510(k), De Novo, PMA 세 경로의 차이와 실제 심사 타임라인. 어떤 경로가 유리한지 제품 유형별로 판단을 도와드립니다." },
        { icon: "◉", title: "Clinical Trials", description: "미국 IRB 승인 절차와 CRO 선정 기준. 초기 파일럿 임상의 규모·비용·기간을 현실적으로 설계합니다." },
        { icon: "◐", title: "Healthcare BD", description: "미국 병원 시스템(IDN)과 GPO 계약 구조 분석. 첫 파일럿 병원 발굴과 계약 협상 전략을 지원합니다." },
        { icon: "◑", title: "Biotech Strategy", description: "디지털 헬스·의료기기 스타트업의 미국 시장 진입 타이밍과 자금 조달 전략. NIH SBIR 그랜트 활용 방법도 다룹니다." },
      ],
      credit_rate: 3,
      badge_level: "top_rated",
      status: "approved",
      rating: 4.78,
      session_count: 38,
      enabler_score: 90,
      re_request_rate: 71,
    },
    {
      user_id: enabler04Id,
      university: "MIT Sloan",
      degree_type: "MBA '25",
      specialties: ["AI/DeepTech", "Product Strategy", "GTM", "Enterprise Sales"],
      location: "Cambridge, MA",
      bio: "MIT CSAIL 출신 엔지니어로 딥러닝 스타트업 2곳에서 CTO를 역임한 후 MIT Sloan MBA 과정 중입니다. AI/ML 제품의 enterprise 판매 전략과 technical GTM에 특화되어 있으며, 특히 초기 유료 pilot 설계와 엔터프라이즈 보안 심사 통과 경험을 공유합니다.",
      specialty_details: [
        { icon: "◈", title: "AI/DeepTech GTM", description: "AI·ML 제품의 기술적 강점을 비기술 구매자에게 설득하는 메시지 설계. 초기 유료 파일럿 계약 구조까지 함께 잡습니다." },
        { icon: "◉", title: "Enterprise Sales", description: "엔터프라이즈 보안 심사(SOC2, 펜 테스트) 통과 전략과 IT 구매 위원회 공략법. 실제 딜 사이클을 6개월에서 3개월로 단축한 경험을 공유합니다." },
        { icon: "◐", title: "Product Strategy", description: "시장 피드백을 반영한 로드맵 우선순위 설정과 build vs buy 의사결정 프레임워크." },
        { icon: "◑", title: "DeepTech Fundraising", description: "기술 기반 스타트업의 시드~시리즈 A 투자 유치 전략. MIT 동문 투자자 네트워크 연결도 지원합니다." },
      ],
      credit_rate: 3,
      badge_level: "rising_star",
      status: "pending",
      rating: 0,
      session_count: 0,
      enabler_score: 0,
      re_request_rate: 0,
    },
    {
      user_id: enabler05Id,
      university: "Kellogg",
      degree_type: "MBA '22",
      specialties: ["E-commerce", "DTC", "Brand Strategy", "Growth Marketing", "Retention"],
      location: "Chicago, IL",
      bio: "P&G 브랜드 매니저로 북미 FMCG 마케팅을 담당했고, Kellogg MBA 후 Shopify Plus 에이전시와 DTC 브랜드를 공동 창업했습니다. Amazon, Walmart.com, TikTok Shop 입점 전략과 미국 DTC 브랜드 구축 경험을 바탕으로, 한국 소비재·뷰티 브랜드의 미국 론칭을 지원합니다. LTV·CAC 최적화와 이메일/SMS 리텐션 퍼널 설계가 강점입니다.",
      specialty_details: [
        { icon: "◈", title: "DTC Brand Launch", description: "미국 DTC 브랜드 포지셔닝과 첫 300개 주문까지의 그로스 플랜. Amazon vs Shopify 채널 믹스 결정을 도와드립니다." },
        { icon: "◉", title: "Growth Marketing", description: "Meta·TikTok·Google 광고 초기 세팅과 CAC 벤치마크 설정. 처음 $10K 광고비를 가장 효율적으로 쓰는 방법을 알려드립니다." },
        { icon: "◐", title: "Retention & LTV", description: "이메일·SMS 자동화 플로우 설계와 코호트별 LTV 분석. Klaviyo 기반 리텐션 퍼널을 처음부터 함께 구축합니다." },
        { icon: "◑", title: "Brand Strategy", description: "미국 소비자 심리를 반영한 브랜드 스토리텔링과 패키징 전략. K-뷰티·K-푸드의 현지화 포지셔닝 경험이 풍부합니다." },
      ],
      credit_rate: 2,
      badge_level: "top_rated",
      status: "approved",
      rating: 4.83,
      session_count: 47,
      enabler_score: 91,
      re_request_rate: 79,
    },
    {
      user_id: enabler06Id,
      university: "Columbia Business",
      degree_type: "MBA '24",
      specialties: ["Marketplace", "Two-sided Platform", "Network Effects", "Unit Economics"],
      location: "New York, NY",
      bio: "Uber Eats 북미 런치팀과 Airbnb 서플라이 그로스팀에서 양면 마켓플레이스 확장을 직접 경험했습니다. Columbia MBA 졸업 후 현재 뉴욕에서 프리랜서 자문을 하고 있으며, 마켓플레이스 콜드 스타트 문제 해결, 유닛 이코노믹스 모델링, 공급·수요 밸런스 전략에 특화되어 있습니다.",
      specialty_details: [
        { icon: "◈", title: "Marketplace Cold Start", description: "공급·수요 양측을 동시에 키우는 초기 런칭 전술. 지역 클러스터링 전략으로 Uber Eats 신도시 론칭을 6주 만에 BEP 달성한 경험을 공유합니다." },
        { icon: "◉", title: "Unit Economics", description: "Take rate, GMV, contribution margin 설계와 투자자 설득용 유닛 이코노믹스 모델 작성. 건강한 마켓플레이스 지표가 무엇인지 기준을 잡아드립니다." },
        { icon: "◐", title: "Network Effects", description: "네트워크 효과 유형 진단(직접/간접/데이터)과 방어막 구축 전략. 경쟁사 진입 시나리오별 대응 플레이북도 함께 만듭니다." },
        { icon: "◑", title: "Two-sided Platform", description: "공급자 온보딩 인센티브 설계와 품질 관리 메커니즘. Airbnb 서플라이 그로스 전략을 한국 마켓플레이스에 맞게 응용합니다." },
      ],
      credit_rate: 3,
      badge_level: "verified",
      status: "approved",
      rating: 4.65,
      session_count: 29,
      enabler_score: 87,
      re_request_rate: 65,
    },
    {
      user_id: enabler07Id,
      university: "Chicago Booth",
      degree_type: "MBA '23",
      specialties: ["Climate Tech", "Energy", "Hardware", "Manufacturing", "Impact Investing"],
      location: "Austin, TX",
      bio: "Tesla 에너지 부문과 BNEF(BloombergNEF)를 거쳐 Chicago Booth MBA를 마쳤습니다. 클린에너지 및 하드웨어 스타트업의 미국 DOE 그랜트, IRA 세액공제 활용, 제조 파트너십 전략에 강점이 있습니다. 현재 Austin에서 climatetech 액셀러레이터의 멘토로도 활동 중입니다.",
      specialty_details: [
        { icon: "◈", title: "Climate Tech GTM", description: "클린에너지 제품의 미국 유틸리티·기업 고객 세일즈 전략과 PPA 계약 구조 설계." },
        { icon: "◉", title: "DOE Grants & IRA", description: "DOE SBIR/STTR 그랜트와 IRA 세액공제(45X, 48C 등) 활용 전략. 정부 자금을 민간 투자와 병행하는 스택 구조를 알려드립니다." },
        { icon: "◐", title: "Hardware Manufacturing", description: "미국·멕시코·동남아 제조 파트너 선정과 공급망 리스크 관리. 하드웨어 스타트업의 MOQ 협상과 첫 양산 전환 경험을 공유합니다." },
        { icon: "◑", title: "Impact Investing", description: "임팩트 VC 타겟 리스트와 ESG 지표 설계. 재무적 수익과 임팩트 메트릭을 함께 담은 투자자 자료 작성을 지원합니다." },
      ],
      credit_rate: 3,
      badge_level: "verified",
      status: "approved",
      rating: 4.55,
      session_count: 22,
      enabler_score: 84,
      re_request_rate: 58,
    },
    {
      user_id: enabler08Id,
      university: "INSEAD",
      degree_type: "MBA '24",
      specialties: ["Crypto/Web3", "DeFi", "Token Economics", "Protocol Design"],
      location: "Miami, FL",
      bio: "Coinbase 프로덕트팀과 a16z crypto 포트폴리오 자문을 거쳐 INSEAD MBA를 취득했습니다. 토큰 이코노미 설계, DAO 거버넌스, 미국 SEC 가이드라인 대응 전략에 특화되어 있으며, 한국 web3 팀의 미국 법인 설립과 규제 리스크 관리를 집중 지원합니다.",
      specialty_details: [
        { icon: "◈", title: "Token Economics", description: "토큰 발행 구조(베스팅, 유통량, 인플레이션 모델) 설계와 투자자 설득 논리 구성. 지속 가능한 토큰 이코노미 리뷰를 실전 기준으로 해드립니다." },
        { icon: "◉", title: "DeFi Protocol Design", description: "스마트 컨트랙트 거버넌스와 DAO 구조 설계. 프로토콜 런칭 전 법적 리스크와 보안 감사 체크리스트를 함께 검토합니다." },
        { icon: "◐", title: "SEC Compliance", description: "미국 증권법 관점에서 토큰이 증권으로 분류될 리스크 진단. Howey Test 기준 분석과 법인 구조 설계를 자문합니다." },
        { icon: "◑", title: "Web3 Go-to-Market", description: "커뮤니티 주도 성장 전략과 초기 유동성 공급 계획. Coinbase 재직 시 경험을 바탕으로 거래소 상장 전 준비사항을 안내합니다." },
      ],
      credit_rate: 4,
      badge_level: "verified",
      status: "approved",
      rating: 4.43,
      session_count: 17,
      enabler_score: 81,
      re_request_rate: 52,
    },
    {
      user_id: enabler09Id,
      university: "Yale SOM",
      degree_type: "MBA '24",
      specialties: ["EdTech", "K-12", "Corporate L&D", "Product-Led Growth"],
      location: "Atlanta, GA",
      bio: "Coursera 파트너십팀과 뉴욕 에드테크 스타트업 COO를 거쳐 Yale SOM MBA를 마쳤습니다. 미국 K-12 교육구 세일즈 사이클 및 타이틀 원 예산 활용 전략, 기업 L&D 계약 구조에 강점이 있습니다. PLG 기반 에드테크 제품의 미국 초기 트랙션 확보를 집중 지원합니다.",
      specialty_details: [
        { icon: "◈", title: "K-12 Sales Cycle", description: "미국 교육구(District) 구매 의사결정 구조와 Title I 예산 활용 전략. 평균 18개월 세일즈 사이클을 단축하는 접근법을 알려드립니다." },
        { icon: "◉", title: "Corporate L&D", description: "기업 학습·개발 예산 조달과 LMS 도입 결정권자 공략법. Fortune 500 L&D 구매 프로세스를 실전 경험으로 안내합니다." },
        { icon: "◐", title: "Product-Led Growth", description: "에드테크 제품의 프리미엄 전환율 최적화와 바이럴 루프 설계. 교사·학생 개인 사용이 기관 계약으로 이어지는 PLG 플레이북을 제공합니다." },
        { icon: "◑", title: "EdTech Partnerships", description: "Coursera, Udemy, LinkedIn Learning 등 플랫폼 파트너십 계약 구조 분석. 유통 채널로서의 파트너십 협상 전략을 지원합니다." },
      ],
      credit_rate: 2,
      badge_level: "rising_star",
      status: "approved",
      rating: 4.35,
      session_count: 11,
      enabler_score: 78,
      re_request_rate: 44,
    },
    {
      user_id: enabler10Id,
      university: "Tuck (Dartmouth)",
      degree_type: "MBA '22",
      specialties: ["Real Estate Tech", "PropTech", "Construction Tech", "Smart Cities"],
      location: "Denver, CO",
      bio: "JLL 상업용 부동산 애널리스트와 Procore 엔터프라이즈 세일즈를 거쳐 Tuck MBA를 취득했습니다. 미국 상업용 부동산 SaaS의 B2B 세일즈 전략과 건설·시공 테크의 계약 구조 설계에 강점이 있습니다. 현재 Denver에서 proptech 스타트업 두 곳의 자문 이사회에 참여 중입니다.",
      specialty_details: [
        { icon: "◈", title: "PropTech Sales", description: "미국 상업용 부동산 SaaS의 CRE 브로커·자산관리사 대상 세일즈 전략. JLL 재직 경험을 바탕으로 부동산 업계 구매 사이클을 단축하는 방법을 알려드립니다." },
        { icon: "◉", title: "Construction Tech", description: "GC(General Contractor)·서브컨트랙터 대상 시공 테크 도입 전략과 Procore·PlanGrid 에코시스템 파트너십 활용법." },
        { icon: "◐", title: "Smart Cities", description: "미국 지방정부 조달 프로세스(RFP/RFI)와 스마트시티 파일럿 계약 구조. 공공 예산 사이클에 맞춘 영업 타이밍 전략을 안내합니다." },
        { icon: "◑", title: "Real Estate Tech Strategy", description: "미국 프롭테크 시장의 플레이어 지형 분석과 경쟁 포지셔닝. Denver·Austin 등 선벨트 도시의 부동산 시장 트렌드와 연계한 GTM 전략을 설계합니다." },
      ],
      credit_rate: 2,
      badge_level: "verified",
      status: "approved",
      rating: 4.62,
      session_count: 33,
      enabler_score: 86,
      re_request_rate: 68,
    },
  ];

  for (const ep of enablerProfiles) {
    const { error } = await supabase
      .from("enabler_profiles")
      .upsert(ep, { onConflict: "user_id" });
    if (error) fail(`enabler_profiles UPSERT 실패: ${ep.user_id}`, error);
  }
  console.log("  → 완료");

  // ─── 6. 예약 35건+ INSERT ──────────────────────────────────────────────────
  step(6, "bookings INSERT (기존 4건 + 대량 completed 31건)...");

  const now = new Date();
  const dayMs = 86400 * 1000;
  const daysAgo = (d: number) => new Date(now.getTime() - d * dayMs).toISOString();

  // 기존 4건 (기존 유형 유지)
  const legacyBookingDefs = [
    {
      key: "pending",
      startup_id: startup01Id,
      enabler_id: enabler01Id,
      type: "chemistry",
      status: "pending",
      scheduled_at: new Date(now.getTime() + 3 * dayMs).toISOString(),
      credits_amount: 0,
      brief: "첫 만남 테스트",
    },
    {
      key: "confirmed",
      startup_id: startup02Id,
      enabler_id: enabler02Id,
      type: "standard",
      status: "confirmed",
      scheduled_at: new Date(now.getTime() + 7 * dayMs).toISOString(),
      credits_amount: 3,
      brief: "IR 전략 상담",
    },
    {
      key: "completed_legacy",
      startup_id: startup03Id,
      enabler_id: enabler03Id,
      type: "standard",
      status: "completed",
      scheduled_at: daysAgo(14),
      credits_amount: 2,
      brief: "FDA 규제 검토",
      completed_at: daysAgo(13),
    },
    {
      key: "cancelled",
      startup_id: startup01Id,
      enabler_id: enabler02Id,
      type: "standard",
      status: "cancelled",
      scheduled_at: daysAgo(5),
      credits_amount: 3,
      brief: "취소된 세션",
      cancelled_at: daysAgo(6),
      cancel_reason: "일정 변경",
    },
  ] as const;

  // 리뷰 생성용 대량 completed bookings
  // enabler별 3~4건, 다양한 startup 매칭
  type CompletedBookingDef = {
    key: string;
    startup_id: string;
    enabler_id: string;
    type: string;
    status: "completed";
    scheduled_at: string;
    completed_at: string;
    credits_amount: number;
    brief: string;
  };

  const bulkCompletedBookings: CompletedBookingDef[] = [
    // enabler01 (James Park - B2B SaaS)
    { key: "e01_b01", startup_id: startup01Id, enabler_id: enabler01Id, type: "standard",  status: "completed", scheduled_at: daysAgo(80), completed_at: daysAgo(79), credits_amount: 3, brief: "B2B SaaS GTM 전략 1차 미팅" },
    { key: "e01_b02", startup_id: startup02Id, enabler_id: enabler01Id, type: "standard",  status: "completed", scheduled_at: daysAgo(60), completed_at: daysAgo(59), credits_amount: 3, brief: "채널 파트너십 전략 수립" },
    { key: "e01_b03", startup_id: startup04Id, enabler_id: enabler01Id, type: "project",   status: "completed", scheduled_at: daysAgo(40), completed_at: daysAgo(39), credits_amount: 4, brief: "엔터프라이즈 세일즈 파이프라인 설계" },
    { key: "e01_b04", startup_id: startup05Id, enabler_id: enabler01Id, type: "standard",  status: "completed", scheduled_at: daysAgo(20), completed_at: daysAgo(19), credits_amount: 3, brief: "ICP 정의 및 cold outreach 스크립트 리뷰" },
    // enabler02 (Sarah Chen - Fintech)
    { key: "e02_b01", startup_id: startup02Id, enabler_id: enabler02Id, type: "standard",  status: "completed", scheduled_at: daysAgo(75), completed_at: daysAgo(74), credits_amount: 4, brief: "시리즈 A IR 덱 피드백" },
    { key: "e02_b02", startup_id: startup01Id, enabler_id: enabler02Id, type: "standard",  status: "completed", scheduled_at: daysAgo(55), completed_at: daysAgo(54), credits_amount: 4, brief: "fintech 컴플라이언스 리뷰" },
    { key: "e02_b03", startup_id: startup03Id, enabler_id: enabler02Id, type: "chemistry", status: "completed", scheduled_at: daysAgo(35), completed_at: daysAgo(34), credits_amount: 1, brief: "VC 네트워크 미팅 prep" },
    { key: "e02_b04", startup_id: startup05Id, enabler_id: enabler02Id, type: "standard",  status: "completed", scheduled_at: daysAgo(15), completed_at: daysAgo(14), credits_amount: 4, brief: "SEC 규제 대응 전략 상담" },
    // enabler03 (Michael O'Brien - Healthcare)
    { key: "e03_b01", startup_id: startup03Id, enabler_id: enabler03Id, type: "project",   status: "completed", scheduled_at: daysAgo(85), completed_at: daysAgo(84), credits_amount: 3, brief: "FDA 510(k) 신청 전략 수립" },
    { key: "e03_b02", startup_id: startup01Id, enabler_id: enabler03Id, type: "standard",  status: "completed", scheduled_at: daysAgo(65), completed_at: daysAgo(64), credits_amount: 2, brief: "디지털 헬스 BD 파트너십 분석" },
    { key: "e03_b03", startup_id: startup04Id, enabler_id: enabler03Id, type: "standard",  status: "completed", scheduled_at: daysAgo(45), completed_at: daysAgo(44), credits_amount: 2, brief: "임상시험 파트너 선정 기준 리뷰" },
    // enabler05 (David Kim - DTC/E-commerce)
    { key: "e05_b01", startup_id: startup04Id, enabler_id: enabler05Id, type: "standard",  status: "completed", scheduled_at: daysAgo(70), completed_at: daysAgo(69), credits_amount: 2, brief: "DTC 브랜드 포지셔닝 컨설팅" },
    { key: "e05_b02", startup_id: startup02Id, enabler_id: enabler05Id, type: "standard",  status: "completed", scheduled_at: daysAgo(50), completed_at: daysAgo(49), credits_amount: 2, brief: "Amazon 론칭 전략 및 A+ 콘텐츠 리뷰" },
    { key: "e05_b03", startup_id: startup05Id, enabler_id: enabler05Id, type: "chemistry", status: "completed", scheduled_at: daysAgo(30), completed_at: daysAgo(29), credits_amount: 1, brief: "TikTok Shop 엔트리 전략" },
    { key: "e05_b04", startup_id: startup01Id, enabler_id: enabler05Id, type: "standard",  status: "completed", scheduled_at: daysAgo(10), completed_at: daysAgo(9),  credits_amount: 2, brief: "이메일 리텐션 퍼널 설계 리뷰" },
    // enabler06 (Elena Rodriguez - Marketplace)
    { key: "e06_b01", startup_id: startup05Id, enabler_id: enabler06Id, type: "standard",  status: "completed", scheduled_at: daysAgo(72), completed_at: daysAgo(71), credits_amount: 3, brief: "마켓플레이스 콜드 스타트 전략" },
    { key: "e06_b02", startup_id: startup03Id, enabler_id: enabler06Id, type: "standard",  status: "completed", scheduled_at: daysAgo(52), completed_at: daysAgo(51), credits_amount: 3, brief: "유닛 이코노믹스 모델 검토" },
    { key: "e06_b03", startup_id: startup04Id, enabler_id: enabler06Id, type: "project",   status: "completed", scheduled_at: daysAgo(32), completed_at: daysAgo(31), credits_amount: 3, brief: "공급-수요 밸런스 전략 워크샵" },
    // enabler07 (Marcus Johnson - Climate Tech)
    { key: "e07_b01", startup_id: startup01Id, enabler_id: enabler07Id, type: "standard",  status: "completed", scheduled_at: daysAgo(68), completed_at: daysAgo(67), credits_amount: 3, brief: "IRA 세액공제 활용 전략 상담" },
    { key: "e07_b02", startup_id: startup02Id, enabler_id: enabler07Id, type: "chemistry", status: "completed", scheduled_at: daysAgo(48), completed_at: daysAgo(47), credits_amount: 1, brief: "클린에너지 DOE 그랜트 신청 리뷰" },
    { key: "e07_b03", startup_id: startup05Id, enabler_id: enabler07Id, type: "standard",  status: "completed", scheduled_at: daysAgo(28), completed_at: daysAgo(27), credits_amount: 3, brief: "하드웨어 제조 파트너십 전략" },
    // enabler08 (Yuki Tanaka - Web3)
    { key: "e08_b01", startup_id: startup05Id, enabler_id: enabler08Id, type: "standard",  status: "completed", scheduled_at: daysAgo(88), completed_at: daysAgo(87), credits_amount: 4, brief: "토큰 이코노미 설계 검토" },
    { key: "e08_b02", startup_id: startup01Id, enabler_id: enabler08Id, type: "standard",  status: "completed", scheduled_at: daysAgo(58), completed_at: daysAgo(57), credits_amount: 4, brief: "DAO 거버넌스 구조 자문" },
    { key: "e08_b03", startup_id: startup04Id, enabler_id: enabler08Id, type: "chemistry", status: "completed", scheduled_at: daysAgo(38), completed_at: daysAgo(37), credits_amount: 1, brief: "SEC 가이드라인 대응 전략" },
    // enabler09 (Alex Nguyen - EdTech)
    { key: "e09_b01", startup_id: startup02Id, enabler_id: enabler09Id, type: "standard",  status: "completed", scheduled_at: daysAgo(77), completed_at: daysAgo(76), credits_amount: 2, brief: "K-12 교육구 세일즈 사이클 분석" },
    { key: "e09_b02", startup_id: startup03Id, enabler_id: enabler09Id, type: "standard",  status: "completed", scheduled_at: daysAgo(47), completed_at: daysAgo(46), credits_amount: 2, brief: "PLG 기반 에드테크 초기 트랙션 전략" },
    { key: "e09_b03", startup_id: startup05Id, enabler_id: enabler09Id, type: "standard",  status: "completed", scheduled_at: daysAgo(17), completed_at: daysAgo(16), credits_amount: 2, brief: "기업 L&D 계약 구조 리뷰" },
    // enabler10 (Rachel Thompson - PropTech)
    { key: "e10_b01", startup_id: startup04Id, enabler_id: enabler10Id, type: "standard",  status: "completed", scheduled_at: daysAgo(82), completed_at: daysAgo(81), credits_amount: 2, brief: "PropTech B2B 세일즈 전략 수립" },
    { key: "e10_b02", startup_id: startup01Id, enabler_id: enabler10Id, type: "project",   status: "completed", scheduled_at: daysAgo(62), completed_at: daysAgo(61), credits_amount: 2, brief: "건설 SaaS 엔터프라이즈 계약 구조 설계" },
    { key: "e10_b03", startup_id: startup02Id, enabler_id: enabler10Id, type: "standard",  status: "completed", scheduled_at: daysAgo(22), completed_at: daysAgo(21), credits_amount: 2, brief: "스마트 시티 파트너십 전략 상담" },
  ];

  // 기존 테스트 예약 확인
  const allStartupIds = [startup01Id, startup02Id, startup03Id, startup04Id, startup05Id];
  const { data: existingBookings, error: bookingSelectErr } = await supabase
    .from("bookings")
    .select("id, startup_id, enabler_id, status")
    .in("startup_id", allStartupIds);
  if (bookingSelectErr) fail("bookings 조회 실패", bookingSelectErr);

  const bookingIds: Record<string, string> = {};

  // 기존 4건 처리
  for (const bd of legacyBookingDefs) {
    const { key, ...row } = bd;
    const already = existingBookings?.find(
      (b) => b.startup_id === row.startup_id && b.enabler_id === row.enabler_id && b.status === row.status
    );
    if (already) {
      console.log(`  → 이미 존재: booking(${key}), id=${already.id}`);
      bookingIds[key] = already.id;
    } else {
      const { data: newBooking, error: bookingInsertErr } = await supabase
        .from("bookings")
        .insert(row)
        .select("id")
        .single();
      if (bookingInsertErr) fail(`booking INSERT 실패: ${key}`, bookingInsertErr);
      bookingIds[key] = newBooking.id;
      console.log(`  → 생성: booking(${key}), id=${newBooking.id}`);
    }
  }

  // 대량 completed bookings 처리
  let bulkCreated = 0;
  let bulkSkipped = 0;
  for (const bd of bulkCompletedBookings) {
    const { key, ...row } = bd;
    // key 기반 중복 방지 대신, brief + startup_id + enabler_id로 중복 체크
    const already = existingBookings?.find(
      (b) => b.startup_id === row.startup_id && b.enabler_id === row.enabler_id && b.status === "completed"
    );
    // 이미 completed booking이 같은 쌍에 있어도 날짜가 다르면 추가 허용 — brief로 구별
    const { data: briefCheck, error: briefCheckErr } = await supabase
      .from("bookings")
      .select("id")
      .eq("startup_id", row.startup_id)
      .eq("enabler_id", row.enabler_id)
      .eq("brief", row.brief)
      .maybeSingle();
    if (briefCheckErr) fail(`booking brief 조회 실패: ${key}`, briefCheckErr);

    if (briefCheck) {
      bookingIds[key] = briefCheck.id;
      bulkSkipped++;
    } else {
      const { data: newBooking, error: bookingInsertErr } = await supabase
        .from("bookings")
        .insert(row)
        .select("id")
        .single();
      if (bookingInsertErr) fail(`bulk booking INSERT 실패: ${key}`, bookingInsertErr);
      bookingIds[key] = newBooking.id;
      bulkCreated++;
    }
  }
  console.log(`  → 대량 completed bookings: 생성 ${bulkCreated}건, 스킵 ${bulkSkipped}건`);

  // ─── 7. 크레딧 트랜잭션 INSERT ───────────────────────────────────────────────
  step(7, "credit_transactions INSERT...");

  const { data: existingTx, error: txSelectErr } = await supabase
    .from("credit_transactions")
    .select("id, tx_type, description, org_id, startup_id")
    .eq("org_id", orgId);
  if (txSelectErr) fail("credit_transactions 조회 실패", txSelectErr);

  const hasTx = (txType: string, description: string) =>
    existingTx?.some((t) => t.tx_type === txType && t.description === description) ?? false;

  if (!hasTx("purchase", "테스트 시드 초기 지급")) {
    const { error } = await supabase.rpc("grant_credits_to_org", {
      p_org_id: orgId,
      p_amount: 1000,
      p_description: "테스트 시드 초기 지급",
    });
    if (error) fail("grant_credits_to_org 실패", error);
    console.log("  → purchase +1000 완료");
  } else {
    console.log("  → purchase 이미 존재, 스킵");
  }

  if (!hasTx("allocate", "Alpha B2B 크레딧 배분")) {
    const { error } = await supabase.rpc("allocate_credits_to_startup", {
      p_org_id: orgId,
      p_startup_id: startup01Id,
      p_amount: 100,
      p_description: "Alpha B2B 크레딧 배분",
    });
    if (error) fail("allocate startup01 실패", error);
    console.log("  → allocate startup01 +100 완료");
  } else {
    console.log("  → allocate startup01 이미 존재, 스킵");
  }

  if (!hasTx("allocate", "Gamma Health 크레딧 배분")) {
    const { error } = await supabase.rpc("allocate_credits_to_startup", {
      p_org_id: orgId,
      p_startup_id: startup03Id,
      p_amount: 80,
      p_description: "Gamma Health 크레딧 배분",
    });
    if (error) fail("allocate startup03 실패", error);
    console.log("  → allocate startup03 +80 완료");
  } else {
    console.log("  → allocate startup03 이미 존재, 스킵");
  }

  const hasTxStartup03Use = existingTx?.some(
    (t) => t.tx_type === "use" && t.startup_id === startup03Id
  ) ?? false;
  if (!hasTxStartup03Use) {
    const { error } = await supabase.from("credit_transactions").insert({
      tx_type: "use",
      amount: 2,
      startup_id: startup03Id,
      booking_id: bookingIds["completed_legacy"],
      description: "FDA 규제 검토 세션 사용",
      balance_after: 78,
    });
    if (error) fail("credit_transactions use INSERT 실패", error);
    console.log("  → use -2 (startup03) 완료");
  } else {
    console.log("  → use startup03 이미 존재, 스킵");
  }

  const hasTxStartup02Hold = existingTx?.some(
    (t) => t.tx_type === "hold" && t.startup_id === startup02Id
  ) ?? false;
  if (!hasTxStartup02Hold) {
    const { error } = await supabase.from("credit_transactions").insert({
      tx_type: "hold",
      amount: 3,
      startup_id: startup02Id,
      booking_id: bookingIds["confirmed"],
      description: "IR 전략 상담 크레딧 홀드",
      balance_after: 47,
    });
    if (error) fail("credit_transactions hold INSERT 실패", error);
    console.log("  → hold -3 (startup02) 완료");
  } else {
    console.log("  → hold startup02 이미 존재, 스킵");
  }

  // ─── 8. reviews INSERT ────────────────────────────────────────────────────
  step(8, "reviews INSERT...");

  // 기존 리뷰 booking_id 목록 조회
  const { data: existingReviews, error: reviewSelectErr } = await supabase
    .from("reviews")
    .select("booking_id");
  if (reviewSelectErr) fail("reviews 조회 실패", reviewSelectErr);
  const reviewedBookingIds = new Set((existingReviews ?? []).map((r) => r.booking_id as string));

  type ReviewDef = {
    bookingKey: string;
    authorId: string;
    targetId: string;
    rating: number;
    comment: string;
    daysAfterCompleted: number; // completed_at 기준 +N일
  };

  const reviewDefs: ReviewDef[] = [
    // enabler01 (James Park) — rating 4.92 → 5점 위주
    { bookingKey: "e01_b01", authorId: startup01Id, targetId: enabler01Id, rating: 5, comment: "정말 도움됐어요. 미국 진출 첫 시즌 GTM 전략을 구체적으로 잡을 수 있었습니다. ICP 정의부터 초기 cold outreach 스크립트까지 디테일하게 봐주셨어요.", daysAfterCompleted: 1 },
    { bookingKey: "e01_b02", authorId: startup02Id, targetId: enabler01Id, rating: 5, comment: "채널 파트너십 전략에 대해 실전 경험을 바탕으로 이야기해 주셔서 설득력이 있었습니다. 구체적인 파트너 리스트와 접근 방법까지 공유해 주셔서 다음 세션도 잡을 예정입니다.", daysAfterCompleted: 2 },
    { bookingKey: "e01_b03", authorId: startup04Id, targetId: enabler01Id, rating: 5, comment: "엔터프라이즈 세일즈 파이프라인 설계를 처음부터 끝까지 함께 짜주셨어요. SDR 채용 기준부터 CRM 세팅, 첫 엔터프라이즈 계약 구조까지. 비용 대비 효과가 매우 좋았습니다.", daysAfterCompleted: 1 },
    { bookingKey: "e01_b04", authorId: startup05Id, targetId: enabler01Id, rating: 4, comment: "ICP 정의 작업은 유용했는데 일부 내용은 이미 알고 있던 것들이었습니다. 그래도 cold outreach 스크립트 리뷰는 확실히 도움이 됐어요.", daysAfterCompleted: 3 },

    // enabler02 (Sarah Chen) — rating 4.87
    { bookingKey: "e02_b01", authorId: startup02Id, targetId: enabler02Id, rating: 5, comment: "IR 덱 피드백이 정말 날카로웠습니다. 투자자 시각에서 어떤 슬라이드가 약한지 바로 짚어주셨고, 수치 표현 방식도 구체적으로 제안해 주셨어요. 시리즈 A 준비에 큰 도움이 됐습니다.", daysAfterCompleted: 2 },
    { bookingKey: "e02_b02", authorId: startup01Id, targetId: enabler02Id, rating: 5, comment: "예상보다 빠르게 본론 들어가서 효율적이었습니다. fintech 규제 부분은 특히 강점이 있으신 듯했고, FinCEN 등록 절차를 명확하게 설명해 주셔서 많은 도움이 됐어요.", daysAfterCompleted: 1 },
    { bookingKey: "e02_b03", authorId: startup03Id, targetId: enabler02Id, rating: 4, comment: "첫 만남이라 어느 정도 일반적인 이야기를 예상했는데, 생각보다 깊게 들어가 주셨어요. VC 네트워크 소개까지 해주신다고 하셔서 기대됩니다.", daysAfterCompleted: 2 },
    { bookingKey: "e02_b04", authorId: startup05Id, targetId: enabler02Id, rating: 5, comment: "SEC 규제 대응 전략을 이렇게 명확하게 설명해 주신 분은 처음입니다. 토큰 증권 이슈와 일반 SaaS의 차이점, 대응 전략까지 체계적으로 정리해 주셨어요.", daysAfterCompleted: 1 },

    // enabler03 (Michael O'Brien) — rating 4.78
    { bookingKey: "e03_b01", authorId: startup03Id, targetId: enabler03Id, rating: 5, comment: "FDA 510(k) 신청 경로와 타임라인을 실제 사례 기반으로 설명해 주셔서 매우 실용적이었습니다. De Novo vs 510(k) 선택 기준도 명확하게 알 수 있었어요. 강력 추천합니다.", daysAfterCompleted: 2 },
    { bookingKey: "e03_b02", authorId: startup01Id, targetId: enabler03Id, rating: 5, comment: "헬스케어 BD 파트너십 분석에서 미국 병원 조달 프로세스를 처음 알게 됐어요. 예상보다 복잡한 구조였는데 단계별로 설명해 주셔서 이해하기 쉬웠습니다.", daysAfterCompleted: 3 },
    { bookingKey: "e03_b03", authorId: startup04Id, targetId: enabler03Id, rating: 4, comment: "친절하시고 답이 명확합니다. 임상시험 파트너 선정 기준을 체크리스트로 정리해 주셔서 실무에 바로 활용했어요. 다음 세션도 잡을 예정입니다.", daysAfterCompleted: 1 },

    // enabler05 (David Kim) — rating 4.83
    { bookingKey: "e05_b01", authorId: startup04Id, targetId: enabler05Id, rating: 5, comment: "DTC 브랜드 포지셔닝에 대한 인사이트가 탁월했어요. 미국 소비자 감성과 한국 브랜드가 가진 강점을 어떻게 연결할지 구체적인 전략을 제시해 주셨습니다.", daysAfterCompleted: 2 },
    { bookingKey: "e05_b02", authorId: startup02Id, targetId: enabler05Id, rating: 5, comment: "Amazon 론칭 전략이 매우 실전적이었어요. A+ 콘텐츠, 키워드 전략, 리뷰 관리까지 세부적으로 다뤄주셨고, 실제 사례도 많이 공유해 주셔서 바로 적용할 수 있었습니다.", daysAfterCompleted: 1 },
    { bookingKey: "e05_b03", authorId: startup05Id, targetId: enabler05Id, rating: 4, comment: "TikTok Shop이 아직 초기 단계라 정보가 제한적이었지만, 현재 가능한 최선의 전략을 공유해 주셨어요. 앞으로 발전이 기대되는 채널이라 지속적으로 자문 받고 싶습니다.", daysAfterCompleted: 3 },
    { bookingKey: "e05_b04", authorId: startup01Id, targetId: enabler05Id, rating: 5, comment: "이메일 리텐션 퍼널을 처음부터 설계해 주셨어요. Klaviyo 세팅부터 세그먼트 전략, 시퀀스 구성까지. 실행 직후 오픈율이 15%에서 28%로 올랐습니다.", daysAfterCompleted: 2 },

    // enabler06 (Elena Rodriguez) — rating 4.65
    { bookingKey: "e06_b01", authorId: startup05Id, targetId: enabler06Id, rating: 5, comment: "마켓플레이스 콜드 스타트 문제를 이렇게 체계적으로 접근하신 분은 처음이에요. Uber Eats 실제 사례를 기반으로 설명해 주셔서 이론이 아닌 실전 지식을 얻을 수 있었습니다.", daysAfterCompleted: 1 },
    { bookingKey: "e06_b02", authorId: startup03Id, targetId: enabler06Id, rating: 4, comment: "유닛 이코노믹스 모델을 함께 검토해 주셨는데, 우리가 놓치고 있던 변수들을 짚어주셨어요. 기대보다는 살짝 일반론에 그친 부분도 있었지만 전반적으로 만족합니다.", daysAfterCompleted: 2 },
    { bookingKey: "e06_b03", authorId: startup04Id, targetId: enabler06Id, rating: 5, comment: "공급-수요 밸런스 전략 워크샵이 정말 유익했어요. 프레임워크뿐만 아니라 실제 KPI 설정 방법까지 구체적으로 안내해 주셔서 팀 전체가 같은 방향을 바라볼 수 있게 됐습니다.", daysAfterCompleted: 2 },

    // enabler07 (Marcus Johnson) — rating 4.55
    { bookingKey: "e07_b01", authorId: startup01Id, targetId: enabler07Id, rating: 5, comment: "IRA 세액공제 구조를 이렇게 명확하게 설명해 주신 분은 처음이에요. 우리 제품이 어떤 카테고리에 해당하는지, 얼마를 기대할 수 있는지 바로 계산해 주셨습니다.", daysAfterCompleted: 2 },
    { bookingKey: "e07_b02", authorId: startup02Id, targetId: enabler07Id, rating: 4, comment: "DOE 그랜트 신청 프로세스를 개괄적으로 설명해 주셨는데, 우리 섹터와 직접적인 연관성은 좀 부족했어요. 그래도 전반적인 방향성은 잡을 수 있었습니다.", daysAfterCompleted: 1 },
    { bookingKey: "e07_b03", authorId: startup05Id, targetId: enabler07Id, rating: 4, comment: "이미 알고 있던 내용도 많아서 별 5개는 못 드리겠지만, 제조 파트너십 계약 구조에서 새로운 관점을 얻었어요. 특히 IP 보호 조항 부분은 유용했습니다.", daysAfterCompleted: 3 },

    // enabler08 (Yuki Tanaka) — rating 4.43
    { bookingKey: "e08_b01", authorId: startup05Id, targetId: enabler08Id, rating: 5, comment: "토큰 이코노미 설계에 대한 깊이 있는 인사이트를 얻을 수 있었습니다. 이론적 배경과 실제 적용 사례를 균형 있게 설명해 주셔서 매우 유익했어요.", daysAfterCompleted: 2 },
    { bookingKey: "e08_b02", authorId: startup01Id, targetId: enabler08Id, rating: 4, comment: "DAO 거버넌스에 대한 설명은 좋았는데, 우리 비즈니스 맥락에 맞춤화된 조언은 좀 더 원했어요. 일반적인 내용이 많아서 4점 드립니다.", daysAfterCompleted: 1 },
    { bookingKey: "e08_b03", authorId: startup04Id, targetId: enabler08Id, rating: 4, comment: "첫 미팅이라 기대치를 맞춰가는 시간이었어요. SEC 가이드라인의 핵심 포인트는 명확하게 짚어주셨습니다. 다음 단계 자문도 계속 받을 계획입니다.", daysAfterCompleted: 2 },

    // enabler09 (Alex Nguyen) — rating 4.35
    { bookingKey: "e09_b01", authorId: startup02Id, targetId: enabler09Id, rating: 4, comment: "K-12 세일즈 사이클이 생각보다 훨씬 길고 복잡하다는 걸 이 세션에서 처음 제대로 이해했어요. 교육구 예산 구조도 명확하게 설명해 주셨습니다.", daysAfterCompleted: 2 },
    { bookingKey: "e09_b02", authorId: startup03Id, targetId: enabler09Id, rating: 5, comment: "PLG 전략을 에드테크에 적용하는 방식을 구체적으로 보여주셔서 좋았어요. 실제 Coursera 사례도 공유해 주셔서 신뢰가 갔습니다. 강력 추천합니다.", daysAfterCompleted: 1 },
    { bookingKey: "e09_b03", authorId: startup05Id, targetId: enabler09Id, rating: 4, comment: "기업 L&D 계약 구조를 설명해 주셨는데, 우리 제품이 아직 이 시장에 진입하기엔 이르다는 판단을 함께 하게 됐어요. 솔직한 피드백이 오히려 도움이 됐습니다.", daysAfterCompleted: 3 },

    // enabler10 (Rachel Thompson) — rating 4.62
    { bookingKey: "e10_b01", authorId: startup04Id, targetId: enabler10Id, rating: 5, comment: "PropTech B2B 세일즈 전략에서 상업용 부동산 의사결정 구조를 처음 제대로 이해했어요. 복잡한 이해관계자 맵핑 방법을 구체적으로 알려주셨습니다.", daysAfterCompleted: 2 },
    { bookingKey: "e10_b02", authorId: startup01Id, targetId: enabler10Id, rating: 4, comment: "건설 SaaS 계약 구조 설계가 유익했어요. 특히 파일럿 계약 조건 설정 부분은 바로 활용했습니다. 다만 미팅 준비가 조금 더 됐으면 좋았을 것 같아요.", daysAfterCompleted: 1 },
    { bookingKey: "e10_b03", authorId: startup02Id, targetId: enabler10Id, rating: 5, comment: "스마트 시티 파트너십 전략 상담이 기대 이상이었어요. 시 정부 조달 프로세스와 민간 파트너십 구조를 명확하게 구분해 주셔서 어떤 경로로 접근해야 할지 명확해졌습니다.", daysAfterCompleted: 2 },
  ];

  // completed booking의 completed_at 날짜 조회
  const allBulkBookingIds = bulkCompletedBookings
    .map((b) => bookingIds[b.key])
    .filter(Boolean);

  const { data: completedBookingData, error: completedBookingErr } = await supabase
    .from("bookings")
    .select("id, completed_at")
    .in("id", allBulkBookingIds);
  if (completedBookingErr) fail("completed bookings 날짜 조회 실패", completedBookingErr);

  const completedAtMap = new Map<string, string>(
    (completedBookingData ?? []).map((b) => [b.id as string, b.completed_at as string])
  );

  let reviewCreated = 0;
  let reviewSkipped = 0;

  for (const rd of reviewDefs) {
    const bookingId = bookingIds[rd.bookingKey];
    if (!bookingId) {
      console.log(`  → 경고: booking key '${rd.bookingKey}'에 해당하는 booking이 없어 리뷰 스킵`);
      reviewSkipped++;
      continue;
    }
    if (reviewedBookingIds.has(bookingId)) {
      reviewSkipped++;
      continue;
    }

    const completedAt = completedAtMap.get(bookingId);
    const createdAt = completedAt
      ? new Date(new Date(completedAt).getTime() + rd.daysAfterCompleted * dayMs).toISOString()
      : new Date(now.getTime() - 10 * dayMs).toISOString();

    const { error: reviewInsertErr } = await supabase.from("reviews").insert({
      author_id: rd.authorId,
      target_id: rd.targetId,
      booking_id: bookingId,
      rating: rd.rating,
      comment: rd.comment,
      created_at: createdAt,
    });
    if (reviewInsertErr) fail(`review INSERT 실패: booking=${bookingId}`, reviewInsertErr);
    reviewCreated++;
    reviewedBookingIds.add(bookingId);
  }
  console.log(`  → 리뷰 생성 ${reviewCreated}건, 스킵 ${reviewSkipped}건`);

  // ─── 9. 완료 보고 ──────────────────────────────────────────────────────────
  step(9, "완료 검증...");
  console.log("\n=== 시드 완료 ===");
  console.log(`조직 ID  : ${orgId}`);
  console.log("계정 목록:");
  for (const [email, id] of Object.entries(ids)) {
    console.log(`  ${email} → ${id}`);
  }
}

main().catch((err) => {
  console.error("예상치 못한 오류:", err);
  process.exit(1);
});
