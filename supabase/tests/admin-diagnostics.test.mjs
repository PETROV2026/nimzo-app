import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-0000000000a3';
const TECH = '00000000-0000-0000-0000-0000000000b3';
const INACTIVE_ADMIN = '00000000-0000-0000-0000-0000000000c3';

let db;

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Diagnostico', role: 'admin' });
  await createUser(db, TECH, { fullName: 'Tecnico Diagnostico' });
  await createUser(db, INACTIVE_ADMIN, { fullName: 'Admin Inactivo', role: 'admin' });
  await db.query('update public.profiles set is_active = false where id = $1', [INACTIVE_ADMIN]);
  await db.query(`insert into public.clients (name) values ('Cliente Uno'), ('Cliente Dos')`);
});

describe('admin_diagnostics()', () => {
  test('an admin gets every public table with rows, rls and policies', async () => {
    const result = await runAs(db, 'authenticated', ADMIN, 'select public.admin_diagnostics() as d');
    assert.ok(result.ok, result.error);
    const diagnostics = result.rows[0].d;
    const names = diagnostics.tables.map((table) => table.name);
    assert.deepEqual(names, ['branches', 'clients', 'profiles', 'systems']);
    const clients = diagnostics.tables.find((table) => table.name === 'clients');
    assert.equal(clients.rows, 2);
    assert.equal(clients.rls_enabled, true);
    assert.ok(clients.policies >= 4);
    assert.ok(diagnostics.tables.every((table) => table.rls_enabled));
  });

  test('includes users per role, the postgres version and an empty migration list without supabase', async () => {
    const result = await runAs(db, 'authenticated', ADMIN, 'select public.admin_diagnostics() as d');
    const diagnostics = result.rows[0].d;
    assert.deepEqual(diagnostics.users, [
      { role: 'technician', active: 1, inactive: 0 },
      { role: 'admin', active: 1, inactive: 1 },
    ]);
    assert.match(diagnostics.postgres_version, /^\d+/);
    assert.deepEqual(diagnostics.migrations, []);
  });

  test('a technician gets a permission error', async () => {
    const result = await runAs(db, 'authenticated', TECH, 'select public.admin_diagnostics()');
    assert.equal(result.ok, false);
    assert.match(result.error, /only administrators/);
  });

  test('an inactive admin gets a permission error', async () => {
    const result = await runAs(db, 'authenticated', INACTIVE_ADMIN, 'select public.admin_diagnostics()');
    assert.equal(result.ok, false);
  });

  test('anon cannot execute it', async () => {
    const result = await runAs(db, 'anon', null, 'select public.admin_diagnostics()');
    assert.equal(result.ok, false);
    assert.match(result.error, /permission denied/);
  });
});
