import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser } from './harness.mjs';

const seedsDir = join(import.meta.dirname, '..', 'seeds');
const insertSql = readFileSync(join(seedsDir, 'demo-catalogs.sql'), 'utf8');
const removeSql = readFileSync(join(seedsDir, 'remove-demo-catalogs.sql'), 'utf8');
const reportsSql = readFileSync(join(seedsDir, 'demo-reports.sql'), 'utf8');

const DEMO_TECH = '00000000-0000-0000-0000-0000000000e5';
const REAL_TECH = '00000000-0000-0000-0000-0000000000f5';
const DEMO_TECH_2 = '00000000-0000-0000-0000-0000000000e6';

let db;

async function runSeed(sql) {
  return (await db.exec(sql)).at(-1).rows[0];
}

async function seedCatalogs() {
  const results = await db.exec(insertSql);
  return Object.fromEntries(
    results
      .filter((result) => result.rows[0]?.technician)
      .map((result) => [result.rows[0].technician, Number(result.rows[0].clients)]),
  );
}

async function createDemoTechnician(id, email, fullName) {
  await createUser(db, id, { fullName });
  await db.query('update auth.users set email = $1 where id = $2', [email, id]);
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
    await createDemoTechnician(DEMO_TECH, 'tecnico.demo@ejemplo.com', 'Técnico Demo');
    const loaded = await seedCatalogs();
    assert.deepEqual(loaded, {
      'tecnico.demo@ejemplo.com': 25,
      'tecnico.demo2@ejemplo.com': 0,
      'tecnico.demo3@ejemplo.com': 0,
    });
    const totals = await counts();
    assert.ok(totals.branches > 25);
    assert.ok(totals.systems > totals.branches);
    const { rows } = await db.query(
      `select distinct technician_id from public.clients where notes = 'Datos de ejemplo'
       union select distinct b.technician_id from public.branches b join public.clients c on c.id = b.client_id
         where c.notes = 'Datos de ejemplo'
       union select distinct s.technician_id from public.systems s join public.branches b on b.id = s.branch_id
         join public.clients c on c.id = b.client_id where c.notes = 'Datos de ejemplo'`,
    );
    assert.deepEqual(rows.map((row) => row.technician_id), [DEMO_TECH]);
  });

  test('optional demo technicians get their own clients once their accounts exist', async () => {
    await createDemoTechnician(DEMO_TECH_2, 'tecnico.demo2@ejemplo.com', 'Técnico Demo 2');
    const loaded = await seedCatalogs();
    assert.equal(loaded['tecnico.demo@ejemplo.com'], 0);
    assert.equal(loaded['tecnico.demo2@ejemplo.com'], 8);
    const shared = await db.query(
      `select count(*)::int as count from public.clients a join public.clients b on a.name = b.name
       where a.technician_id = $1 and b.technician_id = $2`,
      [DEMO_TECH, DEMO_TECH_2],
    );
    assert.ok(shared.rows[0].count > 0);
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
    const loaded = await seedCatalogs();
    assert.ok(Object.values(loaded).every((clients) => clients === 0));
    assert.deepEqual(await counts(), before);
  });

  test('demo reports cover every service form for the existing demo technicians', async () => {
    const result = await runSeed(reportsSql);
    assert.equal(Number(result.forms), 30);
    assert.equal(Number(result.reports), 68);
    const { rows } = await db.query(
      `select count(*)::int as total,
              count(*) filter (where snapshot @> '{"demo": true}')::int as demo,
              count(*) filter (where answers = '{}'::jsonb)::int as empty,
              count(distinct technician_id)::int as technicians,
              count(distinct sent_at::date)::int as days
       from public.reports`,
    );
    assert.deepEqual({ ...rows[0], days: rows[0].days > 10 }, {
      total: 68,
      demo: 68,
      empty: 0,
      technicians: 2,
      days: true,
    });
  });

  test('demo reports of forms for a system type are tied to an active system of that type', async () => {
    const { rows } = await db.query(
      `select count(*) filter (where system_id is not null)::int as with_system,
              count(*) filter (where system_id is null and form_code not in ('F-SER-003', 'F-SER-005', 'F-SER-008', 'F-SER-045'))::int as missing,
              count(*) filter (where s.is_active is false)::int as inactive
       from public.reports r left join public.systems s on s.id = r.system_id`,
    );
    assert.ok(rows[0].with_system >= 50);
    assert.equal(rows[0].missing, 0);
    assert.equal(rows[0].inactive, 0);
  });

  test('running the reports seed again inserts nothing', async () => {
    const result = await runSeed(reportsSql);
    assert.equal(Number(result.reports), 0);
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
    const { rows } = await db.query('select count(*)::int as count from public.reports');
    assert.equal(rows[0].count, 0);
  });
});
