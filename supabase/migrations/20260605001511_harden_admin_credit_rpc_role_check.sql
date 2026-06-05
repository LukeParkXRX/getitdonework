-- Defense in depth for manual credit operations.
-- The API already checks super_admin, but these RPCs can be reached through
-- Supabase's Data API unless the database function itself also checks the actor.

CREATE OR REPLACE FUNCTION public.require_super_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'super_admin permission required';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.grant_credits_to_org(
  p_org_id UUID,
  p_amount INT,
  p_description TEXT DEFAULT '크레딧 구매'
) RETURNS public.credit_transactions AS $$
DECLARE
  v_tx public.credit_transactions;
  v_new_total INT;
BEGIN
  PERFORM public.require_super_admin();

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE public.organizations
    SET total_credits = total_credits + p_amount
    WHERE id = p_org_id
    RETURNING total_credits INTO v_new_total;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  INSERT INTO public.credit_transactions (tx_type, amount, org_id, description, balance_after)
  VALUES ('purchase', p_amount, p_org_id, p_description, v_new_total)
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  p_startup_id UUID,
  p_org_id UUID,
  p_amount INT,
  p_description TEXT
) RETURNS public.credit_transactions AS $$
DECLARE
  v_tx public.credit_transactions;
  v_balance INT := NULL;
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
      RETURNING credit_balance INTO v_balance;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Startup profile not found';
    END IF;
  END IF;

  IF p_org_id IS NOT NULL THEN
    UPDATE public.organizations
      SET total_credits = total_credits + p_amount
      WHERE id = p_org_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization not found';
    END IF;
  END IF;

  INSERT INTO public.credit_transactions (tx_type, amount, org_id, startup_id, description, balance_after)
  VALUES (
    (CASE WHEN p_amount > 0 THEN 'allocate' ELSE 'release' END)::public.credit_tx_type,
    p_amount,
    p_org_id,
    p_startup_id,
    COALESCE(p_description, CASE WHEN p_amount > 0 THEN '관리자 크레딧 발급' ELSE '관리자 크레딧 회수' END),
    v_balance
  )
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
