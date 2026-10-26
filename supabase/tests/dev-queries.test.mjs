import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { before, describe, test } from 'node:test';

import { devQueryGroups } from '../../apps/admin/src/pages/tools/queries.ts';
import { createTestDb, createUser } from './harness.mjs';

const seedSql = readFileSync(join(import.meta.dirname, '..', 'seeds', 'demo-catalogs.sql'), 'utf8');

let db;

before(async () => {
  db = await createTestDb();
  await createUser(db, '00000000-0000-0000-0000-0000000000a4', { fullName: 'Admin Consultas', role: 'admin' });
  await createUser(db, '00000000-0000-0000-0000-0000000000b4', { fullName: 'Tecnico Consultas' });
  await db.query(`update auth.users set email = 'admin.consultas@ejemplo.com', last_sign_in_at = now()
    where id = '00000000-0000-0000-0000-0000000000a4'`);
  await createUser(db, '00000000-0000-0000-0000-0000000000c4', { fullName: 'Técnico Demo' });
  await db.query(`update auth.users set email = 'tecnico.demo@ejemplo.com' where id = '00000000-0000-0000-0000-0000000000c4'`);
  await db.exec(seedSql);
});

describe('developer queries library', () => {
  const queries = devQueryGroups.flatMap((group) => group.queries);

  test('every query has a unique id', () => {
    const ids = queries.map((query) => query.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  for (const query of queries.filter((item) => !item.supabaseOnly)) {
    test(`${query.id} runs read-only on the current schema`, async () => {
      await db.exec('begin read only');
      try {
        const result = await db.query(query.sql);
        assert.ok(Array.isArray(result.rows));
      } finally {
        await db.exec('rollback');
      }
    });
  }

  test('queries return real data on the demo catalogs', async () => {
    const run = async (id) => (await db.query(queries.find((query) => query.id === id).sql)).rows;
    assert.equal((await run('top-clients-by-systems')).length, 10);
    assert.ok((await run('systems-by-type')).length >= 1);
    assert.equal((await run('demo-data'))[0].demo_clients, 25);
    assert.equal((await run('recent-sign-ins')).length, 1);
    assert.equal((await run('users-never-signed-in')).length, 2);
    assert.ok((await run('rls-policies')).length >= 12);
  });
});
