-- enabler_applications에 가입 매칭용 토큰 추가
ALTER TABLE enabler_applications
  ADD COLUMN IF NOT EXISTS signup_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS signup_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_up_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signed_up_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_enabler_applications_signup_token
  ON enabler_applications(signup_token)
  WHERE signup_token IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- RPC: 승인 시 호출 — 토큰 생성 + 반환
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION generate_application_signup_token(
  p_application_id UUID,
  p_expires_days INT DEFAULT 30
) RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  UPDATE enabler_applications
    SET signup_token = v_token,
        signup_token_expires_at = now() + (p_expires_days || ' days')::interval
    WHERE id = p_application_id;
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════
-- RPC: 가입 시 호출 — 토큰으로 application 찾아 enabler_profile 생성·승인
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION claim_enabler_application(
  p_user_id UUID,
  p_signup_token TEXT
) RETURNS enabler_applications AS $$
DECLARE
  v_app enabler_applications;
BEGIN
  SELECT * INTO v_app FROM enabler_applications
    WHERE signup_token = p_signup_token
      AND signed_up_user_id IS NULL
      AND (signup_token_expires_at IS NULL OR signup_token_expires_at > now())
      AND status = 'approved'
    FOR UPDATE;

  IF v_app.id IS NULL THEN
    RAISE EXCEPTION '유효하지 않거나 만료된 토큰입니다.';
  END IF;

  -- 사용자 role을 'enabler'로 변경
  UPDATE users SET role = 'enabler' WHERE id = p_user_id;

  -- enabler_profiles UPSERT (신청 정보 prefill, status='approved' 즉시 활성)
  INSERT INTO enabler_profiles (
    user_id, university, degree_type, specialties, location, bio, credit_rate, status
  ) VALUES (
    p_user_id,
    v_app.university,
    v_app.degree_type,
    v_app.specialties,
    v_app.location,
    v_app.bio,
    v_app.credit_rate,
    'approved'
  ) ON CONFLICT (user_id) DO UPDATE SET
    university = EXCLUDED.university,
    degree_type = EXCLUDED.degree_type,
    specialties = EXCLUDED.specialties,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    credit_rate = EXCLUDED.credit_rate,
    status = 'approved';

  -- 신청서에 사용자 연결 + 토큰 무효화
  UPDATE enabler_applications
    SET signed_up_user_id = p_user_id,
        signed_up_at = now(),
        signup_token = NULL
    WHERE id = v_app.id
    RETURNING * INTO v_app;

  RETURN v_app;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
