-- 028_onboarding_state.sql
-- onboarding 완료 시각 기록. 이미 컬럼이 있으면 skip.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
