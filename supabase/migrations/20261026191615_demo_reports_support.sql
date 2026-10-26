/*
 * Migration: demo reports support
 *
 * Purpose:
 *   - demo reports can be loaded with spread send dates and removed again, so the admin panel can
 *     be tried with realistic data in the shared project.
 *
 * Affected objects:
 *   - private.check_report(): the server time is forced only for requests from signed-in users
 *     (the apps). server-side scripts, which run without a user, keep the sent_at they give.
 *   - private.keep_report(): reports whose snapshot contains "demo": true can be deleted. nobody
 *     can delete through the api (there is no delete policy), so only server-side scripts can.
 *
 * Notes:
 *   - every other sent report still can never change or be deleted.
 */

create or replace function private.check_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  folder text := new.technician_id::text || '/' || new.id::text || '/';
begin
  if auth.uid() is not null then
    new.sent_at := now();
    new.created_at := now();
  end if;

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

create or replace function private.keep_report()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.snapshot @> '{"demo": true}' then
      return old;
    end if;
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
