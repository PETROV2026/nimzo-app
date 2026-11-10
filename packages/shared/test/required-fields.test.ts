import assert from 'node:assert/strict';
import { test } from 'node:test';

import { requiredEmail, requiredText } from '../src/form-fields.ts';
import { requiredPhone } from '../src/phone.ts';

function messageOf(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? undefined : result.error?.issues[0]?.message;
}

test('required text trims and rejects empty values', () => {
  const schema = requiredText('Ingresa la persona de contacto');
  assert.equal(schema.parse('  Persona de prueba '), 'Persona de prueba');
  assert.equal(messageOf(schema.safeParse('   ')), 'Ingresa la persona de contacto');
});

test('required email rejects empty and invalid addresses', () => {
  const schema = requiredEmail('Ingresa el correo de contacto');
  assert.equal(schema.parse(' contacto@ejemplo.com '), 'contacto@ejemplo.com');
  assert.equal(messageOf(schema.safeParse('')), 'Ingresa el correo de contacto');
  assert.equal(messageOf(schema.safeParse('sin-arroba')), 'Ingresa un correo válido');
});

test('required phone rejects empty and invalid numbers', () => {
  const schema = requiredPhone('Ingresa el teléfono de contacto');
  assert.equal(schema.parse(' 81 0000 1234 '), '81 0000 1234');
  assert.equal(messageOf(schema.safeParse('')), 'Ingresa el teléfono de contacto');
  assert.equal(
    messageOf(schema.safeParse('12345')),
    'Escribe un teléfono válido, por ejemplo 81 1234 5678',
  );
});

test('saved rows without a value fail with the required message, not a type error', () => {
  assert.equal(
    messageOf(requiredText('Ingresa la persona de contacto').safeParse(null)),
    'Ingresa la persona de contacto',
  );
  assert.equal(
    messageOf(requiredEmail('Ingresa el correo de contacto').safeParse(null)),
    'Ingresa el correo de contacto',
  );
  assert.equal(
    messageOf(requiredPhone('Ingresa el teléfono de contacto').safeParse(null)),
    'Ingresa el teléfono de contacto',
  );
});
