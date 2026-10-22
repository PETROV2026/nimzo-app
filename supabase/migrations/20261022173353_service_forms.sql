/*
 * Migration: service forms catalog
 *
 * Purpose:
 *   - public.service_forms: the catalog of service forms (F-SER-XXX) that technicians fill.
 *     administrators add and edit them in the panel; the field definitions come later.
 *   - storage bucket form-icons: one icon per form, shown in the panel and the mobile app.
 *   - the forms that already exist are loaded as the initial catalog.
 *
 * Affected objects:
 *   - new table: public.service_forms (rls enabled)
 *   - new trigger: service_forms_keep_code (the code never changes once created)
 *   - new storage bucket: form-icons, with write policies for administrators
 *
 * Security:
 *   - every signed-in user can read the catalog (technicians download it to work offline).
 *   - only administrators create or edit forms. there is no delete: forms are deactivated,
 *     because reports keep pointing to them.
 *   - form-icons is a public bucket: icons are not sensitive and the mobile app caches them.
 *     only administrators can upload, replace or remove icons.
 */

create table public.service_forms (
  id bigint generated always as identity primary key,
  code text not null unique check (code ~ '^F-SER-[0-9]{3}$'),
  name text not null check (length(trim(name)) > 0),
  subtitle text,
  icon_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text generated always as (
    private.search_text(code || ' ' || name || ' ' || coalesce(subtitle, ''))
  ) stored
);

comment on table public.service_forms is 'Catalog of service forms (F-SER-XXX). The code identifies the form in reports and never changes.';
comment on column public.service_forms.icon_path is 'Path of the icon inside the public form-icons storage bucket.';

create index service_forms_search_text_idx on public.service_forms using gin (search_text extensions.gin_trgm_ops);

alter table public.service_forms enable row level security;

create trigger service_forms_set_updated_at
before update on public.service_forms
for each row
execute function private.set_updated_at();

create or replace function private.keep_service_form_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.code is distinct from old.code then
    raise exception 'the code of a service form cannot change'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function private.keep_service_form_code() from public, anon, authenticated;

create trigger service_forms_keep_code
before update on public.service_forms
for each row
execute function private.keep_service_form_code();

create policy "Authenticated users can view service forms"
on public.service_forms
for select
to authenticated
using (true);

create policy "Administrators can create service forms"
on public.service_forms
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Administrators can update service forms"
on public.service_forms
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

revoke all on public.service_forms from anon;

insert into public.service_forms (code, name, subtitle) values
  ('F-SER-003', 'Solicitud de cotización', null),
  ('F-SER-005', 'Levantamiento', 'Equipo de SCI'),
  ('F-SER-008', 'Orden de trabajo', 'Fábrica y servicios'),
  ('F-SER-013', 'Bomba diésel', 'Anual'),
  ('F-SER-014', 'Bomba diésel', 'Mensual'),
  ('F-SER-015', 'Bomba diésel', 'Semanal'),
  ('F-SER-017', 'Mangueras contra incendio', 'Prueba hidrostática'),
  ('F-SER-018', 'Red hidráulica', 'Trimestral'),
  ('F-SER-023', 'Agentes limpios', 'Mensual'),
  ('F-SER-024', 'Agentes limpios', 'Semestral y anual'),
  ('F-SER-034', 'Prueba de desempeño', 'Sistema de bombeo'),
  ('F-SER-039', 'Prueba de hidrantes', 'Inspección y mantenimiento'),
  ('F-SER-040', 'Pruebas de integridad a recintos', 'Door-Fan Test'),
  ('F-SER-045', 'Reporte de observaciones', null),
  ('F-SER-059', 'Sistema de supresión de cocina', null),
  ('F-SER-097', 'Sistemas de extinción', 'Por químico seco'),
  ('F-SER-098', 'Bomba eléctrica', null),
  ('F-SER-099', 'Supresión de chispa', null),
  ('F-SER-100', 'Válvulas de control', 'Semanal'),
  ('F-SER-101', 'Válvulas de control', 'Mensual'),
  ('F-SER-102', 'Válvulas de control', 'Trimestral'),
  ('F-SER-103', 'Válvulas de control', 'Anual'),
  ('F-SER-104', 'Servicio rociadores', 'Semanal'),
  ('F-SER-105', 'Servicio rociadores', 'Mensual'),
  ('F-SER-106', 'Servicio rociadores', 'Anual'),
  ('F-SER-107', 'Gabinetes y racks', 'Mensual'),
  ('F-SER-108', 'Gabinetes y racks', 'Anual'),
  ('F-SER-109', 'Sistema de alarmas', 'Semanal'),
  ('F-SER-110', 'Sistema de alarmas', 'Mensual'),
  ('F-SER-111', 'Sistema de alarmas', 'Anual')
on conflict (code) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('form-icons', 'form-icons', true, 524288, array['image/svg+xml', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Authenticated users can view form icons"
on storage.objects
for select
to authenticated
using (bucket_id = 'form-icons');

create policy "Administrators can upload form icons"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'form-icons' and (select private.is_admin()));

create policy "Administrators can replace form icons"
on storage.objects
for update
to authenticated
using (bucket_id = 'form-icons' and (select private.is_admin()))
with check (bucket_id = 'form-icons' and (select private.is_admin()));

create policy "Administrators can remove form icons"
on storage.objects
for delete
to authenticated
using (bucket_id = 'form-icons' and (select private.is_admin()));
