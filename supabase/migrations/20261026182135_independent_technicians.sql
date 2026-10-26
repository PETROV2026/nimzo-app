/*
 * Migration: independent technicians
 *
 * Purpose:
 *   - nimzo is now an app for independent technicians. every client, branch, system and service
 *     package belongs to one technician (technician_id), who is the only technician that can see it.
 *     administrators see everything and create rows for a chosen technician.
 *   - ids become uuids so the mobile app can create rows offline and upload them later.
 *   - branches get a contact email (sent reports are emailed there).
 *   - profiles become private: a technician only sees their own profile.
 *
 * Affected objects:
 *   - rebuilt tables: public.clients, public.branches, public.systems, public.service_packages,
 *     public.service_package_forms (uuid ids, technician_id, same columns and constraints as before)
 *   - new column: public.branches.contact_email
 *   - new function: private.set_catalog_owner()
 *   - redefined function: private.check_package_form_system()
 *   - profiles select policies
 *
 * Notes:
 *   - the tables are dropped and recreated. the migration stops if any of them has rows; the cloud
 *     project only holds demo data, removed beforehand with supabase/seeds/remove-demo-catalogs.sql.
 *   - technician_id is filled from the parent row on insert, must belong to an active technician and
 *     never changes.
 */

do $$
begin
  if exists (select 1 from public.clients)
    or exists (select 1 from public.branches)
    or exists (select 1 from public.systems)
    or exists (select 1 from public.service_packages)
    or exists (select 1 from public.service_package_forms)
  then
    raise exception 'Catalog tables are not empty. Run supabase/seeds/remove-demo-catalogs.sql first.';
  end if;
end;
$$;

drop table public.service_package_forms;
drop table public.service_packages;
drop table public.systems;
drop table public.branches;
drop table public.clients;

-- ---------------------------------------------------------------------------
-- tables
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  tax_id text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text generated always as (
    private.search_text(name || ' ' || coalesce(tax_id, ''))
  ) stored
);

comment on table public.clients is 'Companies a technician serves. Each row belongs to one technician.';

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.profiles (id) on delete restrict,
  client_id uuid not null references public.clients (id) on delete restrict,
  name text not null,
  address text,
  city text,
  state text,
  contact_name text,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text generated always as (
    private.search_text(name || ' ' || coalesce(city, ''))
  ) stored,
  constraint branches_state_check check (
    state in (
      'AGU', 'BCN', 'BCS', 'CAM', 'CHH', 'CHP', 'CMX', 'COA',
      'COL', 'DUR', 'GRO', 'GUA', 'HID', 'JAL', 'MEX', 'MIC',
      'MOR', 'NAY', 'NLE', 'OAX', 'PUE', 'QUE', 'ROO', 'SIN',
      'SLP', 'SON', 'TAB', 'TAM', 'TLA', 'VER', 'YUC', 'ZAC'
    )
  ),
  constraint branches_contact_email_check check (
    contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  )
);

comment on table public.branches is 'Client sites (sucursales) where services are performed.';
comment on column public.branches.state is 'ISO 3166-2 code of the mexican state, without the MX- prefix. Must match packages/shared/src/mexican-states.ts.';
comment on column public.branches.contact_email is 'Where sent reports for this branch are emailed.';

create table public.systems (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.profiles (id) on delete restrict,
  branch_id uuid not null references public.branches (id) on delete restrict,
  system_type public.system_type not null,
  name text not null,
  location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text generated always as (
    private.search_text(name || ' ' || coalesce(location, ''))
  ) stored
);

comment on table public.systems is 'Fire protection systems installed at a branch. Service forms are filled per system.';

create table public.service_packages (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.profiles (id) on delete restrict,
  branch_id uuid not null references public.branches (id) on delete restrict,
  frequency public.service_frequency not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, frequency)
);

comment on table public.service_packages is 'Forms to fill in one visit to a branch, per frequency. One package per branch and frequency.';

create table public.service_package_forms (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.profiles (id) on delete restrict,
  package_id uuid not null references public.service_packages (id) on delete cascade,
  service_form_id bigint not null references public.service_forms (id) on delete restrict,
  system_id uuid references public.systems (id) on delete restrict,
  created_at timestamptz not null default now()
);

comment on table public.service_package_forms is 'A form included in a service package, optionally for one system of the branch.';

