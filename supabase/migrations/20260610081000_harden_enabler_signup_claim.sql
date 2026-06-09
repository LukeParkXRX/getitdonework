-- Harden Enabler invite claim flow.
--
-- The approved Enabler signup token must be claimed by the same email address
-- that was approved on the original application. This prevents a forwarded
-- approval link from turning a different account into an approved Enabler.

create or replace function public.claim_enabler_application(
  p_user_id uuid,
  p_signup_token text
) returns public.enabler_applications as $$
declare
  v_app public.enabler_applications;
  v_user_email text;
begin
  select email into v_user_email
  from public.users
  where id = p_user_id;

  if v_user_email is null then
    raise exception '사용자 이메일을 확인할 수 없습니다.';
  end if;

  if public.is_fixed_super_admin_email(v_user_email) then
    raise exception '고정 관리자 계정은 Enabler 지원서 가입 토큰을 사용할 수 없습니다.';
  end if;

  select * into v_app
  from public.enabler_applications
  where signup_token = p_signup_token
    and signed_up_user_id is null
    and (signup_token_expires_at is null or signup_token_expires_at > now())
    and status = 'approved'
    and lower(email) = lower(v_user_email)
  for update;

  if v_app.id is null then
    raise exception '유효하지 않거나 만료된 토큰입니다.';
  end if;

  perform set_config('app.claim_enabler_application', 'true', true);

  update public.users
  set role = 'enabler',
      is_verified = true,
      avatar_url = coalesce(v_app.photo_url, avatar_url)
  where id = p_user_id;

  insert into public.enabler_profiles (
    user_id,
    university,
    degree_type,
    specialties,
    location,
    bio,
    credit_rate,
    status
  ) values (
    p_user_id,
    v_app.university,
    v_app.degree_type,
    v_app.specialties,
    v_app.location,
    v_app.bio,
    v_app.credit_rate,
    'approved'
  ) on conflict (user_id) do update set
    university = excluded.university,
    degree_type = excluded.degree_type,
    specialties = excluded.specialties,
    location = excluded.location,
    bio = excluded.bio,
    credit_rate = excluded.credit_rate,
    status = 'approved';

  update public.enabler_applications
  set signed_up_user_id = p_user_id,
      signed_up_at = now(),
      signup_token = null
  where id = v_app.id
  returning * into v_app;

  return v_app;
end;
$$ language plpgsql security definer set search_path = public;
