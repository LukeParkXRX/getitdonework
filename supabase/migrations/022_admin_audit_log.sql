-- Admin action audit log
-- Tracks all significant admin actions for compliance and debugging.
-- Fire-and-forget via logAdminAction() helper. Not wired to API routes yet.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,       -- e.g. 'approve_application', 'reject_application', 'hide_review', 'transfer_payout'
  target_type TEXT        NOT NULL,       -- e.g. 'application', 'review', 'invoice', 'user'
  target_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor  ON admin_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_super_admin" ON admin_audit_log
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
