-- 046: users.two_factor_passed_at — 2FA OTP 검증 통과 시각
--
-- 2FA enabled 사용자가 OTP 검증 통과 후 12시간 이내에만 보호 라우트 접근.
-- 미통과 또는 12시간 경과 시 /login/2fa-challenge로 리다이렉트.
--
-- NULL = 한 번도 통과 못함 (또는 2FA 미사용).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_passed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN users.two_factor_passed_at IS
  '2FA OTP 마지막 검증 통과 시각. enabled=true 사용자가 보호 라우트 접근 시 12h 윈도우 체크에 사용.';
