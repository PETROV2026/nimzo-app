/*
 * Migration: service packages
 *
 * Purpose:
 *   - a service package is the set of forms a technician fills in one visit to a branch,
 *     for one frequency (weekly, monthly, quarterly, semiannual or annual).
 *     starting a visit from a package generates all its forms in one step.
 *   - each form in a package can be tied to one system of the branch (forms are filled per system),
 *     or to none (for example the observations report).
 *
 * Affected objects:
 *   - new type: public.service_frequency
 *   - new tables: public.service_packages, public.service_package_forms (rls enabled)
 *   - new trigger: service_package_forms_check_system (the system must belong to the package's branch)
 *
 * Security:
 *   - every signed-in user can read packages (technicians download them to work offline).
 *   - only administrators create and edit them.
 *   - packages are deactivated, never deleted. the forms inside a package can be removed:
 *     reports keep their own copy of what was filled.
 */

create type public.service_frequency as enum ('weekly', 'monthly', 'quarterly', 'semiannual', 'annual');

comment on type public.service_frequency is 'Visit frequency of a service package. Must match packages/shared/src/service-packages.ts.';

create table public.service_packages (
  id bigint generated always as identity primary key,
  branch_id bigint not null references public.branches (id) on delete restrict,
  frequency public.service_frequency not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, frequency)
);

comment on table public.service_packages is 'Forms to fill in one visit to a branch, per frequency. One package per branch and frequency.';

create table public.service_package_forms (
  id bigint generated always as identity primary key,
  package_id bigint not null references public.service_packages (id) on delete cascade,
  service_form_id bigint not null references public.service_forms (id) on delete restrict,
  system_id bigint references public.systems (id) on delete restrict,
  created_at timestamptz not null default now()
);

comment on table public.service_package_forms is 'A form included in a service package, optionally for one system of the branch.';

create unique index service_package_forms_unique_idx
  on public.service_package_forms (package_id, service_form_id, coalesce(system_id, 0));
create index service_package_forms_service_form_id_idx on public.service_package_forms (service_form_id);
create index service_package_forms_system_id_idx on public.service_package_forms (system_id);

alter table public.service_packages enable row level security;
alter table public.service_package_forms enable row level security;

create trigger service_packages_set_updated_at
before update on public.service_packages
for each row
execute function private.set_updated_at();

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

create policy "Authenticated users can view service packages"
on public.service_packages
for select
to authenticated
using (true);

create policy "Administrators can create service packages"
on public.service_packages
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Administrators can update service packages"
on public.service_packages
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Authenticated users can view service package forms"
on public.service_package_forms
for select
to authenticated
using (true);

create policy "Administrators can add forms to packages"
on public.service_package_forms
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Administrators can update forms in packages"
on public.service_package_forms
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Administrators can remove forms from packages"
on public.service_package_forms
for delete
to authenticated
using ((select private.is_admin()));

revoke all on public.service_packages from anon;
revoke all on public.service_package_forms from anon;
