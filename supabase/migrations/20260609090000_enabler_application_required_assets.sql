-- Enabler application required assets.
--
-- U.S. launch feedback requested Resume upload, LinkedIn profile, and profile
-- photo before admin approval. Resume files are private review assets; profile
-- photos are stored as public avatar URLs because approved Enablers can use
-- them as their public profile avatar.

insert into storage.buckets (id, name, public)
values ('application-assets', 'application-assets', false)
on conflict (id) do nothing;

alter table enabler_applications
  add column if not exists resume_file_path text,
  add column if not exists resume_file_name text,
  add column if not exists linkedin_url text;

-- Keep approved signup claim aligned with the application photo.
-- This function intentionally copies only public-safe profile data to the
-- Enabler profile/user record. Resume and LinkedIn remain admin-review data.
create or replace function public.claim_enabler_application(
  p_user_id uuid,
  p_signup_token text
) returns enabler_applications as $$
declare
  v_app enabler_applications;
begin
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
