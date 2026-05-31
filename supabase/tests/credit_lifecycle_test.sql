-- 과금 생애주기 회귀 테스트 (hold → auto_complete_session → confirm/release/accrue)
--
-- 목적: migration 054/055 의 정산 로직을 시나리오별로 검증한다.
-- 실행: 트랜잭션 안에서 픽스처를 만들고 ASSERT 후 마지막에 강제 ROLLBACK 하므로
--        DB에 흔적을 남기지 않는다. (성공 시 'ALL_PASSED' 예외로 롤백)
--   psql:            psql "$DATABASE_URL" -f supabase/tests/credit_lifecycle_test.sql
--   Supabase Mgmt API: 본 파일 내용을 /database/query 로 POST
--
-- 전제: startup_profiles 가 있는 user 1명, enabler_profiles 가 있는 user 1명,
--        활성 payout_settings(글로벌 또는 해당 enabler) 1건, credit_settings 시드(standard 등).
--
-- 시나리오:
--   S1 유료·confirmed·양측·360s        → completed, 잔액 -2(홀드 유지), 적립 1
--   S2 유료·PENDING·양측·360s          → completed (pending 승격), 적립 1
--   S3 유료·confirmed·상대 미입장       → cancelled, 환불(잔액 복구), 적립 0
--   S4 유료·confirmed·<5분             → cancelled, 환불, 적립 0
--   S5 무료 chemistry·양측·360s        → completed(취소 아님), 잔액 불변, 적립 0, session_count +1
--   S6 멱등: S1 booking 2회 호출        → completed 유지, confirm tx 1건, 잔액 불변

DO $$
DECLARE
  v_s UUID; v_e UUID; v_bid UUID;
  v_status TEXT; v_bal INT; v_earn INT; v_confirm INT; v_sessions0 INT; v_sessions1 INT;
