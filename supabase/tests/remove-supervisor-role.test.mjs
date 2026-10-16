import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { applyMigrationsFrom, createTestDb, createUser, runAs } from './harness.mjs';

const MIGRATION = '20261016180552_remove_supervisor_role.sql';

const ADMIN = '00000000-0000-0000-0000-0000000000a1';
const TECH = '00000000-0000-0000-0000-0000000000b1';
const SUPERVISOR = '00000000-0000-0000-0000-0000000000c1';

let db;

before(async () => {
  db = await createTestDb({ before: MIGRATION });
  await createUser(db, ADMIN, { fullName: 'Admin Previo', role: 'admin' });
  await createUser(db, TECH, { fullName: 'Tecnico Previo', role: 'technician' });
  await createUser(db, SUPERVISOR, { fullName: 'Supervisor Previo', role: 'supervisor' });
  await applyMigrationsFrom(db, MIGRATION);
});

describe('remove supervisor role migration', () => {
  test('existing supervisors become technicians and other roles are kept', async () => {
    const { rows } = await db.query('select id, role from public.profiles order by id');
    assert.deepEqual(
      rows.map((row) => [row.id, row.role]),
      [
        [ADMIN, 'admin'],
        [TECH, 'technician'],
        [SUPERVISOR, 'technician'],
      ],
    );
  });

  test('app metadata of existing supervisors uses technician', async () => {
    const { rows } = await db.query(
      `select id, raw_app_meta_data ->> 'role' as role from auth.users order by id`,
    );
    assert.deepEqual(
      rows.map((row) => [row.id, row.role]),
      [
        [ADMIN, 'admin'],
        [TECH, 'technician'],
        [SUPERVISOR, 'technician'],
      ],
    );
  });

  test('the enum only has technician and admin', async () => {
    const { rows } = await db.query(
      `select unnest(enum_range(null::public.user_role))::text as value`,
    );
    assert.deepEqual(
      rows.map((row) => row.value),
      ['technician', 'admin'],
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

  test('a former supervisor cannot write catalogs', async () => {
    const result = await runAs(
      db,
      'authenticated',
      SUPERVISOR,
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

  test('new accounts with the supervisor role are rejected', async () => {
    await assert.rejects(
      createUser(db, '00000000-0000-0000-0000-0000000000e1', { role: 'supervisor' }),
    );
  });

  test('an admin cannot set the supervisor role', async () => {
    const result = await runAs(
      db,
      'authenticated',
      ADMIN,
      `update public.profiles set role = 'supervisor' where id = $1`,
      [TECH],
    );
    assert.equal(result.ok, false);
  });
});
