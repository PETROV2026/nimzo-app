import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { applyMigrationsFrom, createTestDb, createUser, runAs } from './harness.mjs';

const MIGRATION = '20261015155554_english_role_values.sql';

const ADMIN = '00000000-0000-0000-0000-0000000000a1';
const TECH = '00000000-0000-0000-0000-0000000000b1';
const SUPERVISOR = '00000000-0000-0000-0000-0000000000c1';

let db;

before(async () => {
  db = await createTestDb({ before: MIGRATION });
  await createUser(db, ADMIN, { fullName: 'Admin Previo', role: 'administrador' });
  await createUser(db, TECH, { fullName: 'Tecnico Previo', role: 'tecnico' });
  await createUser(db, SUPERVISOR, { fullName: 'Supervisor Previo', role: 'supervisor' });
  await applyMigrationsFrom(db, MIGRATION);
});

describe('english role values migration', () => {
  test('existing profiles keep their role with the english value', async () => {
    const { rows } = await db.query('select id, role from public.profiles order by id');
    assert.deepEqual(
      rows.map((row) => [row.id, row.role]),
      [
        [ADMIN, 'admin'],
        [TECH, 'technician'],
        [SUPERVISOR, 'supervisor'],
      ],
    );
  });

  test('app metadata of existing accounts uses the english value', async () => {
    const { rows } = await db.query(
      `select id, raw_app_meta_data ->> 'role' as role from auth.users order by id`,
    );
    assert.deepEqual(
      rows.map((row) => [row.id, row.role]),
      [
        [ADMIN, 'admin'],
        [TECH, 'technician'],
        [SUPERVISOR, 'supervisor'],
      ],
    );
  });

  test('the enum only has english values', async () => {
    const { rows } = await db.query(
      `select unnest(enum_range(null::public.user_role))::text as value`,
    );
    assert.deepEqual(
      rows.map((row) => row.value),
      ['technician', 'supervisor', 'admin'],
    );
  });

  test('an existing admin is still an admin for rls', async () => {
    const result = await runAs(
      db,
      'authenticated',
      ADMIN,
      `insert into public.clients (name) values ('Cliente Migrado')`,
    );
    assert.ok(result.ok, result.error);
  });

  test('an existing technician still cannot write catalogs', async () => {
    const result = await runAs(
      db,
      'authenticated',
      TECH,
      `insert into public.clients (name) values ('No permitido')`,
    );
    assert.equal(result.ok, false);
  });

  test('new accounts default to technician', async () => {
    const userId = '00000000-0000-0000-0000-0000000000d1';
    await createUser(db, userId, { fullName: 'Nuevo' });
    const { rows } = await db.query('select role from public.profiles where id = $1', [userId]);
    assert.equal(rows[0].role, 'technician');
  });

  test('new accounts with a spanish role are rejected', async () => {
    await assert.rejects(
      createUser(db, '00000000-0000-0000-0000-0000000000e1', { role: 'tecnico' }),
    );
  });
});