comment on column public.clients.technician_id is 'Technician who owns the row. Children copy it from their parent.';

create index clients_technician_id_idx on public.clients (technician_id);
create index clients_search_text_idx on public.clients using gin (search_text extensions.gin_trgm_ops);
create index branches_technician_id_idx on public.branches (technician_id);
create index branches_client_id_idx on public.branches (client_id);
create index branches_search_text_idx on public.branches using gin (search_text extensions.gin_trgm_ops);
create index systems_technician_id_idx on public.systems (technician_id);
create index systems_branch_id_idx on public.systems (branch_id);
create index systems_search_text_idx on public.systems using gin (search_text extensions.gin_trgm_ops);
create index service_packages_technician_id_idx on public.service_packages (technician_id);
create index service_package_forms_technician_id_idx on public.service_package_forms (technician_id);
create unique index service_package_forms_unique_idx
  on public.service_package_forms (
    package_id,
    service_form_id,
    coalesce(system_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index service_package_forms_service_form_id_idx on public.service_package_forms (service_form_id);
create index service_package_forms_system_id_idx on public.service_package_forms (system_id);

alter table public.clients enable row level security;
alter table public.branches enable row level security;
alter table public.systems enable row level security;
alter table public.service_packages enable row level security;
alter table public.service_package_forms enable row level security;

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------
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

create trigger service_packages_set_updated_at
before update on public.service_packages
for each row
execute function private.set_updated_at();

create or replace function private.set_catalog_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_owner uuid;
begin
  if tg_op = 'UPDATE' and new.technician_id is distinct from old.technician_id then
    raise exception 'the technician of a catalog row cannot change'
      using errcode = '42501';
  end if;

  if tg_table_name = 'branches' then
    select technician_id into parent_owner from public.clients where id = new.client_id;
  elsif tg_table_name in ('systems', 'service_packages') then
    select technician_id into parent_owner from public.branches where id = new.branch_id;
  elsif tg_table_name = 'service_package_forms' then
    select technician_id into parent_owner from public.service_packages where id = new.package_id;
  end if;

  if tg_op = 'INSERT' then
    if tg_table_name = 'clients' then
      if new.technician_id is null and not private.is_admin() then
        new.technician_id := auth.uid();
      end if;
    elsif new.technician_id is null then
      new.technician_id := parent_owner;
    end if;

    if not exists (
      select 1
      from public.profiles p
      where p.id = new.technician_id and p.role = 'technician' and p.is_active
    ) then
      raise exception 'catalog rows must belong to an active technician'
        using errcode = '23514';
    end if;
  end if;

  if tg_table_name <> 'clients' and parent_owner is distinct from new.technician_id then
    raise exception 'a catalog row must belong to the same technician as its parent'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function private.set_catalog_owner() is 'Fills technician_id from the parent row, checks the owner is an active technician and keeps it from changing.';

revoke execute on function private.set_catalog_owner() from public, anon, authenticated;

create trigger clients_set_owner
before insert or update on public.clients
for each row
execute function private.set_catalog_owner();

create trigger branches_set_owner
before insert or update on public.branches
for each row
execute function private.set_catalog_owner();

create trigger systems_set_owner
before insert or update on public.systems
for each row
execute function private.set_catalog_owner();

create trigger service_packages_set_owner
before insert or update on public.service_packages
for each row
execute function private.set_catalog_owner();

create trigger service_package_forms_set_owner
before insert or update on public.service_package_forms
for each row
execute function private.set_catalog_owner();

create or replace function private.check_package_form_system()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.system_id is not null and not exists (
    select 1
    from public.systems s
    join public.service_packages p on p.branch_id = s.branch_id
    where s.id = new.system_id and p.id = new.package_id
  ) then
    raise exception 'the system must belong to the branch of the package'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function private.check_package_form_system() from public, anon, authenticated;

create trigger service_package_forms_check_system
before insert or update on public.service_package_forms
for each row
execute function private.check_package_form_system();

-- ---------------------------------------------------------------------------
-- policies: technicians work with their own rows, administrators with all of them.
-- catalogs are deactivated, not deleted; only forms can be removed from a package.
-- ---------------------------------------------------------------------------
create policy "Technicians can view their own clients"
on public.clients for select to authenticated
using (technician_id = (select auth.uid()));

create policy "Administrators can view all clients"
on public.clients for select to authenticated
using ((select private.is_admin()));

create policy "Technicians can create their own clients"
on public.clients for insert to authenticated
with check (technician_id = (select auth.uid()));

create policy "Administrators can create clients for a technician"
on public.clients for insert to authenticated
with check ((select private.is_admin()));

create policy "Technicians can update their own clients"
on public.clients for update to authenticated
using (technician_id = (select auth.uid()))
with check (technician_id = (select auth.uid()));

create policy "Administrators can update clients"
on public.clients for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators can delete clients"
on public.clients for delete to authenticated
using ((select private.is_admin()));

create policy "Technicians can view their own branches"
on public.branches for select to authenticated
using (technician_id = (select auth.uid()));

create policy "Administrators can view all branches"
on public.branches for select to authenticated
using ((select private.is_admin()));

create policy "Technicians can create their own branches"
on public.branches for insert to authenticated
with check (technician_id = (select auth.uid()));

create policy "Administrators can create branches for a technician"
on public.branches for insert to authenticated
with check ((select private.is_admin()));

create policy "Technicians can update their own branches"
on public.branches for update to authenticated
using (technician_id = (select auth.uid()))
with check (technician_id = (select auth.uid()));

create policy "Administrators can update branches"
on public.branches for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators can delete branches"
on public.branches for delete to authenticated
using ((select private.is_admin()));

create policy "Technicians can view their own systems"
on public.systems for select to authenticated
using (technician_id = (select auth.uid()));

create policy "Administrators can view all systems"
on public.systems for select to authenticated
using ((select private.is_admin()));

create policy "Technicians can create their own systems"
on public.systems for insert to authenticated
with check (technician_id = (select auth.uid()));

create policy "Administrators can create systems for a technician"
on public.systems for insert to authenticated
with check ((select private.is_admin()));

create policy "Technicians can update their own systems"
on public.systems for update to authenticated
using (technician_id = (select auth.uid()))
with check (technician_id = (select auth.uid()));

create policy "Administrators can update systems"
on public.systems for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators can delete systems"
on public.systems for delete to authenticated
using ((select private.is_admin()));

create policy "Technicians can view their own service packages"
on public.service_packages for select to authenticated
using (technician_id = (select auth.uid()));

create policy "Administrators can view all service packages"
on public.service_packages for select to authenticated
using ((select private.is_admin()));

create policy "Technicians can create their own service packages"
on public.service_packages for insert to authenticated
with check (technician_id = (select auth.uid()));

create policy "Administrators can create service packages for a technician"
on public.service_packages for insert to authenticated
with check ((select private.is_admin()));

create policy "Technicians can update their own service packages"
on public.service_packages for update to authenticated
using (technician_id = (select auth.uid()))
with check (technician_id = (select auth.uid()));

create policy "Administrators can update service packages"
on public.service_packages for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Technicians can view the forms of their packages"
on public.service_package_forms for select to authenticated
using (technician_id = (select auth.uid()));

create policy "Administrators can view all package forms"
on public.service_package_forms for select to authenticated
using ((select private.is_admin()));

create policy "Technicians can add forms to their packages"
on public.service_package_forms for insert to authenticated
with check (technician_id = (select auth.uid()));

create policy "Administrators can add forms to packages"
on public.service_package_forms for insert to authenticated
with check ((select private.is_admin()));

create policy "Technicians can update forms in their packages"
on public.service_package_forms for update to authenticated
using (technician_id = (select auth.uid()))
with check (technician_id = (select auth.uid()));

create policy "Administrators can update forms in packages"
on public.service_package_forms for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Technicians can remove forms from their packages"
on public.service_package_forms for delete to authenticated
using (technician_id = (select auth.uid()));

create policy "Administrators can remove forms from packages"
on public.service_package_forms for delete to authenticated
using ((select private.is_admin()));

revoke all on public.clients, public.branches, public.systems, public.service_packages,
  public.service_package_forms from anon;

-- ---------------------------------------------------------------------------
-- profiles: a technician only sees their own profile.
-- ---------------------------------------------------------------------------
drop policy "Authenticated users can view profiles" on public.profiles;

create policy "Users can view their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Administrators can view all profiles"
on public.profiles for select to authenticated
using ((select private.is_admin()));
