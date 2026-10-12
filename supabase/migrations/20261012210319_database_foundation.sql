/*
 * Migration: database foundation
 *
 * Purpose:
 *   - user roles and profiles linked to supabase auth users
 *   - catalogs managed by administrators: clients, branches and fire protection systems
 *   - helper functions (private schema) used by row level security policies
 *
 * Affected objects:
 *   - new schema: private
 *   - new type: public.user_role
 *   - new tables: public.profiles, public.clients, public.branches, public.systems
 *   - new trigger on auth.users to create a profile for every new account
 *
 * Security model (single company, internal staff only):
 *   - public sign-up is disabled; administrators create accounts.
 *   - every table has rls enabled. anon gets no access at all.
 *   - authenticated users can read catalogs and profiles (technicians download them to work offline).
 *   - only administrators can create, update or delete catalog rows.
 *   - users can edit their own name and signature, but never their own role or active flag.
 *
 * Notes:
 *   - user_role values must match packages/shared/src/roles.ts.
 *   - this project has a single cloud database shared by development and production.
 */

-- ---------------------------------------------------------------------------
-- private schema: helper functions that must not be exposed through the data api
-- ---------------------------------------------------------------------------
create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- keeps updated_at current on every update.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- roles and profiles
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('tecnico', 'supervisor', 'administrador');

comment on type public.user_role is 'Application roles. Must match packages/shared/src/roles.ts.';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'tecnico',
  is_active boolean not null default true,
  -- path inside the private signatures storage bucket (bucket created in a later migration).
  signature_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One profile per auth user: display name, application role, active flag and saved signature.';

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- role helpers used by rls policies
-- security definer so they can read profiles without recursing into profiles' own policies.
-- ---------------------------------------------------------------------------
create or replace function private.current_user_role()
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

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'administrador', false);
$$;

comment on function private.is_admin() is 'True when the signed-in user is an active administrador.';

-- policies are evaluated as the calling user, so authenticated needs execute; nobody else does.
revoke execute on function private.current_user_role() from public, anon;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- profile creation and protection
-- ---------------------------------------------------------------------------

-- creates a profile for every new auth user.
-- the role is read from app metadata (set by an administrator through the admin api);
-- user metadata is editable by the user, so it is only used for the display name.
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
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'tecnico')
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();

-- prevents non-administrators from changing their own role or active flag.
-- requests without an end user (service role, sql editor, migrations) are allowed.
create or replace function private.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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

revoke execute on function private.protect_profile_privileges() from public, anon, authenticated;

create trigger profiles_protect_privileges
before update on public.profiles
for each row
execute function private.protect_profile_privileges();

-- profiles policies --------------------------------------------------------

-- all staff can see each other's profiles (names for reports and signatures).
create policy "Authenticated users can view profiles"
on public.profiles
for select
to authenticated
using (true);

-- profiles are created by the auth trigger; administrators may also create them directly.
create policy "Administrators can create profiles"
on public.profiles
for insert
to authenticated
with check ((select private.is_admin()));

-- users can update their own profile (role and is_active are guarded by a trigger).
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Administrators can update any profile"
on public.profiles
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- no delete policy: deactivate profiles instead. deleting the auth user cascades.

-- ---------------------------------------------------------------------------
-- catalogs: clients, branches and fire protection systems
-- ---------------------------------------------------------------------------
create table public.clients (
  id bigint generated always as identity primary key,
  name text not null,
  -- mexican tax id (rfc). optional.
  tax_id text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clients is 'Companies that receive inspection, testing and maintenance services.';

create table public.branches (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients (id) on delete restrict,
  name text not null,
  address text,
  city text,
  state text,
  contact_name text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.branches is 'Client sites (sucursales) where services are performed.';

create index branches_client_id_idx on public.branches (client_id);

create table public.systems (
  id bigint generated always as identity primary key,
  branch_id bigint not null references public.branches (id) on delete restrict,
  -- free text for now (e.g. hidrantes, rociadores, extintores, detección y alarma).
  system_type text not null,
  name text not null,
  location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.systems is 'Fire protection systems installed at a branch. Service forms are filled per system.';

create index systems_branch_id_idx on public.systems (branch_id);

-- foreign keys use on delete restrict: catalogs with history are deactivated, not deleted.

alter table public.clients enable row level security;
alter table public.branches enable row level security;
alter table public.systems enable row level security;

create trigger clients_set_updated_at
before update on public.clients
for each row
execute function private.set_updated_at();

create trigger branches_set_updated_at
before update on public.branches
for each row
execute function private.set_updated_at();

create trigger systems_set_updated_at
before update on public.systems
for each row
execute function private.set_updated_at();

-- clients policies ---------------------------------------------------------

-- technicians and supervisors download the catalogs to work offline.
create policy "Authenticated users can view clients"
on public.clients
for select
to authenticated
using (true);

create policy "Administrators can create clients"
on public.clients
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Administrators can update clients"
on public.clients
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators can delete clients"
on public.clients
for delete
to authenticated
using ((select private.is_admin()));

-- branches policies --------------------------------------------------------

create policy "Authenticated users can view branches"
on public.branches
for select
to authenticated
using (true);

create policy "Administrators can create branches"
on public.branches
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Administrators can update branches"
on public.branches
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators can delete branches"
on public.branches
for delete
to authenticated
using ((select private.is_admin()));

-- systems policies ---------------------------------------------------------

create policy "Authenticated users can view systems"
on public.systems
for select
to authenticated
using (true);

create policy "Administrators can create systems"
on public.systems
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Administrators can update systems"
on public.systems
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators can delete systems"
on public.systems
for delete
to authenticated
using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- defense in depth: anon has no business with these tables, even if a policy is added by mistake.
-- ---------------------------------------------------------------------------
revoke all on table public.profiles, public.clients, public.branches, public.systems from anon;
