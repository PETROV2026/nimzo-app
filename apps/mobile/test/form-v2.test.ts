import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { formDefinitionSchema } from '../../../packages/shared/src/form-definition.ts';
import {
  enabledSections,
  entryProgress,
  evaluateExpression,
  formProgress,
  hasAnswer,
  itemKeyProblem,
  missingRequired,
  numericValue,
  visibleValues,
} from '../src/forms/form-values.ts';

const formatos = path.resolve(import.meta.dirname, '../../../packages/shared/formatos');

function load(code: string) {
  return formDefinitionSchema.parse(
    JSON.parse(readFileSync(path.join(formatos, `${code}.json`), 'utf8')),
  );
}

const resolver = (values: Record<string, number>) => (name: string) => values[name];

test('expressions support + - * / ^ and parentheses with the usual precedence', () => {
  assert.equal(evaluateExpression('a + b * c', resolver({ a: 1, b: 2, c: 3 })), 7);
  assert.equal(evaluateExpression('(a + b) * c', resolver({ a: 1, b: 2, c: 3 })), 9);
  assert.equal(evaluateExpression('a ^ 2 / 4', resolver({ a: 4 })), 4);
  assert.equal(
    evaluateExpression('discharge - suction', resolver({ discharge: 120, suction: 20 })),
    100,
  );
  assert.equal(evaluateExpression('-a + 10', resolver({ a: 3 })), 7);
  assert.equal(
    evaluateExpression('water_column_ft / 2.31', resolver({ water_column_ft: 23.1 })),
    10,
  );
});

test('an expression with a missing value or a division by zero has no result', () => {
  assert.equal(evaluateExpression('a + b', resolver({ a: 1 })), undefined);
  assert.equal(evaluateExpression('a / b', resolver({ a: 1, b: 0 })), undefined);
  assert.equal(evaluateExpression('a +', resolver({ a: 1 })), undefined);
});

test('numeric values come from numbers, numeric text and measured checks', () => {
  assert.equal(numericValue(12.5), 12.5);
  assert.equal(numericValue('7,5'), 7.5);
  assert.equal(numericValue({ status: 'ok', value: 40 }), 40);
  assert.equal(numericValue(''), undefined);
  assert.equal(numericValue({ status: 'na' }), undefined);
});

test('answers count only when they hold something', () => {
  assert.equal(hasAnswer({ row_1: { min_voltage: '' } }), false);
  assert.equal(hasAnswer({ row_1: { min_voltage: 12 } }), true);
  assert.equal(hasAnswer([{ tank_id: '  ' }]), false);
  assert.equal(hasAnswer([{ tank_id: 'T-1' }]), true);
  assert.equal(hasAnswer({ status: 'na' }), true);
  assert.equal(hasAnswer(false), false);
});

test('the service type enables only its sections', () => {
  const form = load('electric_pump');
  const ids = (values: Record<string, unknown>) =>
    enabledSections(form.sections, form.serviceType, values).map((section) => section.id);
  assert.deepEqual(ids({}), []);
  assert.deepEqual(ids({ service_type: 'monthly' }), ['section_1', 'section_2']);
  assert.deepEqual(ids({ service_type: 'custom', custom_sections: ['section_3'] }), ['section_3']);
});

test('a form without a service type shows every section', () => {
  const form = load('diesel_pump_weekly');
  assert.equal(enabledSections(form.sections, form.serviceType, {}).length, form.sections.length);
});

test('values of sections the service type leaves out are dropped', () => {
  const form = load('electric_pump');
  const values = visibleValues(form, {
    service_type: 'weekly',
    custom_sections: ['section_4'],
    monthly_1: { status: 'ok' },
    inspection_2: { status: 'ok' },
  });
  assert.equal(values.service_type, 'weekly');
  assert.equal('custom_sections' in values, false);
  assert.equal('monthly_1' in values, false);
  assert.deepEqual(values.inspection_2, { status: 'ok' });
});

