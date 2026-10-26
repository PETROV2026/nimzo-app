import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser } from './harness.mjs';

const seedsDir = join(import.meta.dirname, '..', 'seeds');
const insertSql = readFileSync(join(seedsDir, 'demo-catalogs.sql'), 'utf8');
const removeSql = readFileSync(join(seedsDir, 'remove-demo-catalogs.sql'), 'utf8');

const DEMO_TECH = '00000000-0000-0000-0000-0000000000e5';
const REAL_TECH = '00000000-0000-0000-0000-0000000000f5';

let db;

async function runSeed(sql) {
  return (await db.exec(sql)).at(-1).rows[0];
}

async function counts() {
  const { rows } = await db.query(
    `select (select count(*) from public.clients)::int as clients,
            (select count(*) from public.branches)::int as branches,
            (select count(*) from public.systems)::int as systems`,
  );
  return rows[0];
}

before(async () => {
  db = await createTestDb();
  await createUser(db, REAL_TECH, { fullName: 'Tecnico Real' });
  await db.query(`insert into public.clients (name, technician_id) values ('Cliente real (prueba)', $1)`, [REAL_TECH]);
});

describe('demo catalogs seed', () => {
  test('stops when the demo technician does not exist', async () => {
    await assert.rejects(db.exec(insertSql), /tecnico\.demo@ejemplo\.com/);
  });

  test('inserts 25 clients with branches and systems for the demo technician', async () => {
    await createUser(db, DEMO_TECH, { fullName: 'Técnico Demo' });
    await db.query(`update auth.users set email = 'tecnico.demo@ejemplo.com' where id = $1`, [DEMO_TECH]);
    const result = await runSeed(insertSql);
    assert.equal(Number(result.clients), 25);
    assert.ok(Number(result.branches) > 25);
    assert.ok(Number(result.systems) > Number(result.branches));
    const { rows } = await db.query(
      `select distinct technician_id from public.clients where notes = 'Datos de ejemplo'
       union select distinct b.technician_id from public.branches b join public.clients c on c.id = b.client_id
         where c.notes = 'Datos de ejemplo'
       union select distinct s.technician_id from public.systems s join public.branches b on b.id = s.branch_id
         join public.clients c on c.id = b.client_id where c.notes = 'Datos de ejemplo'`,
    );
    assert.deepEqual(rows.map((row) => row.technician_id), [DEMO_TECH]);
  });

  test('every demo client is clearly fake', async () => {
    const { rows } = await db.query(
      `select count(*)::int as wrong from public.clients
       where notes = 'Datos de ejemplo'
         and (name not like '%(demo)' or (contact_email is not null and contact_email not like '%@ejemplo.com'))`,
    );
    assert.equal(rows[0].wrong, 0);
    const branches = await db.query(
      `select count(*) filter (where contact_email is not null)::int as with_email,
              count(*) filter (where contact_email not like '%@ejemplo.com')::int as wrong
       from public.branches where technician_id = $1`,
      [DEMO_TECH],
    );
    assert.ok(branches.rows[0].with_email > 0);
    assert.equal(branches.rows[0].wrong, 0);
  });

  test('running it again inserts nothing', async () => {
    const before = await counts();
    const result = await runSeed(insertSql);
    assert.equal(Number(result.clients), 0);
    assert.deepEqual(await counts(), before);
  });

  test('the removal script deletes only the demo data, packages included', async () => {
    const branch = (await db.query('select id from public.branches where technician_id = $1 limit 1', [DEMO_TECH]))
      .rows[0].id;
    const pkg = (
      await db.query(`insert into public.service_packages (branch_id, frequency) values ($1, 'monthly') returning id`, [
        branch,
      ])
    ).rows[0].id;
    await db.query(
      `insert into public.service_package_forms (package_id, service_form_id)
       select $1, id from public.service_forms where code = 'F-SER-045'`,
      [pkg],
    );
    await db.query(removeSql);
    assert.deepEqual(await counts(), { clients: 1, branches: 0, systems: 0 });
  });
});
