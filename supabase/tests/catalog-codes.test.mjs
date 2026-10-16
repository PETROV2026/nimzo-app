import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-0000000000a2';

let db;

const asAdmin = (sql, params) => runAs(db, 'authenticated', ADMIN, sql, params);

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Catalogos', role: 'admin' });
  assert.ok((await asAdmin(`insert into public.clients (name) values ('Cliente Demo')`)).ok);
});

describe('branch state', () => {
  test('accepts an iso 3166-2 mexican state code', async () => {
    const result = await asAdmin(
      `insert into public.branches (client_id, name, state) values (1, 'Monterrey', 'NLE')`,
    );
    assert.ok(result.ok, result.error);
  });

  test('accepts a branch without state', async () => {
    const result = await asAdmin(`insert into public.branches (client_id, name) values (1, 'Sin estado')`);
    assert.ok(result.ok, result.error);
  });

  for (const state of ['Nuevo León', 'nle', 'MX-NLE', 'XXX']) {
    test(`rejects '${state}'`, async () => {
      const result = await asAdmin(
        `insert into public.branches (client_id, name, state) values (1, 'Mal estado', $1)`,
        [state],
      );
      assert.equal(result.ok, false);
    });
  }
});

describe('system type', () => {
  test('accepts every english code', async () => {
    const { rows } = await db.query(
      `select unnest(enum_range(null::public.system_type))::text as value`,
    );
    assert.deepEqual(
      rows.map((row) => row.value),
      [
        'sprinkler',
        'hydrant',
        'fire_pump',
        'fire_extinguisher',
        'fire_alarm',
        'kitchen_suppression',
        'clean_agent',
        'other',
      ],
    );
    const result = await asAdmin(
      `insert into public.systems (branch_id, system_type, name) values (1, 'fire_pump', 'Cuarto de bombas')`,
    );
    assert.ok(result.ok, result.error);
  });

  for (const type of ['rociadores', 'Sprinkler', '']) {
    test(`rejects '${type}'`, async () => {
      const result = await asAdmin(
        `insert into public.systems (branch_id, system_type, name) values (1, $1, 'Sistema')`,
        [type],
      );
      assert.equal(result.ok, false);
    });
  }
});
