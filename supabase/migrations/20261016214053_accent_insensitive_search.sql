/*
 * Migration: accent-insensitive search
 *
 * Purpose:
 *   - the admin panel searches clients, branches, systems and users ignoring accents and case:
 *     «tecnica» finds «Técnica», «pena» finds «Peña».
 *   - each table gets a generated column search_text with its searchable fields, unaccented and in
 *     lower case. the panel normalizes the term the same way and filters with ilike on that column.
 *   - a trigram index on each search_text keeps «contains» searches fast as the tables grow.
 *
 * Affected objects:
 *   - extensions: unaccent, pg_trgm (in the extensions schema, as supabase recommends)
 *   - new function: private.search_text(text)
 *   - new generated columns: clients.search_text (name, tax_id), branches.search_text (name, city),
 *     systems.search_text (name, location), profiles.search_text (full_name, email)
 *   - new gin indexes on each search_text
 *
 * Notes:
 *   - the column is generated: nobody writes it, postgres recomputes it on every insert or update.
 *   - private.search_text is immutable because the unaccent dictionary is passed explicitly.
 */

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function private.search_text(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, '')));
$$;

comment on function private.search_text(text) is 'Unaccented, lower-case text for accent-insensitive search columns.';

revoke execute on function private.search_text(text) from public, anon;
grant execute on function private.search_text(text) to authenticated, service_role;

alter table public.clients
  add column search_text text generated always as (
    private.search_text(name || ' ' || coalesce(tax_id, ''))
  ) stored;

alter table public.branches
  add column search_text text generated always as (
    private.search_text(name || ' ' || coalesce(city, ''))
  ) stored;

alter table public.systems
  add column search_text text generated always as (
    private.search_text(name || ' ' || coalesce(location, ''))
  ) stored;

alter table public.profiles
  add column search_text text generated always as (
    private.search_text(full_name || ' ' || coalesce(email, ''))
  ) stored;

create index clients_search_text_idx on public.clients using gin (search_text extensions.gin_trgm_ops);
create index branches_search_text_idx on public.branches using gin (search_text extensions.gin_trgm_ops);
create index systems_search_text_idx on public.systems using gin (search_text extensions.gin_trgm_ops);
create index profiles_search_text_idx on public.profiles using gin (search_text extensions.gin_trgm_ops);
