-- Sprint 42: 사용자 본인 활동 로그

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_activity_type') THEN
    CREATE TYPE user_activity_type AS ENUM (
      'login_success',
      'login_failed',
      'logout',
      'password_changed',
      'email_changed',
      '2fa_enabled',
      '2fa_disabled',
      'profile_updated',
      'data_downloaded',
      'account_deletion_requested'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type user_activity_type NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user
  ON user_activity_log(user_id, created_at DESC);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- 본인 로그 조회
CREATE POLICY "activity_log_own_select"
  ON user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

-- super_admin 전체 접근
CREATE POLICY "activity_log_super_admin"
  ON user_activity_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );
