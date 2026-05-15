-- ═══════════════════════════════════════════════════════
-- 041_session_events.sql
-- 세션 입퇴장 이벤트 추적 + 자동 완료 가드
-- ═══════════════════════════════════════════════════════

CREATE TYPE session_event_type AS ENUM ('joined', 'left', 'room_finished');

CREATE TABLE booking_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type session_event_type NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_session_events_booking ON booking_session_events(booking_id, occurred_at);
CREATE INDEX idx_session_events_user ON booking_session_events(user_id, occurred_at DESC);

ALTER TABLE booking_session_events ENABLE ROW LEVEL SECURITY;

-- booking 참여자 SELECT
CREATE POLICY "session_events_participant" ON booking_session_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_session_events.booking_id
      AND (auth.uid() = b.startup_id OR auth.uid() = b.enabler_id)
  ));

CREATE POLICY "session_events_super_admin" ON booking_session_events FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

-- bookings에 세션 통계 컬럼 추가
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_duration_seconds INT;

-- ═══════════════════════════════════════════════════════
-- RPC: 세션 자동 완료 처리 (LiveKit webhook에서 호출)
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auto_complete_session(
  p_booking_id UUID,
  p_duration_seconds INT
) RETURNS bookings AS $$
DECLARE
  v_booking bookings;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- 이미 처리됐으면 idempotent 반환
  IF v_booking.status NOT IN ('confirmed', 'pending') THEN
    RETURN v_booking;
  END IF;

  UPDATE bookings
    SET session_ended_at = COALESCE(session_ended_at, now()),
        session_duration_seconds = p_duration_seconds
    WHERE id = p_booking_id;

  -- chemistry call (free) 또는 너무 짧은 세션 (5분 미만)은 release
  IF v_booking.credits_amount = 0 OR p_duration_seconds < 300 THEN
    PERFORM release_credits(p_booking_id, '자동 종료 — 세션 너무 짧음');
    UPDATE bookings SET status = 'cancelled', cancelled_at = now() WHERE id = p_booking_id;
  ELSE
    -- 정상 완료: confirm_credits가 status='completed' + completed_at + enabler stats 업데이트
    PERFORM confirm_credits(p_booking_id);
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
