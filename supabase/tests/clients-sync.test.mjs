import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser, runAs } from './harness.mjs';

const TECH_A = '00000000-0000-0000-0000-0000000000e1';
const TECH_B = '00000000-0000-0000-0000-0000000000e2';

const UPSERT = `
  insert into public.clients (id, technician_id, name, tax_id, is_active, created_at)
  values ($1, $2, $3, null, $4, $5)
  on conflict (id) do update set
    technician_id = excluded.technician_id, name = excluded.name, tax_id = excluded.tax_id,
    is_active = excluded.is_active, created_at = excluded.created_at`;

let db;
const asTechA = (sql, params) => runAs(db, 'authenticated', TECH_A, sql, params);
const asTechB = (sql, params) => runAs(db, 'authenticated', TECH_B, sql, params);

before(async () => {
  db = await createTestDb();
  await createUser(db, TECH_A, { fullName: 'Tecnico Sync A' });
  await createUser(db, TECH_B, { fullName: 'Tecnico Sync B' });
});

describe('uploading clients created on the tablet', () => {
  test('a technician uploads a new client and then its changes with the same device id', async () => {
    const id = randomUUID();
    const createdAt = '2026-11-10T15:00:00.000Z';

    const created = await asTechA(UPSERT, [id, TECH_A, 'Cliente de prueba sync', true, createdAt]);
    assert.ok(created.ok, created.error);

    const updated = await asTechA(UPSERT, [id, TECH_A, 'Cliente de prueba editado', false, createdAt]);
    assert.ok(updated.ok, updated.error);

    const row = (await db.query('select * from public.clients where id = $1', [id])).rows[0];
    assert.equal(row.name, 'Cliente de prueba editado');
    assert.equal(row.is_active, false);
    assert.equal(row.technician_id, TECH_A);
    assert.equal(new Date(row.created_at).toISOString(), createdAt);
  });

  test('a technician cannot upload a client for another technician', async () => {
    const result = await asTechA(UPSERT, [randomUUID(), TECH_B, 'Cliente ajeno', true, new Date().toISOString()]);
    assert.equal(result.ok, false);
  });

  test("a technician cannot overwrite another technician's client by reusing its id", async () => {
    const id = randomUUID();
    const own = await asTechB(UPSERT, [id, TECH_B, 'Cliente de B', true, new Date().toISOString()]);
    assert.ok(own.ok, own.error);

    const result = await asTechA(UPSERT, [id, TECH_A, 'Intento de A', true, new Date().toISOString()]);
    assert.equal(result.ok, false);
    const row = (await db.query('select name, technician_id from public.clients where id = $1', [id])).rows[0];
    assert.equal(row.name, 'Cliente de B');
    assert.equal(row.technician_id, TECH_B);
  });

  test('a technician downloads only their own clients', async () => {
    const result = await asTechA('select technician_id from public.clients');
    assert.ok(result.ok, result.error);
    assert.ok(result.rows.length > 0);
    assert.ok(result.rows.every((row) => row.technician_id === TECH_A));
  });
});
