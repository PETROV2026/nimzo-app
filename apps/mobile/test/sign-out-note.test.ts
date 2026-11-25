import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeReports, signOutNote } from '../src/auth/sign-out-note.ts';

const access = 'Para volver a acceder necesitarás tu correo, tu contraseña y conexión a internet.';
const none = { draft: 0, pending: 0 };

test('with everything synced the note only says what is needed to sign in again', () => {
  assert.equal(signOutNote({ pending: '', rejected: '', reports: none }), access);
});

test('pending changes are named and sync after signing in again', () => {
  assert.equal(
    signOutNote({ pending: '1 cliente', rejected: '', reports: none }),
    `Tienes 1 cliente sin sincronizar en este dispositivo. La sincronización continuará cuando vuelvas a iniciar sesión con esta cuenta. ${access}`,
  );
});

test('rejected changes never promise to sync on their own', () => {
  const note = signOutNote({ pending: '', rejected: '1 sucursal', reports: none });
  assert.equal(
    note,
    `El servidor rechazó cambios en 1 sucursal. Siguen guardados en este dispositivo, pero debes revisar sus datos para sincronizar. ${access}`,
  );
  assert.equal(note.includes('continuará'), false);
});

test('pending and rejected changes are explained separately', () => {
  const note = signOutNote({ pending: '2 clientes', rejected: '1 sistema', reports: none });
  assert.ok(note.includes('Tienes 2 clientes sin sincronizar'));
  assert.ok(note.includes('El servidor rechazó cambios en 1 sistema.'));
  assert.ok(note.endsWith(access));
});

test('reports are counted with their status', () => {
  assert.equal(describeReports({ draft: 2, pending: 1 }), '2 reportes activos y 1 pendiente');
  assert.equal(describeReports({ draft: 1, pending: 0 }), '1 reporte activo');
  assert.equal(describeReports({ draft: 0, pending: 3 }), '3 reportes pendientes');
  assert.equal(describeReports({ draft: 0, pending: 0 }), '');
});

test('local reports stay on the device after signing out', () => {
  assert.equal(
    signOutNote({ pending: '', rejected: '', reports: { draft: 2, pending: 1 } }),
    `Tienes 2 reportes activos y 1 pendiente en este dispositivo. Seguirán aquí cuando vuelvas a iniciar sesión con esta cuenta. ${access}`,
  );
});

test('a single report uses the singular verb', () => {
  assert.equal(
    signOutNote({ pending: '', rejected: '', reports: { draft: 1, pending: 0 } }),
    `Tienes 1 reporte activo en este dispositivo. Seguirá aquí cuando vuelvas a iniciar sesión con esta cuenta. ${access}`,
  );
});

test('reports use a short sentence when other changes are already explained', () => {
  assert.equal(
    signOutNote({ pending: '1 cliente', rejected: '', reports: { draft: 1, pending: 0 } }),
    `Tienes 1 cliente sin sincronizar en este dispositivo. La sincronización continuará cuando vuelvas a iniciar sesión con esta cuenta. También tienes 1 reporte activo, que seguirá aquí. ${access}`,
  );
});
