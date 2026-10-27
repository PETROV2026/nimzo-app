/*
 * Migration: own service form keys
 *
 * Purpose:
 *   - the F-SER-XXX codes were the internal numbering of the company whose forms served as a
 *     model. Nimzo uses its own keys instead (snake_case, in English, e.g. diesel_pump_annual).
 *   - the key is internal: the apps show the form by its name and subtitle, never by its key.
 *
 * Affected objects:
 *   - public.service_forms: every code is renamed and the check on code accepts snake_case keys
 *   - public.reports: form_code follows the rename, so sent reports keep pointing to their form
 *
 * Notes:
 *   - codes and sent reports never change through the api. This migration is the one exception:
 *     it disables the triggers that guard them only while renaming and enables them again.
 *   - service packages reference forms by id, so they need no change.
 */

alter table public.service_forms drop constraint service_forms_code_check;

alter table public.service_forms disable trigger service_forms_keep_code;

update public.service_forms f
set code = k.new_code
from (values
  ('F-SER-003', 'quote_request'),
  ('F-SER-005', 'site_survey'),
  ('F-SER-008', 'work_order'),
  ('F-SER-013', 'diesel_pump_annual'),
  ('F-SER-014', 'diesel_pump_monthly'),
  ('F-SER-015', 'diesel_pump_weekly'),
  ('F-SER-017', 'fire_hose_hydrostatic_test'),
  ('F-SER-018', 'water_network_quarterly'),
  ('F-SER-023', 'clean_agent_monthly'),
  ('F-SER-024', 'clean_agent_semiannual_annual'),
  ('F-SER-034', 'pump_performance_test'),
  ('F-SER-039', 'hydrant_test'),
  ('F-SER-040', 'enclosure_integrity_test'),
  ('F-SER-045', 'observations_report'),
  ('F-SER-059', 'kitchen_suppression'),
  ('F-SER-097', 'dry_chemical_systems'),
  ('F-SER-098', 'electric_pump'),
  ('F-SER-099', 'spark_suppression'),
  ('F-SER-100', 'control_valves_weekly'),
  ('F-SER-101', 'control_valves_monthly'),
  ('F-SER-102', 'control_valves_quarterly'),
  ('F-SER-103', 'control_valves_annual'),
  ('F-SER-104', 'sprinklers_weekly'),
  ('F-SER-105', 'sprinklers_monthly'),
  ('F-SER-106', 'sprinklers_annual'),
  ('F-SER-107', 'cabinets_racks_monthly'),
  ('F-SER-108', 'cabinets_racks_annual'),
  ('F-SER-109', 'fire_alarm_weekly'),
  ('F-SER-110', 'fire_alarm_monthly'),
  ('F-SER-111', 'fire_alarm_annual')
) as k (old_code, new_code)
where f.code = k.old_code;

alter table public.service_forms enable trigger service_forms_keep_code;

alter table public.reports disable trigger reports_keep;

update public.reports r
set form_code = f.code
from public.service_forms f
where f.id = r.service_form_id
  and r.form_code is distinct from f.code;

alter table public.reports enable trigger reports_keep;

alter table public.service_forms
add constraint service_forms_code_check check (code ~ '^[a-z][a-z0-9_]*$');

comment on table public.service_forms is 'Catalog of service forms. The code is an internal key that identifies the form in reports and never changes; the apps show the name and subtitle.';
