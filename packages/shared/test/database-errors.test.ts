import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeDatabaseError } from '../src/database-errors.ts';

test('raw postgres messages are never shown', () => {
  const raw = 'duplicate key value violates unique constraint "clients_tax_id_key"';
  const message = describeDatabaseError({ code: '23505', message: raw });
  assert.notEqual(message, raw);
  assert.equal(message, 'Ya existe un registro con esos datos. Revisa que no esté repetido.');
});

test('constraint, permission and network failures get their own spanish message', () => {
  assert.equal(
    describeDatabaseError({ code: '23503', message: 'violates foreign key constraint' }),
    'No se puede completar porque este registro está relacionado con otros datos.',
  );
  assert.equal(
    describeDatabaseError({ code: '23514', message: 'violates check constraint' }),
    'Algún dato no es válido. Revisa el formulario.',
  );
  assert.equal(
    describeDatabaseError({ code: '42501', message: 'new row violates row-level security policy' }),
    'No tienes permiso para hacer esta acción.',
  );
  assert.equal(
    describeDatabaseError({ code: '', message: 'TypeError: Failed to fetch' }),
    'No se pudo conectar con el servidor. Revisa tu conexión a internet.',
  );
});

test('known business rules from triggers are translated and unknown ones stay generic', () => {
  assert.equal(
    describeDatabaseError({
      code: 'P0001',
      message: 'catalog rows must belong to an active technician',
    }),
    'El técnico elegido está inactivo. Elige un técnico activo.',
  );
  assert.equal(
    describeDatabaseError({ code: 'P0001', message: 'Sent reports cannot be deleted.' }),
    'Los reportes enviados no se pueden modificar ni eliminar.',
  );
  assert.equal(
    describeDatabaseError({ code: 'P0001', message: 'some new internal rule' }),
    'Esta acción no está permitida por las reglas del sistema.',
  );
});

test('anything else falls back to a generic message', () => {
  assert.equal(
    describeDatabaseError({ code: 'XX000', message: 'internal error' }),
    'No se pudo completar la acción. Intenta de nuevo.',
  );
  assert.equal(
    describeDatabaseError(undefined),
    'No se pudo completar la acción. Intenta de nuevo.',
  );
});
