/*
 * Migration: english role values
 *
 * Purpose:
 *   - every code stored in the database is in english. the spanish labels shown to users
 *     live in packages/shared/src/roles.ts.
 *   - public.user_role values: tecnico -> technician, administrador -> admin (supervisor stays).
 *
 * Affected objects:
 *   - type public.user_role (values renamed in place; existing profiles keep their role)
 *   - default of public.profiles.role
 *   - functions private.is_admin() and private.handle_new_user()
 *   - auth.users.raw_app_meta_data ->> 'role' of existing accounts
 *
 * Notes:
 *   - renaming enum values does not rewrite rows: profiles.role shows the new value immediately.
 *   - new accounts must be created with app_metadata.role set to 'technician', 'supervisor' or 'admin'.
 *   - deploy the admin panel and the mobile app built from the same commit right after applying this
 *     migration: older builds still compare against the spanish values.
 */

alter type public.user_role rename value 'tecnico' to 'technician';
alter type public.user_role rename value 'administrador' to 'admin';

alter table public.profiles alter column role set default 'technician';

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'admin', false);
$$;

comment on function private.is_admin() is 'True when the signed-in user is an active admin.';

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'technician')
  );
  return new;
end;
$$;

-- keeps the role in app metadata consistent with the renamed enum values.
update auth.users
set raw_app_meta_data = jsonb_set(
  raw_app_meta_data,
  '{role}',
  case raw_app_meta_data ->> 'role'
    when 'tecnico' then '"technician"'::jsonb
    when 'administrador' then '"admin"'::jsonb
  end
)
where raw_app_meta_data ->> 'role' in ('tecnico', 'administrador');
