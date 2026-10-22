import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-0000000000a8';
const TECH = '00000000-0000-0000-0000-0000000000b8';

let db;
let ids;
const asAdmin = (sql, params) => runAs(db, 'authenticated', ADMIN, sql, params);
const asTech = (sql, params) => runAs(db, 'authenticated', TECH, sql, params);
const formId = async (code) =>
  (await db.query('select id from public.service_forms where code = $1', [code])).rows[0].id;

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Paquetes', role: 'admin' });
  await createUser(db, TECH, { fullName: 'Tecnico Paquetes' });
  const client = (await db.query(`insert into public.clients (name) values ('Cliente (demo)') returning id`)).rows[0].id;
  const [branchA, branchB] = (
    await db.query(`insert into public.branches (client_id, name) values ($1, 'A'), ($1, 'B') returning id`, [client])
  ).rows.map((row) => row.id);
  const [systemA, systemB] = (
    await db.query(
      `insert into public.systems (branch_id, system_type, name) values ($1, 'sprinkler', 'Rociadores A'), ($2, 'sprinkler', 'Rociadores B') returning id`,
      [branchA, branchB],
    )
  ).rows.map((row) => row.id);
  ids = { branchA, branchB, systemA, systemB };
});

describe('service packages', () => {
  test('an admin creates one package per branch and frequency', async () => {
    const created = await asAdmin(
      `insert into public.service_packages (branch_id, frequency) values ($1, 'weekly') returning id`,
      [ids.branchA],
    );
    assert.ok(created.ok, created.error);
    ids.package = created.rows[0].id;
    const duplicate = await asAdmin(
      `insert into public.service_packages (branch_id, frequency) values ($1, 'weekly')`,
      [ids.branchA],
    );
    assert.equal(duplicate.ok, false);
  });

  test('frequencies are english codes', async () => {
    const { rows } = await db.query(`select unnest(enum_range(null::public.service_frequency))::text as value`);
    assert.deepEqual(rows.map((row) => row.value), ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual']);
  });

  test('an admin adds forms with and without a system', async () => {
    const withSystem = await asAdmin(
      'insert into public.service_package_forms (package_id, service_form_id, system_id) values ($1, $2, $3)',
      [ids.package, await formId('F-SER-104'), ids.systemA],
    );
    const withoutSystem = await asAdmin(
      'insert into public.service_package_forms (package_id, service_form_id) values ($1, $2)',
      [ids.package, await formId('F-SER-045')],
    );
    assert.ok(withSystem.ok, withSystem.error);
    assert.ok(withoutSystem.ok, withoutSystem.error);
  });

  test('the same form and system cannot be added twice', async () => {
    const again = await asAdmin(
      'insert into public.service_package_forms (package_id, service_form_id, system_id) values ($1, $2, $3)',
      [ids.package, await formId('F-SER-104'), ids.systemA],
    );
    const againWithoutSystem = await asAdmin(
      'insert into public.service_package_forms (package_id, service_form_id) values ($1, $2)',
      [ids.package, await formId('F-SER-045')],
    );
    assert.equal(again.ok, false);
    assert.equal(againWithoutSystem.ok, false);
  });

  test('the system must belong to the branch of the package', async () => {
    const result = await asAdmin(
      'insert into public.service_package_forms (package_id, service_form_id, system_id) values ($1, $2, $3)',
      [ids.package, await formId('F-SER-105'), ids.systemB],
    );
    assert.equal(result.ok, false);
    assert.match(result.error, /branch of the package/);
  });

  test('an admin removes a form from a package', async () => {
    const result = await asAdmin(
      'delete from public.service_package_forms where package_id = $1 and system_id is null',
      [ids.package],
    );
    assert.equal(result.affected, 1);
  });

  test('packages are deactivated, never deleted', async () => {
    assert.equal((await asAdmin('update public.service_packages set is_active = false where id = $1', [ids.package])).affected, 1);
    assert.equal((await asAdmin('delete from public.service_packages where id = $1', [ids.package])).affected ?? 0, 0);
  });

  test('technicians read packages but cannot change them', async () => {
    assert.equal((await asTech('select id from public.service_packages')).rows.length, 1);
    assert.equal((await asTech('select id from public.service_package_forms')).rows.length, 1);
    assert.equal(
      (await asTech(`insert into public.service_packages (branch_id, frequency) values ($1, 'monthly')`, [ids.branchA])).ok,
      false,
    );
    assert.equal((await asTech('delete from public.service_package_forms')).affected ?? 0, 0);
  });

  test('anon cannot read packages', async () => {
    assert.equal((await runAs(db, 'anon', null, 'select id from public.service_packages')).ok, false);
    assert.equal((await runAs(db, 'anon', null, 'select id from public.service_package_forms')).ok, false);
  });
});
