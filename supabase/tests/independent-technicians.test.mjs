import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { before, describe, test } from 'node:test';

import {
  applyMigrationsFrom,
  createTechnicianCatalog,
  createTestDb,
  createUser,
  runAs,
} from './harness.mjs';

const MIGRATION = readdirSync(join(import.meta.dirname, '..', 'migrations')).find((file) =>
  file.endsWith('_independent_technicians.sql'),
);

const ADMIN = '00000000-0000-0000-0000-0000000000a9';
const TECH_A = '00000000-0000-0000-0000-0000000000b9';
const TECH_B = '00000000-0000-0000-0000-0000000000c9';
const INACTIVE = '00000000-0000-0000-0000-0000000000d9';

const CATALOG_TABLES = ['clients', 'branches', 'systems', 'service_packages', 'service_package_forms'];

let db;
let catalogA;
let catalogB;
const asAdmin = (sql, params) => runAs(db, 'authenticated', ADMIN, sql, params);
const asTechA = (sql, params) => runAs(db, 'authenticated', TECH_A, sql, params);
const formId = async (code) =>
  (await db.query('select id from public.service_forms where code = $1', [code])).rows[0].id;

async function addPackage(catalog, technicianId) {
  const packageId = (
    await db.query(
      `insert into public.service_packages (branch_id, frequency, technician_id) values ($1, 'monthly', $2) returning id`,
      [catalog.branch, technicianId],
    )
  ).rows[0].id;
  const packageFormId = (
    await db.query(
      `insert into public.service_package_forms (package_id, service_form_id, system_id, technician_id)
       values ($1, $2, $3, $4) returning id`,
      [packageId, await formId('F-SER-104'), catalog.system, technicianId],
    )
  ).rows[0].id;
  return { ...catalog, package: packageId, packageForm: packageFormId };
}

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Dueños', role: 'admin' });
  await createUser(db, TECH_A, { fullName: 'Tecnico A' });
  await createUser(db, TECH_B, { fullName: 'Tecnico B' });
  await createUser(db, INACTIVE, { fullName: 'Tecnico Baja' });
  await db.query('update public.profiles set is_active = false where id = $1', [INACTIVE]);
  catalogA = await addPackage(await createTechnicianCatalog(db, TECH_A, { prefix: 'A' }), TECH_A);
  catalogB = await addPackage(await createTechnicianCatalog(db, TECH_B, { prefix: 'B' }), TECH_B);
});

