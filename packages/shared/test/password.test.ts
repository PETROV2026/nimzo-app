import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generatePassword, passwordProblem } from '../src/password.ts';

test('a password needs 8 to 72 characters with upper case, lower case and digits', () => {
  assert.equal(passwordProblem('Segura12'), null);
  assert.equal(passwordProblem('Corta1'), 'La contraseña debe tener al menos 8 caracteres');
  assert.equal(
    passwordProblem(`Aa1${'x'.repeat(70)}`),
    'La contraseña no puede tener más de 72 caracteres',
  );
  for (const weak of ['segura123', 'SEGURA123', 'SeguraSegura']) {
    assert.equal(passwordProblem(weak), 'Usa mayúsculas, minúsculas y números', weak);
  }
});

test('generated passwords always meet the rule', () => {
  for (let i = 0; i < 2000; i += 1) {
    const password = generatePassword();
    assert.equal(password.length, 12);
    assert.equal(passwordProblem(password), null, password);
  }
});
