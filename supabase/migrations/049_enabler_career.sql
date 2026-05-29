-- Enabler 경력/커리어 정보 (스타트업이 멘토의 이력을 평가할 수 있도록)
-- career: [{ company, title, period, description }] 형태의 JSONB 배열
-- 추가형(비파괴) 마이그레이션 — 기존 데이터 영향 없음, 기본값 빈 배열.

ALTER TABLE enabler_profiles
  ADD COLUMN IF NOT EXISTS career JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN enabler_profiles.career IS
  '경력 항목 배열: [{company, title, period, description}]. 학력 외 직장/커리어 이력.';
