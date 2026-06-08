-- Lock fixed launch-admin accounts.
--
-- Context: admin@getitdonework.com was accidentally converted to an Enabler
-- through the approved Enabler application claim path. These emails are launch
-- operator accounts and must remain super_admin.

create or replace function public.is_fixed_super_admin_email(p_email text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(p_email, '')) in (
    'admin@getitdonework.com',
    'luke@xrx.studio',
    'sson@xrx.studio'
  );
$$;

update public.users
set role = 'super_admin'::public.user_role,
    is_verified = true
where public.is_fixed_super_admin_email(email);

delete from public.enabler_profiles
where user_id in (
  select id from public.users
  where public.is_fixed_super_admin_email(email)
);

update public.enabler_profiles ep
set status = 'pending'::public.enabler_status
from public.users u
where u.id = ep.user_id
  and ep.status = 'approved'::public.enabler_status
  and u.role = 'enabler'::public.user_role
  and (
    lower(coalesce(u.full_name, '') || ' ' ||
      coalesce(ep.university, '') || ' ' ||
      coalesce(ep.degree_type, '') || ' ' ||
      coalesce(ep.location, '') || ' ' ||
      coalesce(ep.bio, '') || ' ' ||
      array_to_string(coalesce(ep.specialties, array[]::text[]), ' ')
    ) ~ '\m(test|placeholder|sample|dummy)\M'
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data->>'role';
  safe_role public.user_role := case
    when public.is_fixed_super_admin_email(new.email) then 'super_admin'::public.user_role
    when requested_role = 'startup' then 'startup'::public.user_role
    else null
  end;
  welcome_credits constant int := 2;
begin
  insert into public.users (id, email, full_name, role, is_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    safe_role,
    public.is_fixed_super_admin_email(new.email)
  );

  if safe_role = 'startup' then
    insert into public.startup_profiles (user_id, credit_balance)
    values (new.id, welcome_credits)
    on conflict (user_id) do nothing;

    insert into public.credit_transactions (tx_type, amount, startup_id, description, balance_after)
    values ('allocate', welcome_credits, new.id, '런치 환영 크레딧', welcome_credits);
  end if;

  return new;
exception when others then
  raise warning 'handle_new_user failed: % %', sqlerrm, sqlstate;
  return new;
end;
$$;

create or replace function public.prevent_unsafe_user_role_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role;
  claim_allowed boolean :=
    coalesce(current_setting('app.claim_enabler_application', true), '') = 'true';
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  if public.is_fixed_super_admin_email(new.email)
     and new.role is distinct from 'super_admin'::public.user_role then
    raise exception '고정 관리자 계정은 super_admin 역할을 유지해야 합니다.';
  end if;

  select role into actor_role
  from public.users
  where id = auth.uid();

  if actor_role = 'super_admin' then
    return new;
  end if;

  if claim_allowed and new.role = 'enabler' then
    return new;
  end if;

  if auth.uid() = new.id then
    if old.role is null and new.role = 'startup' then
      return new;
    end if;

    raise exception '역할 변경은 관리자 승인 절차를 통해서만 가능합니다.';
  end if;

  return new;
end;
$$;

create or replace function public.claim_enabler_application(
  p_user_id uuid,
  p_signup_token text
) returns enabler_applications as $$
declare
  v_app enabler_applications;
  v_user_email text;
begin
  select email into v_user_email
  from public.users
  where id = p_user_id;

  if public.is_fixed_super_admin_email(v_user_email) then
    raise exception '고정 관리자 계정은 Enabler 지원서 가입 토큰을 사용할 수 없습니다.';
  end if;

  select * into v_app from enabler_applications
    where signup_token = p_signup_token
      and signed_up_user_id is null
      and (signup_token_expires_at is null or signup_token_expires_at > now())
      and status = 'approved'
    for update;

  if v_app.id is null then
    raise exception '유효하지 않거나 만료된 토큰입니다.';
  end if;

  perform set_config('app.claim_enabler_application', 'true', true);

  update users
    set role = 'enabler',
        avatar_url = coalesce(v_app.photo_url, avatar_url)
    where id = p_user_id;

  insert into enabler_profiles (
    user_id, university, degree_type, specialties, location, bio, credit_rate, status
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

  update enabler_applications
    set signed_up_user_id = p_user_id,
        signed_up_at = now(),
        signup_token = null
    where id = v_app.id
    returning * into v_app;

  return v_app;
end;
$$ language plpgsql security definer;
