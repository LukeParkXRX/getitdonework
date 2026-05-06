-- ═══════════════════════════════════════════════════════
-- Migration 010: Application intake tables
-- ═══════════════════════════════════════════════════════
-- enabler_applications: 공개 Enabler 지원 폼 → DB
-- contact_inquiries   : 공개 문의하기 폼 → DB
--
-- RLS: 누구나 INSERT(공개 폼) + super_admin만 SELECT/UPDATE
-- ═══════════════════════════════════════════════════════

-- enabler 지원서
CREATE TABLE enabler_applications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  university   TEXT        NOT NULL,
  degree_type  TEXT        NOT NULL,
  location     TEXT        NOT NULL,
  photo_url    TEXT,
  specialties  TEXT[]      NOT NULL DEFAULT '{}',
  bio          TEXT        NOT NULL,
  credit_rate  INT         NOT NULL DEFAULT 2,
  status       TEXT        NOT NULL DEFAULT 'pending', -- pending | reviewed | approved | rejected
  reviewed_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 문의하기
CREATE TABLE contact_inquiries (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  company      TEXT,
  email        TEXT        NOT NULL,
  inquiry_type TEXT        NOT NULL,
  message      TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'new', -- new | replied | archived
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE enabler_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries    ENABLE ROW LEVEL SECURITY;

-- 누구나 INSERT 가능 (공개 폼)
CREATE POLICY "enabler_applications_insert_public"
  ON enabler_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contact_inquiries_insert_public"
  ON contact_inquiries FOR INSERT
  WITH CHECK (true);

-- super_admin 전체 접근
CREATE POLICY "enabler_applications_super_admin_all"
  ON enabler_applications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  );

CREATE POLICY "contact_inquiries_super_admin_all"
  ON contact_inquiries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  );

-- 인덱스
CREATE INDEX idx_enabler_applications_status ON enabler_applications(status, created_at DESC);
CREATE INDEX idx_contact_inquiries_status    ON contact_inquiries(status, created_at DESC);