test('item entries keep their key and only the fields of their enabled sections', () => {
  const form = load('dry_chemical_systems');
  const values = visibleValues(form, {
    service_type: 'monthly',
    protected_areas: [
      { key: 'Cocina', inspection_1: { status: 'ok' }, maintenance_1: { status: 'x' } },
    ],
  });
  assert.deepEqual(values.protected_areas, [{ key: 'Cocina', inspection_1: { status: 'ok' } }]);
});

test('progress counts the service type, item answers and tables', () => {
  const hydrants = load('hydrant_test');
  const before = formProgress(hydrants, {});
  assert.deepEqual(before.serviceType, { answered: 0, total: 1 });
  assert.deepEqual(before.items, { answered: 0, total: 0 });

  const after = formProgress(hydrants, {
    service_type: 'semiannual',
    hydrants: [{ key: 'H-1', inspection_1: { status: 'ok' } }],
  });
  assert.deepEqual(after.serviceType, { answered: 1, total: 1 });
  assert.equal(after.items?.answered, 1);
  assert.ok((after.items?.total ?? 0) > 1);

  const pump = load('diesel_pump_monthly');
  const table = pump.sections.find((section) =>
    section.children.some((node) => node.type === 'table'),
  );
  assert.ok(table);
  const empty = formProgress(pump, {}).sections.find((section) => section.id === table.id);
  const filled = formProgress(pump, {
    manual_starts: { start_1: { min_voltage: 12 } },
  }).sections.find((section) => section.id === table.id);
  assert.equal((filled?.answered ?? 0) - (empty?.answered ?? 0), 1);
});

test('progress only lists the sections the service type enables', () => {
  const form = load('electric_pump');
  assert.deepEqual(formProgress(form, {}).sections, []);
  assert.equal(formProgress(form, { service_type: 'annual' }).sections.length, 4);
});

test('required fields of disabled sections are not missing', () => {
  const form = formDefinitionSchema.parse({
    code: 'test_form',
    version: 1,
    report: [],
    serviceType: {
      options: [
        { value: 'monthly', label: 'Mensual', sections: ['a'] },
        { value: 'annual', label: 'Anual', sections: ['a', 'b'] },
      ],
    },
    sections: [
      { id: 'a', title: 'A', children: [{ id: 'x', type: 'text', label: 'X' }] },
      { id: 'b', title: 'B', children: [{ id: 'y', type: 'text', label: 'Y', required: true }] },
    ],
  });
  assert.deepEqual(missingRequired(form, { service_type: 'monthly' }), []);
  assert.deepEqual(missingRequired(form, { service_type: 'annual' }), ['y']);
});

test('an item key must be written and must not repeat', () => {
  const entries = [{ key: 'V-1' }];
  assert.equal(itemKeyProblem('  ', entries, 'Número de válvula'), 'Escribe el número de válvula');
  assert.equal(itemKeyProblem('v-1', entries, 'Número de válvula'), 'Ya agregaste V-1');
  assert.equal(itemKeyProblem('V-2', entries, 'Número de válvula'), undefined);
});

test('each item entry has its own progress', () => {
  const form = load('control_valves_weekly');
  const empty = entryProgress(form, {}, { key: 'V-1' });
  assert.equal(empty.answered, 0);
  assert.ok(empty.total > 0);
  const flatten = (
    nodes: { type: string; children?: unknown[] }[],
  ): { type: string; id?: string }[] =>
    nodes.flatMap((node) =>
      node.children ? flatten(node.children as { type: string }[]) : [node],
    );
  const firstField = flatten(form.items?.sections[0].children ?? []).find(
    (node) => node.type === 'check',
  );
  assert.ok(firstField?.id);
  assert.equal(
    entryProgress(form, {}, { key: 'V-1', [firstField.id]: { status: 'ok' } }).answered,
    1,
  );
});