BEGIN
  SELECT u.id INTO v_s FROM users u JOIN startup_profiles sp ON sp.user_id = u.id LIMIT 1;
  SELECT u.id INTO v_e FROM users u JOIN enabler_profiles ep ON ep.user_id = u.id LIMIT 1;
  ASSERT v_s IS NOT NULL AND v_e IS NOT NULL, 'fixture: startup/enabler 프로필 필요';

  -- S1: 유료 confirmed 정상 완료
  UPDATE startup_profiles SET credit_balance = 100 WHERE user_id = v_s;
  INSERT INTO bookings (startup_id, enabler_id, scheduled_at, type, status, credits_amount)
    VALUES (v_s, v_e, now(), 'standard', 'confirmed', 2) RETURNING id INTO v_bid;
  PERFORM hold_credits(v_bid, v_s, v_e, 2);
  PERFORM auto_complete_session(v_bid, 360, true);
  SELECT status INTO v_status FROM bookings WHERE id = v_bid;
  SELECT credit_balance INTO v_bal FROM startup_profiles WHERE user_id = v_s;
  SELECT count(*)::int INTO v_earn FROM enabler_earnings WHERE booking_id = v_bid;
  ASSERT v_status = 'completed', 'S1 status=' || v_status;
  ASSERT v_bal = 98, 'S1 balance=' || v_bal;
  ASSERT v_earn = 1, 'S1 earnings=' || v_earn;

  -- S2: 유료 PENDING → 승격 후 완료
  UPDATE startup_profiles SET credit_balance = 100 WHERE user_id = v_s;
  INSERT INTO bookings (startup_id, enabler_id, scheduled_at, type, status, credits_amount)
    VALUES (v_s, v_e, now(), 'standard', 'pending', 2) RETURNING id INTO v_bid;
  PERFORM hold_credits(v_bid, v_s, v_e, 2);
  PERFORM auto_complete_session(v_bid, 360, true);
  SELECT status INTO v_status FROM bookings WHERE id = v_bid;
  SELECT count(*)::int INTO v_earn FROM enabler_earnings WHERE booking_id = v_bid;
  ASSERT v_status = 'completed', 'S2(pending) status=' || v_status;
  ASSERT v_earn = 1, 'S2(pending) earnings=' || v_earn;

  -- S3: 상대 미입장 → 환불
  UPDATE startup_profiles SET credit_balance = 100 WHERE user_id = v_s;
  INSERT INTO bookings (startup_id, enabler_id, scheduled_at, type, status, credits_amount)
    VALUES (v_s, v_e, now(), 'standard', 'confirmed', 2) RETURNING id INTO v_bid;
  PERFORM hold_credits(v_bid, v_s, v_e, 2);
  PERFORM auto_complete_session(v_bid, 360, false);
  SELECT status INTO v_status FROM bookings WHERE id = v_bid;
  SELECT credit_balance INTO v_bal FROM startup_profiles WHERE user_id = v_s;
  SELECT count(*)::int INTO v_earn FROM enabler_earnings WHERE booking_id = v_bid;
  ASSERT v_status = 'cancelled', 'S3 status=' || v_status;
  ASSERT v_bal = 100, 'S3 refund balance=' || v_bal;
  ASSERT v_earn = 0, 'S3 no-accrual earnings=' || v_earn;

  -- S4: 5분 미만 → 환불
  UPDATE startup_profiles SET credit_balance = 100 WHERE user_id = v_s;
  INSERT INTO bookings (startup_id, enabler_id, scheduled_at, type, status, credits_amount)
    VALUES (v_s, v_e, now(), 'standard', 'confirmed', 2) RETURNING id INTO v_bid;
  PERFORM hold_credits(v_bid, v_s, v_e, 2);
  PERFORM auto_complete_session(v_bid, 120, true);
  SELECT status INTO v_status FROM bookings WHERE id = v_bid;
  SELECT credit_balance INTO v_bal FROM startup_profiles WHERE user_id = v_s;
  ASSERT v_status = 'cancelled', 'S4 status=' || v_status;
  ASSERT v_bal = 100, 'S4 refund balance=' || v_bal;

  -- S5: 무료 chemistry 정상 완료
  UPDATE startup_profiles SET credit_balance = 100 WHERE user_id = v_s;
  SELECT session_count INTO v_sessions0 FROM enabler_profiles WHERE user_id = v_e;
  INSERT INTO bookings (startup_id, enabler_id, scheduled_at, type, status, credits_amount)
    VALUES (v_s, v_e, now(), 'chemistry', 'confirmed', 0) RETURNING id INTO v_bid;
  PERFORM hold_credits(v_bid, v_s, v_e, 0);
  PERFORM auto_complete_session(v_bid, 360, true);
  SELECT status INTO v_status FROM bookings WHERE id = v_bid;
  SELECT credit_balance INTO v_bal FROM startup_profiles WHERE user_id = v_s;
  SELECT count(*)::int INTO v_earn FROM enabler_earnings WHERE booking_id = v_bid;
  SELECT session_count INTO v_sessions1 FROM enabler_profiles WHERE user_id = v_e;
  ASSERT v_status = 'completed', 'S5 free status=' || v_status;
  ASSERT v_bal = 100, 'S5 free balance unchanged=' || v_bal;
  ASSERT v_earn = 0, 'S5 free no-accrual earnings=' || v_earn;
  ASSERT v_sessions1 = v_sessions0 + 1, 'S5 session_count not incremented';

  -- S6: 멱등 (2회 호출)
  UPDATE startup_profiles SET credit_balance = 100 WHERE user_id = v_s;
  INSERT INTO bookings (startup_id, enabler_id, scheduled_at, type, status, credits_amount)
    VALUES (v_s, v_e, now(), 'standard', 'confirmed', 2) RETURNING id INTO v_bid;
  PERFORM hold_credits(v_bid, v_s, v_e, 2);
  PERFORM auto_complete_session(v_bid, 360, true);
  PERFORM auto_complete_session(v_bid, 360, true);  -- 2회차: idempotent no-op 이어야 함
  SELECT status INTO v_status FROM bookings WHERE id = v_bid;
  SELECT credit_balance INTO v_bal FROM startup_profiles WHERE user_id = v_s;
  SELECT count(*)::int INTO v_confirm FROM credit_transactions WHERE booking_id = v_bid AND tx_type = 'confirm';
  ASSERT v_status = 'completed', 'S6 status=' || v_status;
  ASSERT v_bal = 98, 'S6 no double-charge balance=' || v_bal;
  ASSERT v_confirm = 1, 'S6 confirm tx count=' || v_confirm;

  -- 모든 ASSERT 통과 → 강제 롤백(흔적 없음) + 성공 신호
  RAISE EXCEPTION 'ALL_PASSED';
END $$;
