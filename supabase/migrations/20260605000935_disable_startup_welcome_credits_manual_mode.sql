-- Manual credit launch mode:
-- New startup accounts should not receive automatic welcome credits.
-- Credits are granted by admins from /admin/credits until Stripe live payment is ready.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested_role TEXT := NEW.raw_user_meta_data->>'role';
  safe_role public.user_role := CASE
    WHEN requested_role = 'startup' THEN 'startup'::public.user_role
    ELSE NULL
  END;
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
    VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;
