import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-0000000000a7';
const TECH = '00000000-0000-0000-0000-0000000000b7';

let db;
const asAdmin = (sql, params) => runAs(db, 'authenticated', ADMIN, sql, params);
const asTech = (sql, params) => runAs(db, 'authenticated', TECH, sql, params);

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Formatos', role: 'admin' });
  await createUser(db, TECH, { fullName: 'Tecnico Formatos' });
});

describe('service forms catalog', () => {
  test('ships with the existing forms', async () => {
    const { rows } = await db.query('select code from public.service_forms order by code');
    assert.equal(rows.length, 30);
    assert.equal(rows[0].code, 'F-SER-003');
    assert.equal(rows.at(-1).code, 'F-SER-111');
  });

  test('technicians can read the catalog but not change it', async () => {
    assert.equal((await asTech('select id from public.service_forms')).rows.length, 30);
    assert.equal((await asTech(`insert into public.service_forms (code, name) values ('F-SER-900', 'X')`)).ok, false);
    const update = await asTech(`update public.service_forms set name = 'X' where code = 'F-SER-003'`);
    assert.equal(update.affected ?? 0, 0);
  });

  test('anon cannot read the catalog', async () => {
    assert.equal((await runAs(db, 'anon', null, 'select id from public.service_forms')).ok, false);
  });

  test('admins can add and edit forms', async () => {
    const insert = await asAdmin(
      `insert into public.service_forms (code, name, subtitle, icon_path) values ('F-SER-112', 'Detectores de humo', 'Anual', 'icons/a.svg') returning id`,
    );
    assert.ok(insert.ok, insert.error);
    const update = await asAdmin(`update public.service_forms set is_active = false where code = 'F-SER-112'`);
    assert.equal(update.affected, 1);
  });

  test('nobody can delete a form', async () => {
    const result = await asAdmin(`delete from public.service_forms where code = 'F-SER-112'`);
    assert.equal(result.affected ?? 0, 0);
  });

  test('the code must follow F-SER-XXX and be unique', async () => {
    assert.equal((await asAdmin(`insert into public.service_forms (code, name) values ('FSER-1', 'X')`)).ok, false);
    assert.equal((await asAdmin(`insert into public.service_forms (code, name) values ('F-SER-003', 'X')`)).ok, false);
  });

  test('the code never changes', async () => {
    const result = await asAdmin(`update public.service_forms set code = 'F-SER-913' where code = 'F-SER-003'`);
    assert.equal(result.ok, false);
  });

  test('search ignores accents', async () => {
    const { rows } = await db.query(
      `select code from public.service_forms where search_text like '%' || private.search_text('hidraulica') || '%'`,
    );
    assert.deepEqual(rows.map((row) => row.code), ['F-SER-018']);
  });
});

describe('form-icons bucket', () => {
  test('is public and only accepts small images', async () => {
    const { rows } = await db.query(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'form-icons'`);
    assert.equal(rows[0].public, true);
    assert.equal(Number(rows[0].file_size_limit), 524288);
    assert.deepEqual(rows[0].allowed_mime_types, ['image/svg+xml', 'image/png', 'image/webp']);
  });

  test('admins can upload, replace and remove icons', async () => {
    const insert = await asAdmin(`insert into storage.objects (bucket_id, name) values ('form-icons', 'icons/b.svg') returning id`);
    assert.ok(insert.ok, insert.error);
    assert.equal((await asAdmin(`update storage.objects set name = 'icons/c.svg' where name = 'icons/b.svg'`)).affected, 1);
    assert.equal((await asAdmin(`delete from storage.objects where name = 'icons/c.svg'`)).affected, 1);
  });

  test('technicians cannot upload icons', async () => {
    const result = await asTech(`insert into storage.objects (bucket_id, name) values ('form-icons', 'icons/d.svg')`);
    assert.equal(result.ok, false);
  });
});
