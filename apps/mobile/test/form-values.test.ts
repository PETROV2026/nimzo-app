import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { formDefinitionSchema } from '../../../packages/shared/src/form-definition.ts';
import {
  conditionFields,
  hiddenIds,
  isEmptyValue,
  isVisible,
  missingRequired,
  pathAndParents,
  sameAnswers,
  visibleValues,
} from '../src/forms/form-values.ts';

const formatos = path.resolve(import.meta.dirname, '../../../packages/shared/formatos');

function load(code: string) {
  return formDefinitionSchema.parse(
    JSON.parse(readFileSync(path.join(formatos, `${code}.json`), 'utf8')),
  );
}

function definition(children: unknown[], report: unknown[] = []) {
  return formDefinitionSchema.parse({
    code: 'test_form',
    version: 1,
    report,
    sections: [{ id: 'main', title: 'Principal', children }],
  });
}

test('empty values are undefined, null, false, blank text and empty lists', () => {
  for (const value of [undefined, null, false, '', '   ', []]) {
    assert.equal(isEmptyValue(value), true, JSON.stringify(value));
  }
  for (const value of [0, 'no', true, 'texto', { status: 'na' }, [{ uri: 'a' }]]) {
    assert.equal(isEmptyValue(value), false, JSON.stringify(value));
  }
});

test('a node without a condition is always visible', () => {
  assert.equal(isVisible(undefined, {}), true);
});

test('a condition is met only when the field has exactly that value', () => {
  const condition = { field: 'permit_other', equals: true };
  assert.equal(isVisible(condition, { permit_other: true }), true);
  assert.equal(isVisible(condition, { permit_other: false }), false);
  assert.equal(isVisible(condition, {}), false);
});

test('required fields that are empty are listed in form order', () => {
  const form = definition(
    [
      { id: 'second', type: 'text', label: 'Segundo', required: true },
      { id: 'optional', type: 'text', label: 'Opcional' },
      { id: 'third', type: 'yes_no', label: 'Tercero', required: true },
    ],
    [{ id: 'first', type: 'date', label: 'Primero', required: true }],
  );
  assert.deepEqual(missingRequired(form, {}), ['first', 'second', 'third']);
  assert.deepEqual(missingRequired(form, { first: '2026-11-23', third: 'no' }), ['second']);
});

test('a required checkbox must be checked', () => {
  const form = definition([{ id: 'agree', type: 'checkbox', label: 'Acepto', required: true }]);
  assert.deepEqual(missingRequired(form, { agree: false }), ['agree']);
  assert.deepEqual(missingRequired(form, { agree: true }), []);
});

test('hidden required fields are not missing', () => {
  const form = definition([
    { id: 'other', type: 'checkbox', label: 'Otros' },
    {
      id: 'other_detail',
      type: 'text',
      label: 'Especifique',
      required: true,
      visibleWhen: { field: 'other', equals: true },
    },
  ]);
  assert.deepEqual(missingRequired(form, {}), []);
  assert.deepEqual(missingRequired(form, { other: true }), ['other_detail']);
});

test('fields inside a hidden group are hidden too', () => {
  const form = definition([
    { id: 'has_pump', type: 'yes_no', label: 'Tiene bomba' },
    {
      type: 'group',
      id: 'pump',
      label: 'Bomba',
      visibleWhen: { field: 'has_pump', equals: 'yes' },
      children: [{ id: 'pump_brand', type: 'text', label: 'Marca', required: true }],
    },
  ]);
  assert.deepEqual(missingRequired(form, { has_pump: 'no', pump_brand: 'Marca X' }), []);
  assert.deepEqual(visibleValues(form, { has_pump: 'no', pump_brand: 'Marca X' }), {
    has_pump: 'no',
  });
  assert.deepEqual(missingRequired(form, { has_pump: 'yes' }), ['pump_brand']);
});

test('a field that depends on a hidden field is hidden', () => {
  const form = definition([
    { id: 'a', type: 'checkbox', label: 'A' },
    { id: 'b', type: 'checkbox', label: 'B', visibleWhen: { field: 'a', equals: true } },
    { id: 'c', type: 'text', label: 'C', visibleWhen: { field: 'b', equals: true } },
  ]);
  assert.deepEqual(visibleValues(form, { a: false, b: true, c: 'texto' }), { a: false });
});

test('hidden values are dropped and the rest are kept', () => {
  const form = load('work_order');
  const values = {
    permit_other: false,
    permit_other_detail: 'Ya no aplica',
    ppe_other: true,
    ppe_other_detail: 'Careta',
    comments: 'Sin novedades.',
  };
  assert.deepEqual(visibleValues(form, values), {
    permit_other: false,
    ppe_other: true,
    ppe_other_detail: 'Careta',
    comments: 'Sin novedades.',
  });
});

test('condition fields are the ids other nodes depend on, once each', () => {
  assert.deepEqual(conditionFields(load('work_order')), ['permit_other', 'ppe_other']);
});

