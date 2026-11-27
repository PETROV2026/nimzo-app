import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fieldSchema, observationFields } from '../src/form-definition.ts';

test('every observation has a system, a status, the observation and up to four photos', () => {
  assert.deepEqual(
    observationFields.map((field) => [field.id, field.type]),
    [
      ['system', 'text'],
      ['status', 'choice'],
      ['observation', 'text'],
      ['photos', 'photos'],
    ],
  );
  const photos = observationFields.find((field) => field.type === 'photos');
  assert.equal(photos?.type === 'photos' && photos.count, 4);
  assert.equal(photos?.required, undefined);
});

test('the observation fields are valid form fields', () => {
  for (const field of observationFields) assert.deepEqual(fieldSchema.parse(field), field);
});
