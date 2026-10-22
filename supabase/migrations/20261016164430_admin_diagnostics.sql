/*
 * Migration: admin diagnostics
 *
 * Purpose:
 *   - public.admin_diagnostics() returns a read-only snapshot of the database for the admin panel's
 *     "Herramientas > Diagnóstico" page: public tables with their row count, rls flag and number of
 *     policies, applied migrations, users per role and the postgres version.
 *
 * Affected objects:
 *   - new function: public.admin_diagnostics()
 *
 * Security:
 *   - security definer so it can count rows and read supabase_migrations, which the caller cannot.
 *   - it takes no input and runs no caller-provided sql, so it cannot be used to read anything else.
 *   - only active admins get a result; everyone else gets a permission error.
 *   - anon cannot execute it at all.
 */

create or replace function public.admin_diagnostics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  table_info record;
  table_rows bigint;
  tables jsonb := '[]'::jsonb;
  migrations jsonb := '[]'::jsonb;
begin
  if not private.is_admin() then
    raise exception 'only administrators can read diagnostics'
      using errcode = '42501';
  end if;

  for table_info in
    select
      c.relname as name,
      c.relrowsecurity as rls_enabled,
      (
        select count(*)
        from pg_catalog.pg_policies p
        where p.schemaname = 'public' and p.tablename = c.relname
      ) as policies
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname
  loop
    execute format('select count(*) from public.%I', table_info.name) into table_rows;
    tables := tables || jsonb_build_object(
      'name', table_info.name,
      'rows', table_rows,
      'rls_enabled', table_info.rls_enabled,
      'policies', table_info.policies
    );
  end loop;

  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute $query$
      select coalesce(
        jsonb_agg(to_jsonb(m) - 'statements' order by m.version desc),
        '[]'::jsonb
      )
      from supabase_migrations.schema_migrations m
    $query$
    into migrations;
  end if;

  return jsonb_build_object(
    'generated_at', now(),
    'postgres_version', current_setting('server_version'),
    'tables', tables,
    'migrations', migrations,
    'users', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('role', role::text, 'active', active, 'inactive', inactive)
          order by role
        )
        from (
          select
            role,
            count(*) filter (where is_active) as active,
            count(*) filter (where not is_active) as inactive
          from public.profiles
          group by role
        ) counts
      ),
      '[]'::jsonb
    )
  );
end;
$$;

comment on function public.admin_diagnostics() is 'Read-only database snapshot for the admin panel. Only active admins get a result.';

revoke execute on function public.admin_diagnostics() from public, anon;
grant execute on function public.admin_diagnostics() to authenticated;
