import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareCatalogForms } from '../src/service-forms/catalog-order.ts';

const form = (code: string, name: string, subtitle: string | null = null) => ({
  code,
  name,
  subtitle,
});

test('forms are sorted by name and then by frequency, taken from the code', () => {
  const forms = [
    form('diesel_pump_annual', 'Bomba diésel', 'Anual'),
    form('clean_agent_semiannual_annual', 'Agentes limpios', 'Semestral y Anual'),
    form('diesel_pump_weekly', 'Bomba diésel', 'semanal'),
    form('electric_pump', 'Bomba eléctrica'),
    form('clean_agent_monthly', 'Agentes limpios', 'Mensual'),
    form('control_valves_quarterly', 'Válvulas de control', 'Cada tres meses'),
    form('diesel_pump_monthly', 'Bomba diésel', 'Mensual'),
    form('control_valves_weekly', 'Válvulas de control', 'Semanal'),
  ];

  assert.deepEqual(
    [...forms].sort(compareCatalogForms).map((item) => item.code),
    [
      'clean_agent_monthly',
      'clean_agent_semiannual_annual',
      'diesel_pump_weekly',
      'diesel_pump_monthly',
      'diesel_pump_annual',
      'electric_pump',
      'control_valves_weekly',
      'control_valves_quarterly',
    ],
  );
});
