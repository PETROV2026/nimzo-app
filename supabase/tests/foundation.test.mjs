import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-00000000000a';
const TECH = '00000000-0000-0000-0000-00000000000b';
const INACTIVE_ADMIN = '00000000-0000-0000-0000-00000000000c';

let db;

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Uno', role: 'admin' });
  await createUser(db, TECH, { fullName: 'Tecnico Uno' });
  await createUser(db, INACTIVE_ADMIN, { fullName: 'Admin Inactivo', role: 'admin' });
  await db.query('update public.profiles set is_active = false where id = $1', [INACTIVE_ADMIN]);

  const asAdmin = (sql) => runAs(db, 'authenticated', ADMIN, sql);
  assert.ok((await asAdmin(`insert into public.clients (name) values ('Cliente Demo')`)).ok);
  assert.ok((await asAdmin(`insert into public.branches (client_id, name) values (1, 'Norte')`)).ok);
  assert.ok(
    (await asAdmin(`insert into public.systems (branch_id, system_type, name) values (1, 'sprinkler', 'Red')`)).ok,
  );
});

describe('schema', () => {
  test('rls is enabled on every public table', async () => {
    const { rows } = await db.query(
      `select relname from pg_class
       join pg_namespace on pg_namespace.oid = pg_class.relnamespace
       where nspname = 'public' and relkind = 'r' and not relrowsecurity`,
    );
    assert.deepEqual(rows, []);
  });

  test('updated_at changes on update', async () => {
    const read = async () =>
      (await db.query('select updated_at from public.clients where id = 1')).rows[0].updated_at;
    const before = await read();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await db.query(`update public.clients set notes = 'x' where id = 1`);
    assert.ok((await read()) > before);
  });
});

describe('profiles created by the auth trigger', () => {
  test('role comes from app metadata', async () => {
    const { rows } = await db.query('select role from public.profiles where id = $1', [ADMIN]);
    assert.equal(rows[0].role, 'admin');
  });

  test('user metadata cannot grant a role', async () => {
    const userId = '00000000-0000-0000-0000-00000000000d';
    await db.query(
      `insert into auth.users (id, raw_user_meta_data) values ($1, '{"role":"admin"}')`,
      [userId],
    );
    const { rows } = await db.query('select role from public.profiles where id = $1', [userId]);
    assert.equal(rows[0].role, 'technician');
  });
});

describe('anon', () => {
  for (const table of ['profiles', 'clients', 'branches', 'systems']) {
    test(`cannot read ${table}`, async () => {
      const result = await runAs(db, 'anon', null, `select * from public.${table}`);
      assert.equal(result.ok, false);
    });
  }
});

describe('admin', () => {
  test('can manage catalogs', async () => {
    const result = await runAs(db, 'authenticated', ADMIN, `update public.systems set notes = 'ok' where id = 1`);
    assert.equal(result.affected, 1);
  });

  test("can change another user's role", async () => {
    const promote = await runAs(
      db,
      'authenticated',
      ADMIN,
      `update public.profiles set role = 'admin' where id = $1`,
      [TECH],
    );
    assert.equal(promote.affected, 1);
    await db.query(`update public.profiles set role = 'technician' where id = $1`, [TECH]);
  });

  test('loses access when deactivated', async () => {
    const result = await runAs(
      db,
      'authenticated',
      INACTIVE_ADMIN,
      `insert into public.clients (name) values ('No permitido')`,
    );
    assert.equal(result.ok, false);
  });
});

describe('technician', () => {
  const asTech = (sql, params) => runAs(db, 'authenticated', TECH, sql, params);

  for (const table of ['profiles', 'clients', 'branches', 'systems']) {
    test(`can read ${table}`, async () => {
      const result = await asTech(`select * from public.${table}`);
      assert.ok(result.ok && result.rows.length > 0);
    });
  }

  test('cannot create catalog rows', async () => {
    assert.equal((await asTech(`insert into public.clients (name) values ('X')`)).ok, false);
    assert.equal((await asTech(`insert into public.branches (client_id, name) values (1, 'X')`)).ok, false);
  });

  test('cannot update or delete catalog rows', async () => {
    assert.equal((await asTech(`update public.clients set name = 'X' where id = 1`)).affected, 0);
    assert.equal((await asTech('delete from public.systems where id = 1')).affected, 0);
  });

  test('can update own name', async () => {
    const result = await asTech(`update public.profiles set full_name = 'Nuevo' where id = $1`, [TECH]);
    assert.equal(result.affected, 1);
  });

  test('cannot change own role or active flag', async () => {
    const role = await asTech(`update public.profiles set role = 'admin' where id = $1`, [TECH]);
    const active = await asTech('update public.profiles set is_active = false where id = $1', [TECH]);
    assert.equal(role.ok, false);
    assert.equal(active.ok, false);
  });

  test("cannot edit someone else's profile", async () => {
    const result = await asTech(`update public.profiles set full_name = 'X' where id = $1`, [ADMIN]);
    assert.equal(result.affected, 0);
  });
});
