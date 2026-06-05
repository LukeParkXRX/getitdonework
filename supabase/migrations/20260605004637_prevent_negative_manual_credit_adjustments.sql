-- Prevent manual admin credit revokes from driving balances below zero.
-- The API validates basic input, but the database function is the final guard.

CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  p_startup_id UUID,
  p_org_id UUID,
  p_amount INT,
  p_description TEXT
) RETURNS public.credit_transactions AS $$
DECLARE
  v_tx public.credit_transactions;
  v_balance INT := NULL;
  v_existing_startup_balance INT := NULL;
  v_existing_org_balance INT := NULL;
BEGIN
  PERFORM public.require_super_admin();

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'Amount must not be zero';
  END IF;
  IF p_startup_id IS NULL AND p_org_id IS NULL THEN
    RAISE EXCEPTION 'startup_id or org_id is required';
  END IF;

  IF p_startup_id IS NOT NULL THEN
    UPDATE public.startup_profiles
      SET credit_balance = credit_balance + p_amount
      WHERE user_id = p_startup_id
        AND (p_amount > 0 OR credit_balance + p_amount >= 0)
      RETURNING credit_balance INTO v_balance;

    IF NOT FOUND THEN
      SELECT credit_balance
        INTO v_existing_startup_balance
        FROM public.startup_profiles
        WHERE user_id = p_startup_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Startup profile not found';
      END IF;

      RAISE EXCEPTION 'Insufficient startup credits. Available: %', v_existing_startup_balance;
    END IF;
  END IF;

  IF p_org_id IS NOT NULL THEN
    UPDATE public.organizations
      SET total_credits = total_credits + p_amount
      WHERE id = p_org_id
        AND (p_amount > 0 OR total_credits + p_amount >= 0)
      RETURNING total_credits INTO v_existing_org_balance;

    IF NOT FOUND THEN
      SELECT total_credits
        INTO v_existing_org_balance
        FROM public.organizations
        WHERE id = p_org_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found';
      END IF;

      RAISE EXCEPTION 'Insufficient organization credits. Available: %', v_existing_org_balance;
    END IF;
  END IF;

  INSERT INTO public.credit_transactions (tx_type, amount, org_id, startup_id, description, balance_after)
  VALUES (
    (CASE WHEN p_amount > 0 THEN 'allocate' ELSE 'release' END)::public.credit_tx_type,
    p_amount,
    p_org_id,
    p_startup_id,
    COALESCE(p_description, CASE WHEN p_amount > 0 THEN '관리자 크레딧 발급' ELSE '관리자 크레딧 회수' END),
    COALESCE(v_balance, v_existing_org_balance)
  )
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
