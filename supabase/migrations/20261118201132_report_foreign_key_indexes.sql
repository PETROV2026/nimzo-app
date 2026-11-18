/*
 * Migration: report foreign key indexes
 *
 * Purpose:
 *   - reports.system_id and reports.service_package_id reference systems and service_packages with
 *     on delete restrict, but have no index. Every delete of a system or a package then scans the
 *     whole reports table to check for references, and filtering reports by system or package
 *     cannot use an index. reports only grows (sent reports are never deleted), so the cost grows
 *     with it.
 *
 * Affected objects:
 *   - new indexes: reports_system_id_idx, reports_service_package_id_idx
 *
 * Notes:
 *   - both columns are nullable and most reports are expected to have them; a full index keeps
 *     the foreign key checks fast without a partial predicate.
 *   - supabase/tests/foreign-key-indexes.test.mjs fails if any foreign key in public is left
 *     without an index that starts with its columns.
 */

create index reports_system_id_idx on public.reports (system_id);

create index reports_service_package_id_idx on public.reports (service_package_id);
