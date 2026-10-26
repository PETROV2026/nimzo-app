/*
 * Migration: reports
 *
 * Purpose:
 *   - public.reports holds sent reports (Enviado). drafts (Activo) and reports waiting for
 *     signatures (Pendiente) live only on the technician's device.
 *   - a sent report never changes and is never deleted, not even by an administrator.
 *   - every report gets a folio that is unique across the platform, assigned when it arrives.
 *   - photos and signatures live in the private report-files bucket, under
 *     {technician_id}/{report_id}/.
 *
 * Affected objects:
 *   - new table: public.reports
 *   - new functions: private.check_report(), private.keep_report()
 *   - new storage bucket: report-files (private) and its policies on storage.objects
 *
 * Notes:
 *   - the id is generated on the device, so a retried upload fails on the primary key instead of
 *     creating a second report.
 *   - snapshot keeps the client, branch and system data as they were when the report was filled.
 *   - the device uploads the files first and inserts the report last.
 */

create table public.reports (
  id uuid primary key,
  folio bigint generated always as identity unique,
  technician_id uuid not null references public.profiles (id) on delete restrict,
  client_id uuid not null references public.clients (id) on delete restrict,
  branch_id uuid not null references public.branches (id) on delete restrict,
  system_id uuid references public.systems (id) on delete restrict,
  service_package_id uuid references public.service_packages (id) on delete restrict,
  service_form_id bigint not null references public.service_forms (id) on delete restrict,
  form_code text not null,
  form_version int not null check (form_version >= 1),
  answers jsonb not null,
  snapshot jsonb not null,
  supervisor_name text not null check (length(trim(supervisor_name)) > 0),
  supervisor_signature_path text not null,
  technician_signature_path text not null,
  started_at timestamptz not null,
  signed_at timestamptz not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.reports is 'Sent service reports. Rows never change and are never deleted.';
comment on column public.reports.folio is 'Platform-wide report number. Unique and increasing, not guaranteed consecutive.';
comment on column public.reports.form_version is 'Version of the form definition in packages/shared/formatos used to fill the report.';
comment on column public.reports.answers is 'Values keyed by field id, as defined by the form definition.';
comment on column public.reports.snapshot is 'Client, branch and system data as they were when the report was filled.';

create index reports_technician_id_idx on public.reports (technician_id);
create index reports_client_id_idx on public.reports (client_id);
create index reports_branch_id_idx on public.reports (branch_id);
create index reports_service_form_id_idx on public.reports (service_form_id);
create index reports_sent_at_idx on public.reports (sent_at);

alter table public.reports enable row level security;

create or replace function private.check_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  folder text := new.technician_id::text || '/' || new.id::text || '/';
begin
  new.sent_at := now();
  new.created_at := now();

  if not exists (
    select 1 from public.profiles p
    where p.id = new.technician_id and p.role = 'technician' and p.is_active
  ) then
    raise exception 'reports must be sent by an active technician' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.branches b
    join public.clients c on c.id = b.client_id
    where b.id = new.branch_id and c.id = new.client_id and c.technician_id = new.technician_id
  ) then
    raise exception 'the client and branch must belong to the technician' using errcode = '23514';
  end if;

  if new.system_id is not null and not exists (
    select 1 from public.systems s where s.id = new.system_id and s.branch_id = new.branch_id
  ) then
    raise exception 'the system must belong to the branch of the report' using errcode = '23514';
  end if;

  if new.service_package_id is not null and not exists (
    select 1 from public.service_packages p
    where p.id = new.service_package_id and p.branch_id = new.branch_id
  ) then
    raise exception 'the service package must belong to the branch of the report' using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.service_forms f where f.id = new.service_form_id and f.code = new.form_code
  ) then
    raise exception 'form_code must match the service form' using errcode = '23514';
  end if;

  if left(new.supervisor_signature_path, length(folder)) <> folder
    or left(new.technician_signature_path, length(folder)) <> folder
  then
    raise exception 'signatures must be stored in the folder of the report' using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function private.check_report() is 'Checks that a sent report fits together and belongs to its technician, and sets the server times.';

revoke execute on function private.check_report() from public, anon, authenticated;

create trigger reports_check
before insert on public.reports
for each row
execute function private.check_report();

create or replace function private.keep_report()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Sent reports cannot be deleted.' using errcode = '42501';
  end if;

  if (
    new.id, new.folio, new.technician_id, new.client_id, new.branch_id, new.system_id,
    new.service_package_id, new.service_form_id, new.form_code, new.form_version, new.answers,
    new.snapshot, new.supervisor_name, new.supervisor_signature_path, new.technician_signature_path,
    new.started_at, new.signed_at, new.sent_at, new.created_at
  ) is distinct from (
    old.id, old.folio, old.technician_id, old.client_id, old.branch_id, old.system_id,
    old.service_package_id, old.service_form_id, old.form_code, old.form_version, old.answers,
    old.snapshot, old.supervisor_name, old.supervisor_signature_path, old.technician_signature_path,
    old.started_at, old.signed_at, old.sent_at, old.created_at
  ) then
    raise exception 'Sent reports cannot be changed.' using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function private.keep_report() is 'Keeps sent reports from changing or being deleted, whatever the role.';

revoke execute on function private.keep_report() from public, anon, authenticated;

create trigger reports_keep
before update or delete on public.reports
for each row
execute function private.keep_report();

create policy "Technicians can view their own reports"
on public.reports for select to authenticated
using (technician_id = (select auth.uid()) and (select private.current_user_role()) = 'technician');

create policy "Administrators can view all reports"
on public.reports for select to authenticated
using ((select private.is_admin()));

create policy "Technicians can send their own reports"
on public.reports for insert to authenticated
with check (technician_id = (select auth.uid()) and (select private.current_user_role()) = 'technician');

revoke all on public.reports from anon;

-- ---------------------------------------------------------------------------
-- report files: photos and signatures under {technician_id}/{report_id}/.
-- files are never overwritten or deleted through the api.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-files', 'report-files', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Technicians can upload their own report files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'report-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_role()) = 'technician'
);

create policy "Technicians can view their own report files"
on storage.objects for select to authenticated
using (
  bucket_id = 'report-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_role()) = 'technician'
);

create policy "Administrators can view all report files"
on storage.objects for select to authenticated
using (bucket_id = 'report-files' and (select private.is_admin()));
