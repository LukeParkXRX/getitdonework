-- Migration 040: webhook_events idempotency constraint
-- event_id UNIQUE per provider 보장 — 중복 Stripe webhook 재처리 방지
--
-- ⚠️ 주의: 적용 전 event_id가 NULL인 기존 row 또는 중복 row 확인 필요.
--   SELECT provider, event_id, COUNT(*) FROM webhook_events
--   WHERE event_id IS NOT NULL
--   GROUP BY provider, event_id HAVING COUNT(*) > 1;
--
-- 중복 row 있으면 오래된 것 먼저 삭제 후 이 마이그레이션을 적용하세요.

ALTER TABLE webhook_events
  ADD CONSTRAINT webhook_events_provider_event_id_unique
    UNIQUE (provider, event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
  ON webhook_events(event_id)
  WHERE event_id IS NOT NULL;
