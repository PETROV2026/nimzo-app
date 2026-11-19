import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { createTestDb } from './harness.mjs';

let db;

before(async () => {
  db = await createTestDb();
});

describe('foreign key indexes', () => {
  test('every foreign key in public has an index that starts with its columns', async () => {
    const { rows } = await db.query(`
      select c.conrelid::regclass::text as table_name, c.conname as constraint_name
      from pg_constraint c
      where c.contype = 'f'
        and c.connamespace = 'public'::regnamespace
        and not exists (
          select 1
          from pg_index i
          where i.indrelid = c.conrelid
            and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] = c.conkey
        )
      order by 1, 2
    `);
    assert.deepEqual(rows, []);
  });
});