test('hidden ids include hidden groups and their fields', () => {
  const form = definition([
    { id: 'has_pump', type: 'yes_no', label: 'Tiene bomba' },
    {
      type: 'group',
      id: 'pump',
      visibleWhen: { field: 'has_pump', equals: 'yes' },
      children: [{ id: 'pump_brand', type: 'text', label: 'Marca' }],
    },
  ]);
  assert.deepEqual([...hiddenIds(form, {})].sort(), ['pump', 'pump_brand']);
  assert.deepEqual([...hiddenIds(form, { has_pump: 'yes' })], []);
});

test('site_survey shows the detail of other uses only when it is checked', () => {
  const form = load('site_survey');
  assert.deepEqual(visibleValues(form, { has_other_detail: 'Taller' }), {});
  assert.deepEqual(visibleValues(form, { has_other: true, has_other_detail: 'Taller' }), {
    has_other: true,
    has_other_detail: 'Taller',
  });
});

test('a required field in a list row is missing for that row only', () => {
  const form = definition([
    {
      type: 'list',
      id: 'tanks',
      label: 'Tanques',
      addLabel: 'Agregar tanque',
      children: [
        { id: 'tank_name', type: 'text', label: 'Tanque' },
        { id: 'tank_status', type: 'check', label: 'Estado', required: true },
      ],
    },
  ]);
  assert.deepEqual(missingRequired(form, {}), []);
  assert.deepEqual(
    missingRequired(form, { tanks: [{ tank_status: { status: 'ok' } }, { tank_name: 'B' }] }),
    ['tanks.1.tank_status'],
  );
});

test('a form with a service type needs one chosen before anything else', () => {
  const form = formDefinitionSchema.parse({
    code: 'test_form',
    version: 1,
    report: [],
    serviceType: { options: [{ value: 'full', label: 'Completo', sections: ['main'] }] },
    sections: [
      {
        id: 'main',
        title: 'Principal',
        children: [{ id: 'a', type: 'check', label: 'A', required: true }],
      },
    ],
  });
  assert.deepEqual(missingRequired(form, {}), ['service_type']);
  assert.deepEqual(missingRequired(form, { service_type: 'full' }), ['a']);
});

function itemsForm(itemServiceType?: unknown) {
  return formDefinitionSchema.parse({
    code: 'test_form',
    version: 1,
    report: [],
    sections: [],
    items: {
      id: 'valves',
      addLabel: 'Agregar válvula',
      title: 'Válvulas',
      keyLabel: 'Número de válvula',
      ...(itemServiceType ? { serviceType: itemServiceType } : {}),
      sections: [
        {
          id: 'visual',
          title: 'Visual',
          children: [{ id: 'sealed', type: 'yes_no', label: 'Sellada', required: true }],
        },
        {
          id: 'test',
          title: 'Prueba',
          children: [{ id: 'opens', type: 'check', label: 'Abre', required: true }],
        },
      ],
    },
  });
}

test('a form with items needs at least one item', () => {
  assert.deepEqual(missingRequired(itemsForm(), {}), ['valves']);
  assert.deepEqual(missingRequired(itemsForm(), { valves: [] }), ['valves']);
});

test('required fields are checked in every item, with the path of the item', () => {
  const values = {
    valves: [
      { key: 'V-1', sealed: 'yes', opens: { status: 'ok' } },
      { key: 'V-2', sealed: 'no' },
    ],
  };
  assert.deepEqual(missingRequired(itemsForm(), values), ['valves.1.opens']);
});

test('each item needs its own service type, and only its enabled sections count', () => {
  const form = itemsForm({
    options: [
      { value: 'visual', label: 'Visual', sections: ['visual'] },
      { value: 'full', label: 'Completa', sections: ['visual', 'test'] },
    ],
  });
  const values = { valves: [{ key: 'V-1' }, { key: 'V-2', service_type: 'visual', sealed: 'no' }] };
  assert.deepEqual(missingRequired(form, values), ['valves.0.service_type']);
});

test('a missing field inside an item falls back to the item and then to the list', () => {
  assert.deepEqual(pathAndParents('valves.1.opens'), ['valves.1.opens', 'valves.1', 'valves']);
  assert.deepEqual(pathAndParents('fecha'), ['fecha']);
});

test('answers are the same when only their order or their empty fields change', () => {
  assert.equal(sameAnswers({ a: 'x', b: { value: 1 } }, { b: { value: 1 }, a: 'x' }), true);
  assert.equal(sameAnswers({ a: 'x' }, { a: 'x', b: undefined, c: '', d: [], e: false }), true);
  assert.equal(sameAnswers({ rows: [{ a: 'x' }] }, { rows: [{ a: 'x', b: '' }] }), true);
});

test('answers are different when a value, a row or a photo changes', () => {
  assert.equal(sameAnswers({ a: 'x' }, { a: 'y' }), false);
  assert.equal(sameAnswers({ a: 'x' }, {}), false);
  assert.equal(sameAnswers({ a: { status: 'ok' } }, { a: { status: 'ok', value: 0 } }), false);
  assert.equal(sameAnswers({ rows: [{ a: 'x' }] }, { rows: [{ a: 'x' }, {}] }), false);
  assert.equal(sameAnswers({ p: [{ uri: 'a' }] }, { p: [{ uri: 'b' }] }), false);
});
