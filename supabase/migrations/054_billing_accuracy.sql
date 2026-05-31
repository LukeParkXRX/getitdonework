-- 054: 과금/정산 정확성 보정 (검토용 — 적용 전 확인)
--
-- 문제 1) auto_complete_session 은 'pending' 세션도 처리하지만(052:24), 완료 분기에서
--         호출하는 confirm_credits 는 status='confirmed' 가 아니면 EXCEPTION(002:115).
--         → 수락 안 된(pending) 세션을 양측이 실제로 진행하면 webhook 500 → 크레딧 hold 영구 고착.
-- 문제 2) 정산 적립(accrue_enabler_earning)이 enabler '수락' 시점(api/bookings/[id])에 발생.
--         → 노쇼/짧은 세션으로 환불돼도 적립은 이미 됨. 적립은 '완료' 시점이어야 함.
-- 문제 3) (잠재) credits_amount=0(Chemistry 무료)인 정상 세션도 052 로직상 release 분기로 가
--         status='cancelled' 처리 → 성공한 무료 세션이 "환불/취소"로 표시되고 session_count 미증가.
--
-- 해결: 성공 조건(양측 입장 + 5분 이상)과 환불 조건을 분리하고,
--       유료/무료를 구분해 완료 처리. 적립은 완료 시점·유료 세션에만.
--       ※ 페어 코드 변경 필요: src/app/api/bookings/[id]/route.ts 의 수락 시점 accrue_enabler_earning 호출 제거.

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
      -- pending 세션도 완료 가능하도록 승격 후 확정
      UPDATE bookings SET status = 'confirmed' WHERE id = p_booking_id AND status = 'pending';
      PERFORM confirm_credits(p_booking_id);   -- status='completed' + completed_at + session_count
      PERFORM accrue_enabler_earning(p_booking_id);  -- ② 완료 시점 정산 적립(멱등)
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
