/*
 * Migration: profile email and last sign-in
 *
 * Purpose:
 *   - the admin panel lists users with their email and last sign-in, which only exist in auth.users
 *     (not exposed to the data api). profiles gets a copy of both, kept in sync by triggers.
 *
 * Affected objects:
 *   - new columns: public.profiles.email, public.profiles.last_sign_in_at (backfilled from auth.users)
 *   - function private.handle_new_user() now also copies the email
 *   - new function + trigger: private.sync_profile_auth_fields() on auth.users updates
 *   - function private.protect_profile_privileges() now also blocks manual edits of email and
 *     last_sign_in_at by signed-in users (they always come from auth.users)
 *
 * Notes:
 *   - changing an email is done in supabase auth; the trigger copies it to the profile.
 */

alter table public.profiles
  add column email text,
  add column last_sign_in_at timestamptz;

comment on column public.profiles.email is 'Copy of auth.users.email, kept in sync by a trigger. Do not edit.';
comment on column public.profiles.last_sign_in_at is 'Copy of auth.users.last_sign_in_at, kept in sync by a trigger. Do not edit.';

update public.profiles p
set email = u.email,
    last_sign_in_at = u.last_sign_in_at
from auth.users u
where u.id = p.id;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'technician'),
    new.email
  );
  return new;
end;
$$;

create or replace function private.sync_profile_auth_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email,
      last_sign_in_at = new.last_sign_in_at
  where id = new.id;
  return new;
end;
$$;

revoke execute on function private.sync_profile_auth_fields() from public, anon, authenticated;

create trigger on_auth_user_updated
after update of email, last_sign_in_at on auth.users
for each row
when (
  old.email is distinct from new.email
  or old.last_sign_in_at is distinct from new.last_sign_in_at
)
execute function private.sync_profile_auth_fields();

create or replace function private.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
    and (new.email is distinct from old.email or new.last_sign_in_at is distinct from old.last_sign_in_at)
  then
    raise exception 'email and last_sign_in_at come from auth.users and cannot be edited'
      using errcode = '42501';
  end if;
  if (select auth.uid()) is not null
    and not private.is_admin()
    and (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
  then
    raise exception 'only administrators can change role or is_active'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