describe('technician-owned catalogs', () => {
  test('technicians see only their own catalog rows', async () => {
    for (const table of CATALOG_TABLES) {
      const own = await asTechA(`select technician_id from public.${table}`);
      assert.ok(own.ok, own.error);
      assert.ok(own.rows.length > 0, table);
      assert.ok(own.rows.every((row) => row.technician_id === TECH_A), table);

      const all = await asAdmin(`select distinct technician_id from public.${table}`);
      assert.deepEqual(all.rows.map((row) => row.technician_id).sort(), [TECH_A, TECH_B], table);
    }
  });

  test('a technician creates a full catalog with ids generated on the device', async () => {
    const ids = { client: randomUUID(), branch: randomUUID(), system: randomUUID(), package: randomUUID() };
    const steps = [
      [`insert into public.clients (id, name) values ($1, 'Cliente offline')`, [ids.client]],
      [`insert into public.branches (id, client_id, name) values ($1, $2, 'Sucursal offline')`, [ids.branch, ids.client]],
      [
        `insert into public.systems (id, branch_id, system_type, name) values ($1, $2, 'hydrant', 'Hidrantes')`,
        [ids.system, ids.branch],
      ],
      [
        `insert into public.service_packages (id, branch_id, frequency) values ($1, $2, 'annual')`,
        [ids.package, ids.branch],
      ],
      [
        `insert into public.service_package_forms (package_id, service_form_id, system_id) values ($1, $2, $3)`,
        [ids.package, await formId('F-SER-039'), ids.system],
      ],
    ];
    for (const [sql, params] of steps) {
      const result = await asTechA(sql, params);
      assert.ok(result.ok, result.error);
    }
    for (const [table, column, id] of [
      ['clients', 'id', ids.client],
      ['branches', 'id', ids.branch],
      ['systems', 'id', ids.system],
      ['service_packages', 'id', ids.package],
      ['service_package_forms', 'package_id', ids.package],
    ]) {
      const { rows } = await db.query(`select technician_id from public.${table} where ${column} = $1`, [id]);
      assert.equal(rows[0].technician_id, TECH_A, table);
    }
  });

  test('technicians cannot create rows for someone else', async () => {
    const result = await asTechA(
      `insert into public.clients (name, technician_id) values ('Ajeno', $1)`,
      [TECH_B],
    );
    assert.equal(result.ok, false);
  });

  test("children must share the parent's technician", async () => {
    const branchUnderOther = await asTechA(
      `insert into public.branches (client_id, name) values ($1, 'Intrusa')`,
      [catalogB.client],
    );
    assert.equal(branchUnderOther.ok, false);

    const foreignSystem = await asAdmin(
      `insert into public.service_package_forms (package_id, service_form_id, system_id) values ($1, $2, $3)`,
      [catalogA.package, await formId('F-SER-105'), catalogB.system],
    );
    assert.equal(foreignSystem.ok, false);

    const mismatchedOwner = await asAdmin(
      `insert into public.branches (client_id, name, technician_id) values ($1, 'Otra', $2)`,
      [catalogA.client, TECH_B],
    );
    assert.equal(mismatchedOwner.ok, false);
  });

  test('owners must be active technicians', async () => {
    for (const owner of [ADMIN, INACTIVE]) {
      const result = await asAdmin(
        `insert into public.clients (name, technician_id) values ('Sin dueño válido', $1)`,
        [owner],
      );
      assert.equal(result.ok, false, owner);
    }
    const missing = await asAdmin(`insert into public.clients (name) values ('Sin dueño')`);
    assert.equal(missing.ok, false);

    const valid = await asAdmin(
      `insert into public.clients (name, technician_id) values ('Para el técnico A', $1) returning technician_id`,
      [TECH_A],
    );
    assert.ok(valid.ok, valid.error);
    assert.equal(valid.rows[0].technician_id, TECH_A);
  });

  test('the owner never changes', async () => {
    const reassign = await asAdmin('update public.clients set technician_id = $1 where id = $2', [
      TECH_B,
      catalogA.client,
    ]);
    assert.equal(reassign.ok, false);

    const rename = await asTechA(`update public.clients set name = 'Renombrado A' where id = $1`, [
      catalogA.client,
    ]);
    assert.ok(rename.ok, rename.error);
    assert.equal(rename.affected, 1);

    const foreign = await asTechA(`update public.clients set name = 'Hackeado' where id = $1`, [catalogB.client]);
    assert.equal(foreign.affected ?? 0, 0);
  });

  test('technicians cannot delete catalogs but can remove forms from their packages', async () => {
    const deleteClient = await asTechA('delete from public.clients where id = $1', [catalogA.client]);
    assert.ok(!deleteClient.ok || (deleteClient.affected ?? 0) === 0);
    const { rows } = await db.query('select 1 from public.clients where id = $1', [catalogA.client]);
    assert.equal(rows.length, 1);

    const removeForm = await asTechA('delete from public.service_package_forms where id = $1', [
      catalogA.packageForm,
    ]);
    assert.ok(removeForm.ok, removeForm.error);
    assert.equal(removeForm.affected, 1);

    const removeForeign = await asTechA('delete from public.service_package_forms where id = $1', [
      catalogB.packageForm,
    ]);
    assert.equal(removeForeign.affected ?? 0, 0);
  });

  test('profiles are private', async () => {
    const own = await asTechA('select id from public.profiles');
    assert.deepEqual(own.rows.map((row) => row.id), [TECH_A]);
    const all = await asAdmin('select id from public.profiles');
    assert.equal(all.rows.length, 4);
  });

  test('branches have a contact email', async () => {
    const valid = await asTechA(
      `insert into public.branches (client_id, name, contact_email) values ($1, 'Con correo', 'sucursal@ejemplo.com')`,
      [catalogA.client],
    );
    assert.ok(valid.ok, valid.error);
    const invalid = await asTechA(
      `insert into public.branches (client_id, name, contact_email) values ($1, 'Mal correo', 'no-es-correo')`,
      [catalogA.client],
    );
    assert.equal(invalid.ok, false);
  });

  test('anon cannot read catalogs', async () => {
    const result = await runAs(db, 'anon', null, 'select id from public.clients');
    assert.equal(result.ok, false);
  });
});

describe('migrating existing catalogs', () => {
  test('the migration refuses to run over existing catalogs', async () => {
    assert.ok(MIGRATION, 'migration file exists');
    const old = await createTestDb({ before: MIGRATION });
    await old.query(`insert into public.clients (name) values ('Cliente (demo)')`);
    await assert.rejects(applyMigrationsFrom(old, MIGRATION), /remove-demo-catalogs\.sql/);
  });
});
