-- ═══════════════════════════════════════════════════════
-- 035_user_badges.sql
-- 회원 등급·뱃지 시스템
-- ═══════════════════════════════════════════════════════

CREATE TYPE user_badge AS ENUM (
  'top_enabler',
  'rising_enabler',
  'verified_startup',
  'power_startup',
  'early_supporter',
  'top_org'
);

CREATE TABLE user_badges (
  user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge     user_badge  NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge)
);

CREATE INDEX idx_user_badges_badge ON user_badges(badge);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 다른 사람 뱃지 조회 가능 (공개 신뢰 정보)
CREATE POLICY "user_badges_select_all" ON user_badges
  FOR SELECT USING (true);

-- super_admin만 뱃지 수정/삭제
CREATE POLICY "user_badges_super_admin" ON user_badges
  FOR ALL
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

-- ═══════════════════════════════════════════════════════
-- RPC: 뱃지 자동 평가 (cron 또는 수동 호출)
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION evaluate_user_badges() RETURNS INT AS $$
DECLARE
  v_count INT := 0;
BEGIN
  -- top_enabler: 평점 4.5+ + 세션 50+
  INSERT INTO user_badges (user_id, badge)
  SELECT user_id, 'top_enabler'
  FROM enabler_profiles
  WHERE rating >= 4.5
    AND session_count >= 50
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- rising_enabler: 신규 + 5세션 이상 + 4.0+ 평점 (20세션 미만)
  INSERT INTO user_badges (user_id, badge)
  SELECT user_id, 'rising_enabler'
  FROM enabler_profiles
  WHERE rating >= 4.0
    AND session_count >= 5
    AND session_count < 20
  ON CONFLICT DO NOTHING;

  -- verified_startup: 1회 이상 completed 세션
  INSERT INTO user_badges (user_id, badge)
  SELECT startup_id, 'verified_startup'
  FROM bookings
  WHERE status = 'completed'
  GROUP BY startup_id
  HAVING COUNT(*) >= 1
  ON CONFLICT DO NOTHING;

  -- power_startup: 5회 이상 completed 세션
  INSERT INTO user_badges (user_id, badge)
  SELECT startup_id, 'power_startup'
  FROM bookings
  WHERE status = 'completed'
  GROUP BY startup_id
  HAVING COUNT(*) >= 5
  ON CONFLICT DO NOTHING;

  -- early_supporter: 2026-06-01 이전 가입자
  INSERT INTO user_badges (user_id, badge)
  SELECT id, 'early_supporter'
  FROM users
  WHERE created_at < '2026-06-01'
  ON CONFLICT DO NOTHING;

  -- top_org: 10명 이상 멤버 org_admin
  INSERT INTO user_badges (user_id, badge)
  SELECT u.id, 'top_org'
  FROM users u
  WHERE u.role = 'org_admin'
    AND u.org_id IS NOT NULL
    AND (
      SELECT COUNT(*)
      FROM users m
      WHERE m.org_id = u.org_id
    ) >= 10
  ON CONFLICT DO NOTHING;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
