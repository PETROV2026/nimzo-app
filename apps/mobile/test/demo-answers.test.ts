import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { formDefinitionSchema } from '../../../packages/shared/src/form-definition.ts';

import { demoAnswers } from '../src/dev/demo-answers.ts';
import { missingRequired, visibleValues } from '../src/forms/form-values.ts';

const folder = path.resolve(import.meta.dirname, '../../../packages/shared/formatos');

for (const file of readdirSync(folder).filter((name) => name.endsWith('.json'))) {
  test(`demo answers complete every required field of ${file}`, () => {
    const definition = formDefinitionSchema.parse(
      JSON.parse(readFileSync(path.join(folder, file), 'utf8')),
    );
    const answers = visibleValues(definition, demoAnswers(definition));
    assert.deepEqual(missingRequired(definition, answers), []);
  });
}

test('demo answers are clearly fake', () => {
  const definition = formDefinitionSchema.parse(
    JSON.parse(readFileSync(path.join(folder, 'work_order.json'), 'utf8')),
  );
  assert.match(String(demoAnswers(definition).comments), /prueba/i);
});
