import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fieldSchema, observationFields } from '../src/form-definition.ts';

test('every observation has its system, component, findings and up to four photos', () => {
  assert.deepEqual(
    observationFields.map((field) => [field.id, field.type, field.label]),
    [
      ['system', 'text', 'Sistema'],
      ['component', 'text', 'Equipo / Componente'],
      ['status', 'choice', 'Estado'],
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
