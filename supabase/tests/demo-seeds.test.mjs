import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { before, describe, test } from 'node:test';

import { createTestDb } from './harness.mjs';

const seedsDir = join(import.meta.dirname, '..', 'seeds');
const insertSql = readFileSync(join(seedsDir, 'demo-catalogs.sql'), 'utf8');
const removeSql = readFileSync(join(seedsDir, 'remove-demo-catalogs.sql'), 'utf8');

let db;

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
  await db.query(`insert into public.clients (name) values ('Cliente real (prueba)')`);
});

describe('demo catalogs seed', () => {
  test('inserts 25 clients with branches and systems', async () => {
    const { rows } = await db.query(insertSql);
    assert.equal(Number(rows[0].clients), 25);
    assert.ok(Number(rows[0].branches) > 25);
    assert.ok(Number(rows[0].systems) > Number(rows[0].branches));
  });

  test('every demo client is clearly fake', async () => {
    const { rows } = await db.query(
      `select count(*)::int as wrong from public.clients
       where notes = 'Datos de ejemplo'
         and (name not like '%(demo)' or (contact_email is not null and contact_email not like '%@ejemplo.com'))`,
    );
    assert.equal(rows[0].wrong, 0);
  });

  test('running it again inserts nothing', async () => {
    const before = await counts();
    const { rows } = await db.query(insertSql);
    assert.equal(Number(rows[0].clients), 0);
    assert.deepEqual(await counts(), before);
  });

  test('the removal script deletes only the demo data', async () => {
    await db.query(removeSql);
    assert.deepEqual(await counts(), { clients: 1, branches: 0, systems: 0 });
  });
});
