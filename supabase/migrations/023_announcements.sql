CREATE TYPE announcement_audience AS ENUM ('all', 'startups', 'enablers', 'org_admins', 'super_admins', 'org', 'specific_users');
CREATE TYPE announcement_channel AS ENUM ('in_app', 'email', 'in_app_and_email');
CREATE TYPE announcement_status AS ENUM ('draft', 'sending', 'sent', 'failed');

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  audience announcement_audience NOT NULL DEFAULT 'all',
  audience_target_id UUID,
  target_user_ids UUID[],
  channel announcement_channel NOT NULL DEFAULT 'in_app',
  status announcement_status NOT NULL DEFAULT 'draft',
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_announcements_status ON announcements(status, created_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_super_admin" ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));
