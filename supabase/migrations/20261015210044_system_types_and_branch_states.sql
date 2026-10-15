/*
 * Migration: system types and branch states
 *
 * Purpose:
 *   - systems.system_type becomes a fixed list of english codes (public.system_type).
 *     the spanish labels shown to users live in packages/shared/src/systems.ts.
 *   - branches.state only accepts the iso 3166-2 code of a mexican state (e.g. 'NLE' for nuevo leon).
 *     the display names live in packages/shared/src/mexican-states.ts.
 *
 * Affected objects:
 *   - new type: public.system_type
 *   - column public.systems.system_type (text -> public.system_type)
 *   - new check constraint: branches_state_check
 *
 * Notes:
 *   - both tables were empty when this migration was written, so the type change needs no data mapping.
 *     the cast fails loudly if a row with an unknown value exists.
 */

create type public.system_type as enum (
  'sprinkler',
  'hydrant',
  'fire_pump',
  'fire_extinguisher',
  'fire_alarm',
  'kitchen_suppression',
  'clean_agent',
  'other'
);

comment on type public.system_type is 'Fire protection system types. Must match packages/shared/src/systems.ts.';

alter table public.systems
  alter column system_type type public.system_type using system_type::public.system_type;

alter table public.branches
  add constraint branches_state_check check (
    state in (
      'AGU', 'BCN', 'BCS', 'CAM', 'CHH', 'CHP', 'CMX', 'COA',
      'COL', 'DUR', 'GRO', 'GUA', 'HID', 'JAL', 'MEX', 'MIC',
      'MOR', 'NAY', 'NLE', 'OAX', 'PUE', 'QUE', 'ROO', 'SIN',
      'SLP', 'SON', 'TAB', 'TAM', 'TLA', 'VER', 'YUC', 'ZAC'
    )
  );

comment on column public.branches.state is 'ISO 3166-2 code of the mexican state, without the MX- prefix. Must match packages/shared/src/mexican-states.ts.';
