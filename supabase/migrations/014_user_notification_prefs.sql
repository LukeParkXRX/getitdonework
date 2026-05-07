-- 사용자 알림 설정을 JSONB 컬럼으로 저장
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL
  DEFAULT '{"session": true, "credit": true, "marketing": false}'::jsonb;
