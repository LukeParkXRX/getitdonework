-- 055: 정산 적립 순서 수정 (054 핫픽스)
--
-- 버그: 054의 auto_complete_session 성공 분기가 confirm_credits(→status='completed') 호출 '뒤'에
--       accrue_enabler_earning 을 호출했는데, accrue 는 booking이 status='confirmed'일 때만 동작
--       (018:154 `WHERE status='confirmed'`). 따라서 유료 세션 완료 시 accrue 가
--       'booking not found or not confirmed' 예외 → webhook 500 → 크레딧 hold 고착.
-- 해결: accrue_enabler_earning 을 confirm_credits 이전(status='confirmed' 시점)에 호출.
-- 검증: 트랜잭션 롤백 테스트(supabase/tests/credit_lifecycle_test.sql)로 RED→GREEN 확인.

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

  IF p_duration_seconds < 300 OR NOT p_both_joined THEN
    -- 실패(짧음/상대 미입장): 유료면 환불, 무료면 단순 취소
    IF v_booking.credits_amount > 0 THEN
      PERFORM release_credits(
        p_booking_id,
        CASE WHEN NOT p_both_joined THEN '자동 종료 — 상대방 미입장으로 환불'
             ELSE '자동 종료 — 세션이 너무 짧음' END
      );
      -- release_credits 가 status='cancelled' 까지 처리
    ELSE
      UPDATE bookings
        SET status = 'cancelled', cancelled_at = now(),
            cancel_reason = CASE WHEN NOT p_both_joined THEN '자동 종료 — 상대방 미입장'
                                 ELSE '자동 종료 — 세션이 너무 짧음' END
        WHERE id = p_booking_id;
    END IF;
  ELSE
    -- 성공(양측 입장 + 5분 이상)
    IF v_booking.credits_amount > 0 THEN
      -- pending 세션도 완료 가능하도록 승격
      UPDATE bookings SET status = 'confirmed' WHERE id = p_booking_id AND status = 'pending';
      -- accrue 는 status='confirmed' 에서만 동작 → confirm_credits(→completed) '이전'에 호출
      PERFORM accrue_enabler_earning(p_booking_id);
      PERFORM confirm_credits(p_booking_id);   -- status='completed' + completed_at + session_count
    ELSE
      -- 무료(Chemistry) 정상 완료: 크레딧 op 없이 완료 처리 + 세션 카운트
      UPDATE bookings SET status = 'completed', completed_at = now() WHERE id = p_booking_id;
      UPDATE enabler_profiles SET session_count = session_count + 1 WHERE user_id = v_booking.enabler_id;
    END IF;
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
