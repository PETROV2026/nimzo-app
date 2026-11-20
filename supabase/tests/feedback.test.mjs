import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-0000000000ad';
const TECH_A = '00000000-0000-0000-0000-0000000000bd';
const TECH_B = '00000000-0000-0000-0000-0000000000cd';
const INACTIVE = '00000000-0000-0000-0000-0000000000dd';

let db;
const asAdmin = (sql, params) => runAs(db, 'authenticated', ADMIN, sql, params);
const asTechA = (sql, params) => runAs(db, 'authenticated', TECH_A, sql, params);
const asTechB = (sql, params) => runAs(db, 'authenticated', TECH_B, sql, params);
const asInactive = (sql, params) => runAs(db, 'authenticated', INACTIVE, sql, params);
const asAnon = (sql, params) => runAs(db, 'anon', null, sql, params);

const COLUMNS = [
  'id',
  'technician_id',
  'kind',
  'message',
  'screen',
  'app_version',
  'os_version',
  'photo_paths',
  'written_at',
];

function feedbackRow(technicianId, overrides = {}) {
  const id = overrides.id ?? randomUUID();
  return {
    id,
    technician_id: technicianId,
    kind: 'bug',
    message: 'La firma no se guarda (prueba)',
    screen: 'services',
    app_version: '1.0.0',
    os_version: '14',
    photo_paths: [`${technicianId}/${id}/photo-1.jpg`],
    written_at: '2026-11-20T15:00:00Z',
    ...overrides,
  };
}

function insertFeedback(as, row) {
  const values = COLUMNS.map((column) => row[column]);
  const placeholders = COLUMNS.map((_, index) => `$${index + 1}`).join(', ');
  return as(
    `insert into public.feedback_messages (${COLUMNS.join(', ')}) values (${placeholders})`,
    values,
  );
}

async function rejects(promise, pattern) {
  const result = await promise;
  assert.equal(result.ok, false, 'expected the statement to fail');
  assert.match(result.error, pattern);
}

async function succeeds(promise) {
  const result = await promise;
  assert.equal(result.ok, true, result.error);
  return result;
}

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Mensajes', role: 'admin' });
  await createUser(db, TECH_A, { fullName: 'Tecnico A' });
  await createUser(db, TECH_B, { fullName: 'Tecnico B' });
  await createUser(db, INACTIVE, { fullName: 'Tecnico Inactivo' });
  await db.query('update public.profiles set is_active = false where id = $1', [INACTIVE]);
});

describe('feedback messages', () => {
  test('a technician sends their own message and the server sets created_at', async () => {
    const row = feedbackRow(TECH_A, { kind: 'idea', photo_paths: [] });
    await succeeds(insertFeedback(asTechA, row));
    const { rows } = await db.query(
      'select kind, created_at from public.feedback_messages where id = $1',
      [row.id],
    );
    assert.equal(rows[0].kind, 'idea');
    assert.ok(rows[0].created_at instanceof Date);
  });

  test('a technician cannot send a message as someone else', async () => {
    await rejects(insertFeedback(asTechA, feedbackRow(TECH_B)), /row-level security/);
  });

  test('an inactive technician cannot send messages', async () => {
    await rejects(insertFeedback(asInactive, feedbackRow(INACTIVE)), /row-level security|active technician/);
  });

  test('an administrator cannot send messages', async () => {
    await rejects(insertFeedback(asAdmin, feedbackRow(ADMIN)), /row-level security|active technician/);
  });

  test('anonymous users cannot send messages', async () => {
    await rejects(insertFeedback(asAnon, feedbackRow(TECH_A)), /permission denied/);
  });

  test('photos must live in the folder of the message', async () => {
    const row = feedbackRow(TECH_A, { photo_paths: [`${TECH_A}/${randomUUID()}/photo.jpg`] });
    await rejects(insertFeedback(asTechA, row), /folder of the message/);
  });

  test('a message needs text and at most five photos', async () => {
    await rejects(insertFeedback(asTechA, feedbackRow(TECH_A, { message: '   ' })), /check constraint/);
    const id = randomUUID();
    const photos = Array.from({ length: 6 }, (_, index) => `${TECH_A}/${id}/photo-${index}.jpg`);
    await rejects(insertFeedback(asTechA, feedbackRow(TECH_A, { id, photo_paths: photos })), /check constraint/);
  });

  test('a retried upload fails on the primary key instead of creating a second message', async () => {
    const row = feedbackRow(TECH_A);
    await succeeds(insertFeedback(asTechA, row));
    await rejects(insertFeedback(asTechA, row), /duplicate key/);
  });

  test('technicians cannot read messages, not even their own', async () => {
    assert.equal((await asTechA('select id from public.feedback_messages')).rows.length, 0);
    assert.equal((await asTechB('select id from public.feedback_messages')).rows.length, 0);
  });

  test('administrators read every message', async () => {
    const { rows } = await asAdmin('select technician_id from public.feedback_messages');
    assert.ok(rows.length >= 2);
    assert.ok(rows.every((row) => row.technician_id === TECH_A));
  });

  test('nobody changes or deletes a message through the api', async () => {
    const row = feedbackRow(TECH_A);
    await succeeds(insertFeedback(asTechA, row));
    const updated = await asAdmin(`update public.feedback_messages set message = 'cambiado' where id = $1`, [
      row.id,
    ]);
    assert.equal(updated.ok && updated.affected, 0);
    const removed = await asAdmin('delete from public.feedback_messages where id = $1', [row.id]);
    assert.equal(removed.ok && removed.affected, 0);
    const { rows } = await db.query('select message from public.feedback_messages where id = $1', [row.id]);
    assert.equal(rows[0].message, row.message);
  });
});

describe('feedback files', () => {
  test('the feedback-files bucket is private', async () => {
    const { rows } = await db.query(`select public from storage.buckets where id = 'feedback-files'`);
    assert.equal(rows[0].public, false);
  });

  test('technicians upload only to their own folder and cannot read files back', async () => {
    const ownPath = `${TECH_A}/${randomUUID()}/photo-1.jpg`;
    await succeeds(
      asTechA(`insert into storage.objects (bucket_id, name) values ('feedback-files', $1)`, [ownPath]),
    );
    await rejects(
      asTechA(`insert into storage.objects (bucket_id, name) values ('feedback-files', $1)`, [
        `${TECH_B}/${randomUUID()}/photo-1.jpg`,
      ]),
      /row-level security/,
    );
    assert.equal(
      (await asTechA(`select name from storage.objects where bucket_id = 'feedback-files'`)).rows.length,
      0,
    );
    assert.equal((await asAdmin('select name from storage.objects where name = $1', [ownPath])).rows.length, 1);
  });

  test('inactive technicians cannot upload files', async () => {
    await rejects(
      asInactive(`insert into storage.objects (bucket_id, name) values ('feedback-files', $1)`, [
        `${INACTIVE}/${randomUUID()}/photo-1.jpg`,
      ]),
      /row-level security/,
    );
  });
});
