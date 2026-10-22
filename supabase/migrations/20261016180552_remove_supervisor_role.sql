/*
 * Migration: remove supervisor role
 *
 * Purpose:
 *   - the application only has two roles: technician and admin. there is no approval step,
 *     so the supervisor role is removed.
 *
 * Affected objects:
 *   - public.profiles.role and auth.users.raw_app_meta_data ->> 'role' (supervisor -> technician)
 *   - type public.user_role (recreated without 'supervisor'; postgres cannot drop an enum value)
 *   - function private.current_user_role() (recreated because its return type is public.user_role)
 *
 * Notes:
 *   - existing supervisor accounts become technicians and keep access to the mobile app.
 *   - new accounts must be created with app_metadata.role set to 'technician' or 'admin'.
 *   - deploy the admin-users edge function, the admin panel and the mobile app built from the same
 *     commit right after applying this migration.
 */

update public.profiles
set role = 'technician'
where role = 'supervisor';

update auth.users
set raw_app_meta_data = jsonb_set(raw_app_meta_data, '{role}', '"technician"'::jsonb)
where raw_app_meta_data ->> 'role' = 'supervisor';

alter type public.user_role rename to user_role_old;

create type public.user_role as enum ('technician', 'admin');

comment on type public.user_role is 'Application roles. Must match packages/shared/src/roles.ts.';

alter table public.profiles alter column role drop default;
alter table public.profiles
  alter column role type public.user_role using role::text::public.user_role;
alter table public.profiles alter column role set default 'technician';

drop function private.current_user_role();

create function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select profiles.role
  from public.profiles
  where profiles.id = (select auth.uid()) and profiles.is_active;
$$;

comment on function private.current_user_role() is 'Role of the signed-in user, or null if the user has no active profile.';

revoke execute on function private.current_user_role() from public, anon;
grant execute on function private.current_user_role() to authenticated;

drop type public.user_role_old;
