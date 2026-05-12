CREATE TABLE terms_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  changelog TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE user_terms_acceptances (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terms_version_id UUID NOT NULL REFERENCES terms_versions(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, terms_version_id)
);

CREATE INDEX idx_terms_versions_current ON terms_versions(is_current) WHERE is_current = true;

ALTER TABLE terms_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_terms_acceptances ENABLE ROW LEVEL SECURITY;

-- terms_versions: 모두 SELECT 가능 (공개)
CREATE POLICY "terms_versions_select" ON terms_versions FOR SELECT USING (true);
CREATE POLICY "terms_versions_super_admin" ON terms_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

-- 본인 acceptance만
CREATE POLICY "acceptances_own" ON user_terms_acceptances FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 초기 v1.0
INSERT INTO terms_versions (version, changelog, is_current) VALUES ('v1.0', '초기 버전', true);
