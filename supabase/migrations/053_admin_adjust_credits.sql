-- 053: 관리자 수동 크레딧 지급/회수 원자화
--
-- 문제: /api/admin/credits 가 잔액을 JS에서 read → +amount → write 하여
--       동시 지급 시 race(덮어쓰기) 가능. 거래기록과 잔액 갱신도 분리돼 부분 실패 위험.
-- 해결: 단일 원자적 UPDATE(credit_balance = credit_balance + amount) + 거래기록을
--       SECURITY DEFINER 함수 하나로. startup 또는 org 대상, 음수(회수)도 허용.

CREATE OR REPLACE FUNCTION admin_adjust_credits(
  p_startup_id UUID,
  p_org_id UUID,
  p_amount INT,
  p_description TEXT
) RETURNS credit_transactions AS $$
DECLARE
  v_tx credit_transactions;
  v_balance INT := NULL;
BEGIN
  IF p_amount = 0 THEN
    RAISE EXCEPTION 'Amount must not be zero';
  END IF;
  IF p_startup_id IS NULL AND p_org_id IS NULL THEN
    RAISE EXCEPTION 'startup_id or org_id is required';
  END IF;

  -- 스타트업 잔액 원자적 증감
  IF p_startup_id IS NOT NULL THEN
    UPDATE startup_profiles
      SET credit_balance = credit_balance + p_amount
      WHERE user_id = p_startup_id
      RETURNING credit_balance INTO v_balance;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Startup profile not found';
    END IF;
  END IF;

  -- 기관 총 크레딧 원자적 증감
  IF p_org_id IS NOT NULL THEN
    UPDATE organizations
      SET total_credits = total_credits + p_amount
      WHERE id = p_org_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization not found';
    END IF;
  END IF;

  INSERT INTO credit_transactions (tx_type, amount, org_id, startup_id, description, balance_after)
  VALUES (
    (CASE WHEN p_amount > 0 THEN 'allocate' ELSE 'release' END)::credit_tx_type,
    p_amount,
    p_org_id,
    p_startup_id,
    COALESCE(p_description, CASE WHEN p_amount > 0 THEN '관리자 크레딧 발급' ELSE '관리자 크레딧 회수' END),
    v_balance
  )
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
