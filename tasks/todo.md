# 📋 api/notifications 500 에러 및 화면 깜빡임 디버깅 계획

- [x] **1단계: API 에러 로깅 활성화**
  - [src/app/api/notifications/route.ts](file:///Users/a1/Projects/getitdonework/src/app/api/notifications/route.ts) 파일의 GET 및 PATCH 함수 내 `catch` 블록에 상세 에러 로깅 (`console.error`) 추가하기.
- [x] **2단계: 로컬 테스트 및 오류 원인 분석**
  - 로컬 DB 검사 및 Vercel 실시간 환경 분석을 통해 `notifications` 및 관련 테이블들 누락 확인.
- [x] **3단계: 에러 원인 해결**
  - 010번부터 043번까지의 수정된 마이그레이션을 Supabase SQL Editor를 통해 운영 DB에 실행 완료.
- [x] **4단계: 깜빡임 현상 검증 및 코드 정리**
  - 500 에러 및 깜빡임 해결 확인 완료.

---

# 📋 미국 전문가(Enabler) 세무 서류(W-9/W-8BEN) 업로드 및 어드민 관리 기능 추가 계획

- [x] **1단계: 세무 서류 저장소 및 DB 마이그레이션 작성**
  - [supabase/migrations/047_tax_forms_storage.sql](file:///Users/a1/Projects/getitdonework/supabase/migrations/047_tax_forms_storage.sql) 생성: `tax-forms` 비공개(private) 버킷 및 RLS 정책 생성, `enabler_payout_accounts` 테이블에 `tax_form_url` 컬럼 추가.
- [x] **2단계: 백엔드 API 업데이트 (PATCH 핸들러 추가)**
  - [src/app/api/enabler/payout-account/route.ts](file:///Users/a1/Projects/getitdonework/src/app/api/enabler/payout-account/route.ts) 파일에 PATCH 핸들러를 추가하여 `tax_form_type`, `tax_form_url`, `tax_form_completed` 값을 저장할 수 있도록 구현.
- [x] **3단계: 프론트엔드 UI/UX 구현 (PayoutsClient.tsx)**
  - [src/app/(enabler)/enabler-dashboard/payouts/PayoutsClient.tsx](file:///Users/a1/Projects/getitdonework/src/app/(enabler)/enabler-dashboard/payouts/PayoutsClient.tsx) 파일에 세무 양식 유형 선택 및 파일 업로드 인터페이스 추가.
- [x] **4단계: 로컬 빌드 및 동작 검증 (1차)**
  - 코드에 컴파일 에러가 없는지 타입 체크와 빌드를 수행하고 최종 완료 상태 검증.
- [x] **5단계: 론칭 체크리스트 각 항목 파일 업로드 기능 구현**
  - [supabase/migrations/048_launch_checklist_file.sql](file:///Users/a1/Projects/getitdonework/supabase/migrations/048_launch_checklist_file.sql) DB 마이그레이션 작성 및 스토리지 버킷 생성.
  - [src/app/api/launch/checklist/[id]/upload/route.ts](file:///Users/a1/Projects/getitdonework/src/app/api/launch/checklist/[id]/upload/route.ts) 파일 업로드 API 구현.
  - [src/app/api/launch/checklist/[id]/download/route.ts](file:///Users/a1/Projects/getitdonework/src/app/api/launch/checklist/[id]/download/route.ts) 파일 다운로드 (임시 서명 링크 리다이렉트) API 구현.
  - [src/app/api/launch/checklist/[id]/route.ts](file:///Users/a1/Projects/getitdonework/src/app/api/launch/checklist/[id]/route.ts) PATCH 핸들러에서 파일 관련 필드 수정 연동.
  - [src/app/launch/LaunchDashboard.tsx](file:///Users/a1/Projects/getitdonework/src/app/launch/LaunchDashboard.tsx) 체크리스트 UI에 파일 업로드/다운로드/삭제 인터페이스 및 핸들러 추가.
- [x] **6단계: 어드민 관리 대시보드 세무 정보 UI/UX 구현**
  - [src/app/(admin)/admin/enablers/page.tsx](file:///Users/a1/Projects/getitdonework/src/app/(admin)/admin/enablers/page.tsx) DB fetch 쿼리에 `enabler_payout_accounts` join 연동.
  - [src/app/(admin)/admin/enablers/EnablersAdminClient.tsx](file:///Users/a1/Projects/getitdonework/src/app/(admin)/admin/enablers/EnablersAdminClient.tsx) 세무 정보 컬럼 레이아웃 추가 및 다운로드 버튼 연동.
  - [src/app/(admin)/admin/payouts/[id]/page.tsx](file:///Users/a1/Projects/getitdonework/src/app/(admin)/admin/payouts/[id]/page.tsx) 정산 상세 데이터에 세무 정보 추가 수집.
  - [src/app/(admin)/admin/payouts/[id]/PayoutDetailClient.tsx](file:///Users/a1/Projects/getitdonework/src/app/(admin)/admin/payouts/[id]/PayoutDetailClient.tsx) 정산 상세 세무 미제출 경고 배너 및 보류 안내, 서류 다운로드 제공.
- [x] **7단계: 최종 로컬 빌드 및 동작 검증 (2차)**
  - `bun run typecheck` 및 `bun run build` 실행하여 검증.
