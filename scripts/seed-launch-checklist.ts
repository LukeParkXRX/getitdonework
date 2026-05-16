/**
 * 런칭 준비 대시보드 시드 스크립트
 * 실행: bun run scripts/seed-launch-checklist.ts
 *       또는 bun run seed:launch
 *
 * 전제조건: 044_launch_dashboard.sql 마이그레이션이 Supabase 콘솔에서 적용된 상태여야 함.
 * Idempotent: ON CONFLICT DO UPDATE로 중복 실행 안전.
 * 인증: 이메일 화이트리스트 기반 (LAUNCH_DASHBOARD_ALLOWED_EMAILS env 또는 fallback).
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

// ─── 체크리스트 데이터 ────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  category: string;
  category_order: number;
  item_order: number;
  title_ko: string;
  title_en: string;
  description_ko: string;
  description_en: string;
  priority: "P0" | "P1" | "P2";
  needs_value: boolean;
  value_label: string | null;
  value_is_secret: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // ── 카테고리 1: 법인 정보 ──────────────────────────────────────────────
  {
    id: "1.1",
    category: "1. Company Info",
    category_order: 1,
    item_order: 1,
    title_ko: "정식 법인명",
    title_en: "Legal Entity Name",
    description_ko: "미국 주 정부에 등록된 정식 법인명을 확인합니다. Articles of Incorporation에 기재된 이름과 동일해야 합니다.",
    description_en: "Confirm the official legal entity name registered with the state. Must match exactly what appears on the Articles of Incorporation.",
    priority: "P0",
    needs_value: true,
    value_label: "Company Name",
    value_is_secret: false,
  },
  {
    id: "1.2",
    category: "1. Company Info",
    category_order: 1,
    item_order: 2,
    title_ko: "EIN (법인세 번호)",
    title_en: "EIN (Employer Identification Number)",
    description_ko: "IRS로부터 발급받은 9자리 법인 식별번호. Stripe 계정 개설 및 1099 발급에 필수.",
    description_en: "9-digit employer identification number from the IRS. Required for Stripe account setup and 1099 issuance.",
    priority: "P0",
    needs_value: true,
    value_label: "EIN",
    value_is_secret: true,
  },
  {
    id: "1.3",
    category: "1. Company Info",
    category_order: 1,
    item_order: 3,
    title_ko: "등록 사업장 주소",
    title_en: "Registered Business Address",
    description_ko: "미국 내 공식 등록 주소. 주 정부 서류 및 Stripe 계정 주소와 일치해야 합니다.",
    description_en: "Official registered address in the US. Must match the address on state filings and Stripe account.",
    priority: "P0",
    needs_value: true,
    value_label: "Address",
    value_is_secret: false,
  },
  {
    id: "1.4",
    category: "1. Company Info",
    category_order: 1,
    item_order: 4,
    title_ko: "설립 주",
    title_en: "State of Incorporation",
    description_ko: "법인을 설립한 미국 주 (예: Delaware, Wyoming). 세무 및 규정 준수 판단에 필요합니다.",
    description_en: "The US state where the company is incorporated (e.g., Delaware, Wyoming). Required for tax and compliance purposes.",
    priority: "P0",
    needs_value: true,
    value_label: "State",
    value_is_secret: false,
  },
  {
    id: "1.5",
    category: "1. Company Info",
    category_order: 1,
    item_order: 5,
    title_ko: "설립 서류 (Articles of Incorporation)",
    title_en: "Articles of Incorporation PDF",
    description_ko: "주 정부에서 발급받은 설립 확인 서류. Stripe 심사 및 법적 계약 시 필요합니다.",
    description_en: "State-issued incorporation certificate. Needed for Stripe verification and legal agreements.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "1.6",
    category: "1. Company Info",
    category_order: 1,
    item_order: 6,
    title_ko: "공식 서명권자",
    title_en: "Authorized Signer",
    description_ko: "법인을 대표해 계약서에 서명할 수 있는 권한자의 성명과 직책. Stripe 및 법적 문서에 기재됩니다.",
    description_en: "Name and title of the person authorized to sign contracts on behalf of the company. Used for Stripe and legal documents.",
    priority: "P0",
    needs_value: true,
    value_label: "Signer Name + Title",
    value_is_secret: false,
  },

  // ── 카테고리 2: Stripe Live ────────────────────────────────────────────
  {
    id: "2.1",
    category: "2. Stripe Live",
    category_order: 2,
    item_order: 1,
    title_ko: "Stripe 계정 생성",
    title_en: "Stripe Account Created",
    description_ko: "공식 비즈니스 이메일로 Stripe 계정을 생성합니다. 계정명은 법인명과 일치시킵니다.",
    description_en: "Create a Stripe account using the official business email. Account name must match the legal entity name.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "2.2",
    category: "2. Stripe Live",
    category_order: 2,
    item_order: 2,
    title_ko: "Live 모드 활성화",
    title_en: "Live Mode Activation",
    description_ko: "Stripe 대시보드에서 실계정 인증 완료 및 live 모드 활성화. 인증에는 1-3 영업일 소요될 수 있습니다.",
    description_en: "Complete business verification on Stripe dashboard to activate live mode. Verification may take 1-3 business days.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "2.3",
    category: "2. Stripe Live",
    category_order: 2,
    item_order: 3,
    title_ko: "Stripe 공개 키 (Publishable Key)",
    title_en: "STRIPE_PUBLISHABLE_KEY",
    description_ko: "프런트엔드에서 사용하는 Stripe 공개 키 (pk_live_...). 개발 환경과 다르게 live 키로 교체 필요.",
    description_en: "Stripe publishable key for the frontend (pk_live_...). Must replace the test key with the live key.",
    priority: "P0",
    needs_value: true,
    value_label: "pk_live_...",
    value_is_secret: true,
  },
  {
    id: "2.3b",
    category: "2. Stripe Live",
    category_order: 2,
    item_order: 4,
    title_ko: "Stripe 비밀 키 (Secret Key)",
    title_en: "STRIPE_SECRET_KEY",
    description_ko: "서버에서만 사용하는 Stripe 비밀 키 (sk_live_...). 절대 프런트엔드에 노출 금지.",
    description_en: "Stripe secret key for server-side use only (sk_live_...). Never expose to the frontend.",
    priority: "P0",
    needs_value: true,
    value_label: "sk_live_...",
    value_is_secret: true,
  },
  {
    id: "2.4",
    category: "2. Stripe Live",
    category_order: 2,
    item_order: 5,
    title_ko: "Webhook Endpoint + 서명 비밀키",
    title_en: "Webhook Endpoint + STRIPE_WEBHOOK_SECRET",
    description_ko: "Stripe 대시보드에서 live webhook URL을 등록하고 서명 비밀키를 발급받습니다. 결제 상태 동기화에 필수.",
    description_en: "Register live webhook URL on Stripe dashboard and obtain the signing secret. Essential for payment status sync.",
    priority: "P0",
    needs_value: true,
    value_label: "whsec_...",
    value_is_secret: true,
  },
  {
    id: "2.5",
    category: "2. Stripe Live",
    category_order: 2,
    item_order: 6,
    title_ko: "Sales Tax 정책 결정",
    title_en: "Sales Tax Decision",
    description_ko: "Stripe Tax 사용 여부 및 적용 주(State) 결정. 미결정 시 세금 리스크 발생 가능.",
    description_en: "Decide whether to use Stripe Tax and which states to collect sales tax. Unresolved creates tax liability risk.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "2.6",
    category: "2. Stripe Live",
    category_order: 2,
    item_order: 7,
    title_ko: "Payout 주기 결정",
    title_en: "Payout Schedule Decision",
    description_ko: "Enabler에게 지급할 정산 주기 결정 (주간/월간). Stripe Connect 설정과 연동됩니다.",
    description_en: "Decide payout frequency for Enablers (weekly/monthly). Synced with Stripe Connect configuration.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },

  // ── 카테고리 3: Enabler Contractor ────────────────────────────────────
  {
    id: "3.1",
    category: "3. Enabler Contractor",
    category_order: 3,
    item_order: 1,
    title_ko: "W-9 수집 시점 결정",
    title_en: "W-9 Collection Timing Decision",
    description_ko: "Enabler 온보딩 시 또는 지급 전 W-9 수집 정책 결정. 연간 $600 이상 지급 시 1099-NEC 의무 발급.",
    description_en: "Decide when to collect W-9 from Enablers (onboarding vs. pre-payment). Required for 1099-NEC if annual payment exceeds $600.",
    priority: "P0",
    needs_value: true,
    value_label: "Decision",
    value_is_secret: false,
  },
  {
    id: "3.2",
    category: "3. Enabler Contractor",
    category_order: 3,
    item_order: 2,
    title_ko: "1099-NEC 발급 확인",
    title_en: "1099-NEC Issuance Confirmed",
    description_ko: "연간 $600 이상 지급 Enabler에게 1099-NEC 발급 절차 확립 (1월 31일 기한). CPA 또는 세무사와 확인 필수.",
    description_en: "Establish 1099-NEC issuance process for Enablers paid $600+ annually (January 31 deadline). Must confirm with CPA or tax advisor.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "3.3",
    category: "3. Enabler Contractor",
    category_order: 3,
    item_order: 3,
    title_ko: "독립 계약자 계약서",
    title_en: "Independent Contractor Agreement",
    description_ko: "Enabler와 체결할 독립 계약자 계약서 준비. 변호사 검토 권장. Contractor 분류 보호에 필수 문서.",
    description_en: "Prepare an independent contractor agreement for Enablers. Attorney review recommended. Critical document for contractor classification protection.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },

  // ── 카테고리 4: Email ────────────────────────────────────────────────
  {
    id: "4.1",
    category: "4. Email",
    category_order: 4,
    item_order: 1,
    title_ko: "고객 지원 이메일",
    title_en: "support@ Email",
    description_ko: "고객 문의 수신 공식 이메일. 웹사이트 및 이메일 발송 시 표시됩니다.",
    description_en: "Official email for customer inquiries. Displayed on the website and outbound emails.",
    priority: "P1",
    needs_value: true,
    value_label: "support@...",
    value_is_secret: false,
  },
  {
    id: "4.2",
    category: "4. Email",
    category_order: 4,
    item_order: 2,
    title_ko: "발신 전용 이메일",
    title_en: "no-reply@ Email",
    description_ko: "트랜잭션 이메일(영수증, 알림 등) 발신에 사용. 수신 불가 설정 권장.",
    description_en: "Used for transactional emails (receipts, notifications). Recommended to configure as non-receiving.",
    priority: "P1",
    needs_value: true,
    value_label: "no-reply@...",
    value_is_secret: false,
  },
  {
    id: "4.3",
    category: "4. Email",
    category_order: 4,
    item_order: 3,
    title_ko: "법무 이메일 (선택)",
    title_en: "legal@ Email (Optional)",
    description_ko: "법적 통지 수신용 이메일. Privacy Policy 및 Terms에 표기. 초기에는 support@로 대체 가능.",
    description_en: "Email for legal notices. Listed in Privacy Policy and Terms. Can use support@ initially.",
    priority: "P1",
    needs_value: true,
    value_label: "legal@...",
    value_is_secret: false,
  },
  {
    id: "4.4",
    category: "4. Email",
    category_order: 4,
    item_order: 4,
    title_ko: "정산 알림 이메일 (선택)",
    title_en: "payouts@ Email (Optional)",
    description_ko: "Enabler 정산 관련 알림 발송용 이메일. 초기에는 no-reply@로 대체 가능.",
    description_en: "Email for Enabler payout notifications. Can use no-reply@ initially.",
    priority: "P1",
    needs_value: true,
    value_label: "payouts@...",
    value_is_secret: false,
  },

  // ── 카테고리 5: Legal Documents ──────────────────────────────────────
  {
    id: "5.1",
    category: "5. Legal Documents",
    category_order: 5,
    item_order: 1,
    title_ko: "이용약관",
    title_en: "Terms of Service (Lawyer Reviewed)",
    description_ko: "변호사 검토가 완료된 이용약관 PDF. 플랫폼 책임 한계, 분쟁 조항, 준거법 포함 필수.",
    description_en: "Attorney-reviewed Terms of Service PDF. Must include liability limitations, dispute clause, and governing law.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "5.2",
    category: "5. Legal Documents",
    category_order: 5,
    item_order: 2,
    title_ko: "개인정보처리방침",
    title_en: "Privacy Policy PDF",
    description_ko: "CCPA/GDPR 준수 개인정보처리방침. 데이터 수집 항목, 보유 기간, 사용자 권리를 명시합니다.",
    description_en: "CCPA/GDPR-compliant Privacy Policy. Must specify data collection, retention period, and user rights.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "5.3",
    category: "5. Legal Documents",
    category_order: 5,
    item_order: 3,
    title_ko: "환불 정책",
    title_en: "Refund Policy PDF",
    description_ko: "환불 조건, 기간, 절차를 명시한 문서. Stripe 분쟁 해결 및 CS 대응의 기준이 됩니다.",
    description_en: "Document specifying refund conditions, timeframes, and process. Serves as the baseline for Stripe disputes and CS.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "5.4",
    category: "5. Legal Documents",
    category_order: 5,
    item_order: 4,
    title_ko: "이용 규칙 (AUP)",
    title_en: "Acceptable Use Policy PDF",
    description_ko: "플랫폼 허용/금지 행위를 정의한 문서. 계정 제재 및 콘텐츠 모더레이션의 법적 근거.",
    description_en: "Document defining allowed and prohibited platform behavior. Legal basis for account suspension and content moderation.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "5.5",
    category: "5. Legal Documents",
    category_order: 5,
    item_order: 5,
    title_ko: "쿠키 정책",
    title_en: "Cookie Policy PDF",
    description_ko: "사용 쿠키 목록과 목적을 명시한 문서. Cookie Consent 배너와 함께 GDPR 준수에 필요.",
    description_en: "Document listing cookies used and their purpose. Required for GDPR compliance alongside cookie consent banner.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "5.6",
    category: "5. Legal Documents",
    category_order: 5,
    item_order: 6,
    title_ko: "데이터 처리 계약 (DPA)",
    title_en: "DPA Template PDF",
    description_ko: "EU/UK 고객 또는 파트너와 체결하는 데이터 처리 계약 템플릿. GDPR 사업자 의무 준수용.",
    description_en: "Data Processing Agreement template for EU/UK customers or partners. Required for GDPR controller/processor obligations.",
    priority: "P0",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },

  // ── 카테고리 6: Operational Policies ─────────────────────────────────
  {
    id: "6.1",
    category: "6. Operational Policies",
    category_order: 6,
    item_order: 1,
    title_ko: "CS 응답 SLA",
    title_en: "CS Response SLA",
    description_ko: "고객 지원 응답 목표 시간 설정 (예: 24시간 이내). 이용약관 또는 도움말에 명시 권장.",
    description_en: "Set customer support response time target (e.g., within 24 hours). Recommended to state in Terms or Help Center.",
    priority: "P1",
    needs_value: true,
    value_label: "SLA (e.g., 24h)",
    value_is_secret: false,
  },
  {
    id: "6.2",
    category: "6. Operational Policies",
    category_order: 6,
    item_order: 2,
    title_ko: "환불 승인 권한 한도",
    title_en: "Refund Approval Threshold",
    description_ko: "CS 담당자가 승인 없이 처리 가능한 환불 금액 상한선. 그 이상은 에스컬레이션 절차 정의.",
    description_en: "Maximum refund amount CS can approve without escalation. Define escalation procedure for amounts above the threshold.",
    priority: "P1",
    needs_value: true,
    value_label: "Threshold $",
    value_is_secret: false,
  },
  {
    id: "6.3",
    category: "6. Operational Policies",
    category_order: 6,
    item_order: 3,
    title_ko: "분쟁/차지백 처리 SOP",
    title_en: "Dispute / Chargeback SOP",
    description_ko: "Stripe 분쟁 및 신용카드 차지백 발생 시 대응 절차 문서. 증거 제출 기한(7일) 준수용.",
    description_en: "SOP document for handling Stripe disputes and credit card chargebacks. For compliance with 7-day evidence submission deadline.",
    priority: "P1",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "6.4",
    category: "6. Operational Policies",
    category_order: 6,
    item_order: 4,
    title_ko: "Enabler 검증 기준",
    title_en: "Enabler Vetting Criteria",
    description_ko: "Enabler 신청 심사 기준 문서. 경력, 전문성, 배경 확인 기준을 명확히 정의합니다.",
    description_en: "Document defining Enabler application review criteria. Clearly defines experience, expertise, and background check requirements.",
    priority: "P1",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "6.5",
    category: "6. Operational Policies",
    category_order: 6,
    item_order: 5,
    title_ko: "콘텐츠 모더레이션 정책",
    title_en: "Content Moderation Policy",
    description_ko: "플랫폼 내 콘텐츠 위반 분류 및 처리 기준. 신고 접수, 검토, 조치 절차 포함.",
    description_en: "Content violation classification and handling standards. Includes report intake, review, and action procedures.",
    priority: "P1",
    needs_value: false,
    value_label: null,
    value_is_secret: false,
  },
  {
    id: "6.6",
    category: "6. Operational Policies",
    category_order: 6,
    item_order: 6,
    title_ko: "장애 대응 긴급 연락처",
    title_en: "Incident Emergency Contact",
    description_ko: "서비스 장애 발생 시 즉시 연락 가능한 담당자 번호. 한국 개발팀 + 미국 파트너 모두 보유.",
    description_en: "Phone number for immediate contact during service incidents. Both Korea dev team and US partner should have this.",
    priority: "P1",
    needs_value: true,
    value_label: "Phone",
    value_is_secret: true,
  },
];

// ─── 초기 업데이트 ────────────────────────────────────────────────────────────

const INITIAL_UPDATE = {
  author_name: "Korea Dev",
  author_role: "korea_dev" as const,
  type: "milestone" as const,
  title: "Dashboard Launched",
  body: "Welcome! 한국 개발팀이 셋업한 런칭 준비 양방향 대시보드입니다. 이메일 화이트리스트 기반 접근. 등록된 이메일(luke/woosub/sson @xrx.studio + 미국 파트너)만 접속 가능. 좌측 체크리스트에서 항목을 체크하고, 필요한 정보(EIN, API key 등)를 입력해주세요. 질문이 있으면 우측 Updates에서 새 글을 작성해주세요. — Korea Dev",
};

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 런칭 대시보드 시드 시작\n");

  // 1. 체크리스트 항목 업서트
  console.log(`체크리스트 ${CHECKLIST_ITEMS.length}개 항목 업서트 중...`);

  const { error: checklistError } = await supabase
    .from("launch_checklist_items")
    .upsert(
      CHECKLIST_ITEMS.map((item) => ({
        ...item,
        is_complete: false,
        completed_at: null,
        completed_by: null,
        notes: "",
        value: "",
        updated_at: new Date().toISOString(),
      })),
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    );

  if (checklistError) {
    console.error("체크리스트 업서트 실패:", checklistError.message);
    process.exit(1);
  }

  console.log(`✓ 체크리스트 ${CHECKLIST_ITEMS.length}개 항목 완료`);

  // 3. 초기 업데이트 (이미 있으면 건너뜀 — 제목으로 중복 체크)
  const { data: existingUpdate } = await supabase
    .from("launch_updates")
    .select("id")
    .eq("title", INITIAL_UPDATE.title)
    .eq("author_role", INITIAL_UPDATE.author_role)
    .limit(1)
    .single();

  if (!existingUpdate) {
    const { error: updateError } = await supabase
      .from("launch_updates")
      .insert(INITIAL_UPDATE);

    if (updateError) {
      console.error("초기 업데이트 삽입 실패:", updateError.message);
      process.exit(1);
    }
    console.log("✓ 초기 업데이트 삽입 완료");
  } else {
    console.log("✓ 초기 업데이트 이미 존재함 — 건너뜀");
  }

  // 4. 완료 안내 출력
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const allowedEmails =
    process.env.LAUNCH_DASHBOARD_ALLOWED_EMAILS
      ? process.env.LAUNCH_DASHBOARD_ALLOWED_EMAILS.split(",").map((e) => e.trim()).filter(Boolean)
      : ["luke@xrx.studio", "woosub@xrx.studio", "sson@xrx.studio"];

  console.log("\n" + "=".repeat(53));
  console.log("✅ Dashboard ready");
  console.log("=".repeat(53));
  console.log(`\nURL: ${appUrl}/launch`);
  console.log(`     또는 http://localhost:3001/launch (로컬)`);
  console.log(`\nAuthorized emails (env LAUNCH_DASHBOARD_ALLOWED_EMAILS or fallback):`);
  for (const e of allowedEmails) {
    console.log(`  - ${e}`);
  }
  console.log(`\n미국 파트너 이메일을 추가하려면 .env.local의`);
  console.log(`LAUNCH_DASHBOARD_ALLOWED_EMAILS에 콤마로 추가하고`);
  console.log(`dev 서버 재시작 (또는 Vercel env 업데이트 + redeploy).`);
  console.log("=".repeat(53) + "\n");
}

main().catch((err) => {
  console.error("예상치 못한 오류:", err);
  process.exit(1);
});
