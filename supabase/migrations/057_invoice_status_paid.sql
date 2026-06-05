-- 057: invoice_status ENUM에 'paid' 값 추가
--
-- 버그: 018_enabler_payouts.sql 에서 invoice_status = ('pending','approved','cancelled') 3개만 정의.
--   그러나 정산 승인 API(src/app/api/admin/payouts/[id]/route.ts:233)가
--   invoices.status 를 'paid' 로 UPDATE 함.
--   → Stripe Transfer 는 성공하는데 DB UPDATE 에서 enum constraint 위반(22P02) → 500.
--   → 송금은 됐으나 invoice 상태는 갱신 실패 = 데이터 불일치.
--
-- 비교: earning_status 에는 019_enabler_payout_accounts.sql:80 에서 이미 'paid' 가 추가됨.
--       enabler_earnings.status='paid'(route.ts:247) 는 정상 동작. invoice_status 만 누락이었음.
--
-- 수정: invoice_status 에 'paid' 추가. IF NOT EXISTS 로 멱등 처리.
-- 주의: PostgreSQL 에서 ALTER TYPE ... ADD VALUE 는 트랜잭션 블록 밖에서 실행되어야 함
--       (Supabase 마이그레이션은 파일 단위 실행이므로 단독 문장으로 안전).

ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'paid';
