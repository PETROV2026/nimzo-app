/*
 * Removes the demo catalogs inserted by supabase/seeds/demo-catalogs.sql
 * and supabase/seeds/demo-reports.sql (every client with notes = 'Datos de ejemplo', with its demo
 * reports, branches, systems and service packages).
 *
 *   pnpm supabase db query --linked -f supabase/seeds/remove-demo-catalogs.sql
 */

with demo_clients as (
  select id from public.clients where notes = 'Datos de ejemplo'
),
demo_branches as (
  select id from public.branches where client_id in (select id from demo_clients)
),
deleted_reports as (
  delete from public.reports
  where client_id in (select id from demo_clients) and snapshot @> '{"demo": true}'
  returning id
),
demo_packages as (
  select id from public.service_packages where branch_id in (select id from demo_branches)
),
deleted_package_forms as (
  delete from public.service_package_forms where package_id in (select id from demo_packages) returning id
),
deleted_packages as (
  delete from public.service_packages where id in (select id from demo_packages) returning id
),
deleted_systems as (
  delete from public.systems where branch_id in (select id from demo_branches) returning id
),
deleted_branches as (
  delete from public.branches
  where id in (select id from demo_branches)
  returning id
),
deleted_clients as (
  delete from public.clients
  where id in (select id from demo_clients)
  returning id
)
select (select count(*) from deleted_clients) as clients,
       (select count(*) from deleted_branches) as branches,
       (select count(*) from deleted_systems) as systems,
       (select count(*) from deleted_packages) as packages,
       (select count(*) from deleted_reports) as reports
