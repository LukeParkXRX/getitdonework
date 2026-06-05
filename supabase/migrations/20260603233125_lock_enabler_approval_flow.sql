-- Enabler approval flow hardening.
--
-- Public signup can create startup accounts directly.
-- Enabler accounts must come from:
--   /enabler-apply -> super_admin approval -> private signup token -> claim RPC.
--
-- Do not trust raw_user_meta_data.role for Enabler approval. Supabase metadata is
-- client-supplied during signup, so the database must enforce the rule too.

-- 1) New auth users:
--    - role=startup metadata creates a startup user and welcome credits.
--    - role=enabler metadata is ignored here; approval token claim will set role.
--    - OAuth/no role stays NULL and goes through onboarding role selection.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role TEXT := NEW.raw_user_meta_data->>'role';
  safe_role public.user_role := CASE
    WHEN requested_role = 'startup' THEN 'startup'::public.user_role
    ELSE NULL
  END;
  welcome_credits CONSTANT INT := 2;
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    safe_role
  );

  IF safe_role = 'startup' THEN
    INSERT INTO public.startup_profiles (user_id, credit_balance)
    VALUES (NEW.id, welcome_credits)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.credit_transactions (tx_type, amount, startup_id, description, balance_after)
    VALUES ('allocate', welcome_credits, NEW.id, '런치 환영 크레딧', welcome_credits);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- 2) Existing users:
--    - Normal users may choose startup during onboarding.
--    - Normal users may not self-promote to enabler/org_admin/super_admin.
--    - Super admins and approved application claim RPC are allowed.
CREATE OR REPLACE FUNCTION public.prevent_unsafe_user_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role public.user_role;
  claim_allowed BOOLEAN :=
    COALESCE(current_setting('app.claim_enabler_application', true), '') = 'true';
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  SELECT role INTO actor_role
  FROM public.users
  WHERE id = auth.uid();

  IF actor_role = 'super_admin' THEN
    RETURN NEW;
  END IF;

  IF claim_allowed AND NEW.role = 'enabler' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = NEW.id THEN
    IF OLD.role IS NULL AND NEW.role = 'startup' THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION '역할 변경은 관리자 승인 절차를 통해서만 가능합니다.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_unsafe_user_role_update ON public.users;
CREATE TRIGGER prevent_unsafe_user_role_update
BEFORE UPDATE OF role ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_unsafe_user_role_update();

-- 3) Approved Enabler claim RPC sets a short-lived local DB flag so the trigger
--    can distinguish the approved path from a direct user self-update.
CREATE OR REPLACE FUNCTION public.claim_enabler_application(
  p_user_id UUID,
  p_signup_token TEXT
) RETURNS enabler_applications AS $$
DECLARE
  v_app enabler_applications;
BEGIN
  SELECT * INTO v_app FROM enabler_applications
    WHERE signup_token = p_signup_token
      AND signed_up_user_id IS NULL
      AND (signup_token_expires_at IS NULL OR signup_token_expires_at > now())
      AND status = 'approved'
    FOR UPDATE;

  IF v_app.id IS NULL THEN
    RAISE EXCEPTION '유효하지 않거나 만료된 토큰입니다.';
  END IF;

  PERFORM set_config('app.claim_enabler_application', 'true', true);

  UPDATE users SET role = 'enabler' WHERE id = p_user_id;

  INSERT INTO enabler_profiles (
    user_id, university, degree_type, specialties, location, bio, credit_rate, status
  ) VALUES (
    p_user_id,
    v_app.university,
    v_app.degree_type,
    v_app.specialties,
    v_app.location,
    v_app.bio,
    v_app.credit_rate,
    'approved'
  ) ON CONFLICT (user_id) DO UPDATE SET
    university = EXCLUDED.university,
    degree_type = EXCLUDED.degree_type,
    specialties = EXCLUDED.specialties,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    credit_rate = EXCLUDED.credit_rate,
    status = 'approved';

  UPDATE enabler_applications
    SET signed_up_user_id = p_user_id,
        signed_up_at = now(),
        signup_token = NULL
    WHERE id = v_app.id
    RETURNING * INTO v_app;

  RETURN v_app;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
