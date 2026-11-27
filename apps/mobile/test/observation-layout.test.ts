import assert from 'node:assert/strict';
import { test } from 'node:test';

import { observationFields } from '../../../packages/shared/src/form-definition.ts';
import { arrangeObservation, observationSummary } from '../src/forms/observation-layout.ts';

const ids = (groups: ReturnType<typeof arrangeObservation>) =>
  groups.map((group) => [group.title, group.rows.map((row) => row.map((field) => field.id))]);

test('the observation fields are arranged in four blocks', () => {
  assert.deepEqual(ids(arrangeObservation(observationFields)), [
    ['Dónde está', [['system', 'component', 'location']]],
    ['Hallazgo', [['classification'], ['observation', 'impact']]],
    ['Seguimiento', [['corrective_action'], ['status', 'closed_on', 'quote_required']]],
    ['Evidencia', [['photos']]],
  ]);
});

test('a field the layout does not know still shows at the end', () => {
  const extra = { id: 'reference', type: 'text' as const, label: 'Referencia' };
  const groups = arrangeObservation([...observationFields, extra]);
  assert.deepEqual(ids(groups).at(-1), ['Otros datos', [['reference']]]);
});

test('missing fields leave no empty rows or blocks', () => {
  const only = observationFields.filter((field) => ['system', 'photos'].includes(field.id));
  assert.deepEqual(ids(arrangeObservation(only)), [
    ['Dónde está', [['system']]],
    ['Evidencia', [['photos']]],
  ]);
});

test('the summary names the system, component and location that are filled', () => {
  assert.equal(
    observationSummary({ system: 'Rociadores', component: '', location: 'Nivel 2' }),
    'Rociadores, Nivel 2',
  );
  assert.equal(observationSummary({ system: '  ', location: undefined }), '');
});
