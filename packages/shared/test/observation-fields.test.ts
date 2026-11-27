import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  fieldSchema,
  formDefinitionSchema,
  nodeSchema,
  observationFields,
  serviceObservationFields,
} from '../src/form-definition.ts';

test('every observation has its place, classification, findings and up to four photos', () => {
  assert.deepEqual(
    observationFields.map((field) => [field.id, field.type, field.label]),
    [
      ['system', 'text', 'Sistema'],
      ['component', 'text', 'Equipo / Componente'],
      ['location', 'text', 'Ubicación'],
      ['classification', 'choice', 'Clasificación'],
      ['status', 'choice', 'Estado'],
      ['closed_on', 'date', 'Fecha de cierre'],
      ['quote_required', 'yes_no', '¿Requiere cotización?'],
      ['observation', 'text', 'Observación'],
      ['impact', 'text', 'Impacto'],
      ['corrective_action', 'text', 'Acción correctiva'],
      ['photos', 'photos', 'Fotos'],
    ],
  );
  const photos = observationFields.find((field) => field.type === 'photos');
  assert.equal(photos?.type === 'photos' && photos.count, 4);
  assert.equal(photos?.required, undefined);
});

test('the observation fields are valid form fields', () => {
  for (const field of observationFields) assert.deepEqual(fieldSchema.parse(field), field);
});

test('only the component is a single line among the new text fields', () => {
  const multiline = (id: string) => {
    const field = observationFields.find((item) => item.id === id);
    return field?.type === 'text' ? Boolean(field.multiline) : undefined;
  };
  assert.equal(multiline('component'), false);
  assert.equal(multiline('impact'), true);
  assert.equal(multiline('corrective_action'), true);
});

test('observations are classified as in NFPA 25', () => {
  const field = observationFields.find((item) => item.id === 'classification');
  assert.deepEqual(
    field?.type === 'choice' && field.options.map(({ value, label }) => ({ value, label })),
    [
      { value: 'noncritical_deficiency', label: 'Deficiencia no crítica' },
      { value: 'critical_deficiency', label: 'Deficiencia crítica' },
      { value: 'impairment', label: 'Fuera de servicio' },
    ],
  );
});

test('the closing date only shows for a closed observation', () => {
  const field = observationFields.find((item) => item.id === 'closed_on');
  assert.deepEqual(field && 'visibleWhen' in field && field.visibleWhen, {
    field: 'status',
    equals: 'closed',
  });
});

test('no observation field is required', () => {
  assert.equal(
    observationFields.some((field) => field.required),
    false,
  );
});

test('an observations node gets the observation fields when it is read', () => {
  assert.deepEqual(nodeSchema.parse({ type: 'observations', id: 'client_observations' }), {
    type: 'observations',
    id: 'client_observations',
    children: observationFields,
  });
});

test('a service observation keeps only the observation, its classification and photos', () => {
  assert.deepEqual(
    serviceObservationFields.map((field) => field.id),
    ['observation', 'classification', 'photos'],
  );
  for (const field of serviceObservationFields) {
    assert.equal(
      field,
      observationFields.find((item) => item.id === field.id),
    );
  }
});

const minimalForm = {
  code: 'test_form',
  version: 1,
  report: [],
  sections: [
    { id: 'main', title: 'Principal', children: [{ id: 'a', type: 'check', label: 'A' }] },
  ],
};

test('a form that asks for service observations gets the observations node', () => {
  assert.deepEqual(
    formDefinitionSchema.parse({ ...minimalForm, serviceObservations: true }).serviceObservations,
    {
      type: 'observations',
      id: 'service_observations',
      children: serviceObservationFields,
    },
  );
  assert.equal(formDefinitionSchema.parse(minimalForm).serviceObservations, undefined);
});

test('the service observations id cannot be used by another field', () => {
  const result = formDefinitionSchema.safeParse({
    ...minimalForm,
    serviceObservations: true,
    report: [{ id: 'service_observations', type: 'text', label: 'Repetido' }],
  });
  assert.equal(result.success, false);
  assert.ok(
    result.error?.issues.some((issue) => issue.message === 'Duplicate id "service_observations"'),
  );
});

test('each classification explains what it means', () => {
  const field = observationFields.find((item) => item.id === 'classification');
  assert.ok(field?.type === 'choice');
  for (const option of field.options) {
    assert.ok(option.description && option.description.length > 40, option.value);
  }
  assert.match(
    field.options.find((option) => option.value === 'impairment')?.description ?? '',
    /no funcionaría en un incendio/,
  );
});

test('a choice option can carry a description', () => {
  const field = {
    id: 'kind',
    type: 'choice',
    label: 'Tipo',
    options: [
      { value: 'a', label: 'A', description: 'Qué significa A.' },
      { value: 'b', label: 'B' },
    ],
  };
  assert.deepEqual(fieldSchema.parse(field), field);
});
