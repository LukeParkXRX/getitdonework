-- 052: 화상 세션 과금 안전장치 — "혼자 입장 시 풀 차감" 방지
--
-- 문제: 상대가 안 와도 한 명이 방에 90분 있으면 duration>=300 → confirm_credits(풀 차감).
--       session_started_at 누락 시 duration=999999 폴백도 동일 위험.
-- 해결: auto_complete_session 에 "양측 입장 여부(p_both_joined)" 추가.
--       양측 입장 + 5분 이상일 때만 과금(confirm), 그 외(짧음/무료/상대 미입장)는 환불(release).

DROP FUNCTION IF EXISTS auto_complete_session(uuid, int);

CREATE OR REPLACE FUNCTION auto_complete_session(
  p_booking_id UUID,
  p_duration_seconds INT,
  p_both_joined BOOLEAN DEFAULT TRUE
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

  -- 과금 조건: 유료 세션 + 5분 이상 + 양측 모두 입장.
  -- 하나라도 불충족(무료/짧음/상대 미입장)이면 환불 처리.
  IF v_booking.credits_amount = 0 OR p_duration_seconds < 300 OR NOT p_both_joined THEN
    PERFORM release_credits(
      p_booking_id,
      CASE
        WHEN NOT p_both_joined THEN '자동 종료 — 상대방 미입장으로 환불'
        ELSE '자동 종료 — 세션이 너무 짧음'
      END
    );
    UPDATE bookings SET status = 'cancelled', cancelled_at = now() WHERE id = p_booking_id;
  ELSE
    -- 정상 완료: confirm_credits가 status='completed' + completed_at + enabler stats 업데이트
    PERFORM confirm_credits(p_booking_id);
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
