-- Sprint 42: 2FA (이메일 OTP) 기반 사용자 2단계 인증

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_method TEXT;  -- 'email' | 추후 'totp'

-- OTP challenge 임시 저장 (5분 만료)
CREATE TABLE IF NOT EXISTS auth_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,        -- sha256 hex
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_user_active
  ON auth_otp_challenges(user_id, used_at, expires_at);

ALTER TABLE auth_otp_challenges ENABLE ROW LEVEL SECURITY;

-- 본인 challenge만 조회 가능; INSERT/UPDATE는 service role만
CREATE POLICY "otp_own_select"
  ON auth_otp_challenges FOR SELECT
  USING (auth.uid() = user_id);
