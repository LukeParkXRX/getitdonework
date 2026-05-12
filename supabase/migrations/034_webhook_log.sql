-- ============================================================
-- 034 webhook_events — Stripe 등 webhook 수신 이력 로그
-- ============================================================

CREATE TABLE webhook_events (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT         NOT NULL,
  event_type      TEXT         NOT NULL,
  event_id        TEXT,
  payload_summary JSONB,
  status          TEXT         NOT NULL DEFAULT 'received',
  error_message   TEXT,
  processing_ms   INT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_events_provider_created ON webhook_events(provider, created_at DESC);
CREATE INDEX idx_webhook_events_status           ON webhook_events(status, created_at DESC);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_events_super_admin" ON webhook_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );
