-- 020_reviews_moderation.sql
-- reviews 신고·검토·숨김 기능 추가

-- ── 1. reviews 테이블 컬럼 추가 ──────────────────────────────────────────────

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
  ADD COLUMN IF NOT EXISTS report_count INT NOT NULL DEFAULT 0;

-- visible 리뷰 조회 최적화
CREATE INDEX IF NOT EXISTS idx_reviews_hidden ON reviews(hidden_at) WHERE hidden_at IS NULL;

-- ── 2. review_reports 테이블 ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | resolved | dismissed
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (review_id, reporter_id)  -- 같은 리뷰 중복 신고 방지
);

CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_reports_review ON review_reports(review_id);

ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- 본인 신고 INSERT/SELECT
CREATE POLICY "review_reports_insert_own" ON review_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "review_reports_select_own" ON review_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- super_admin 전체 권한
CREATE POLICY "review_reports_super_admin" ON review_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

-- ── 3. 신고 시 report_count 자동 증가 트리거 ─────────────────────────────────

CREATE OR REPLACE FUNCTION increment_review_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews SET report_count = report_count + 1 WHERE id = NEW.review_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_review_report_increment ON review_reports;
CREATE TRIGGER trg_review_report_increment
  AFTER INSERT ON review_reports
  FOR EACH ROW EXECUTE FUNCTION increment_review_report_count();

-- ── 4. reviews SELECT 정책 업데이트 ─────────────────────────────────────────
-- 기존 "review_select" (USING true) 제거 후 hidden 인식 정책으로 교체

DROP POLICY IF EXISTS "review_select" ON reviews;
DROP POLICY IF EXISTS "reviews_select_visible" ON reviews;

CREATE POLICY "reviews_select_visible" ON reviews FOR SELECT
  USING (
    hidden_at IS NULL
    OR auth.uid() = author_id  -- 본인 작성 리뷰는 hidden 상태도 볼 수 있음
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );
