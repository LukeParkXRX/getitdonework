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

# 📋 미국 전문가(Enabler) 세무 서류(W-9/W-8BEN) 업로드 기능 추가 계획

- [x] **1단계: 세무 서류 저장소 및 DB 마이그레이션 작성**
  - [supabase/migrations/047_tax_forms_storage.sql](file:///Users/a1/Projects/getitdonework/supabase/migrations/047_tax_forms_storage.sql) 생성: `tax-forms` 비공개(private) 버킷 및 RLS 정책 생성, `enabler_payout_accounts` 테이블에 `tax_form_url` 컬럼 추가.
- [x] **2단계: 백엔드 API 업데이트 (PATCH 핸들러 추가)**
  - [src/app/api/enabler/payout-account/route.ts](file:///Users/a1/Projects/getitdonework/src/app/api/enabler/payout-account/route.ts) 파일에 PATCH 핸들러를 추가하여 `tax_form_type`, `tax_form_url`, `tax_form_completed` 값을 저장할 수 있도록 구현.
- [x] **3단계: 프론트엔드 UI/UX 구현 (PayoutsClient.tsx)**
  - [src/app/(enabler)/enabler-dashboard/payouts/PayoutsClient.tsx](file:///Users/a1/Projects/getitdonework/src/app/(enabler)/enabler-dashboard/payouts/PayoutsClient.tsx) 파일에 세무 양식 유형 선택(W-9 / W-8BEN) 및 PDF/이미지 파일 업로드 인터페이스 추가.
  - 파일 업로드 및 상태 표시(업로드 중, 제출 완료 뱃지, 첨부 파일 다운로드) 구현.
- [/] **4단계: 로컬 빌드 및 동작 검증**
  - 코드에 컴파일 에러가 없는지 타입 체크와 빌드를 수행하고 최종 완료 상태 검증.
