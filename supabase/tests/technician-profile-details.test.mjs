import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-0000000000a8';
const TECH = '00000000-0000-0000-0000-0000000000b8';
const OTHER = '00000000-0000-0000-0000-0000000000c8';

let db;
const asAdmin = (sql, params) => runAs(db, 'authenticated', ADMIN, sql, params);
const asTech = (sql, params) => runAs(db, 'authenticated', TECH, sql, params);
const asOther = (sql, params) => runAs(db, 'authenticated', OTHER, sql, params);

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Perfil', role: 'admin' });
  await createUser(db, TECH, { fullName: 'Tecnico Perfil' });
  await createUser(db, OTHER, { fullName: 'Otro Tecnico' });
});

describe('technician profile details', () => {
  test('a technician can fill in their phone, state, city and signature', async () => {
    const result = await asTech(
      `update public.profiles
       set phone = '81 0000 1234', state = 'NLE', city = 'Monterrey', signature_path = $1 || '/signature-1.png'
       where id = $1`,
      [TECH],
    );
    assert.ok(result.ok, result.error);
    assert.equal(result.affected, 1);
    const { rows } = await asTech('select phone, state, city, signature_path from public.profiles where id = $1', [TECH]);
    assert.deepEqual(rows[0], {
      phone: '81 0000 1234',
      state: 'NLE',
      city: 'Monterrey',
      signature_path: `${TECH}/signature-1.png`,
    });
  });

  test('a technician cannot change another profile', async () => {
    const result = await asOther(`update public.profiles set phone = '81 0000 9999' where id = $1`, [TECH]);
    assert.equal(result.affected ?? 0, 0);
  });

  test('admins can edit the details of any technician', async () => {
    const result = await asAdmin(`update public.profiles set city = 'San Nicolás' where id = $1`, [TECH]);
    assert.equal(result.affected, 1);
  });

  test('the state must be a mexican state code', async () => {
    const result = await asTech(`update public.profiles set state = 'Nuevo León' where id = $1`, [TECH]);
    assert.equal(result.ok, false);
  });

  test('phone and city cannot be blank', async () => {
    assert.equal((await asTech(`update public.profiles set phone = '  ' where id = $1`, [TECH])).ok, false);
    assert.equal((await asTech(`update public.profiles set city = '' where id = $1`, [TECH])).ok, false);
  });

  test('the signature must be stored in the folder of its own profile', async () => {
    const result = await asTech(`update public.profiles set signature_path = $2 || '/signature.png' where id = $1`, [
      TECH,
      OTHER,
    ]);
    assert.equal(result.ok, false);
  });
});

describe('signatures bucket', () => {
  test('is private and only accepts small png images', async () => {
    const { rows } = await db.query(
      `select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'signatures'`,
    );
    assert.deepEqual(rows[0], { public: false, file_size_limit: 1048576, allowed_mime_types: ['image/png'] });
  });

  test('a technician can upload, view and remove only their own signature', async () => {
    const insert = await asTech(
      `insert into storage.objects (bucket_id, name) values ('signatures', $1 || '/signature-2.png') returning id`,
      [TECH],
    );
    assert.ok(insert.ok, insert.error);
    const foreign = await asTech(
      `insert into storage.objects (bucket_id, name) values ('signatures', $1 || '/signature.png')`,
      [OTHER],
    );
    assert.equal(foreign.ok, false);
    assert.equal((await asTech(`select id from storage.objects where bucket_id = 'signatures'`)).rows.length, 1);
    assert.equal((await asOther(`select id from storage.objects where bucket_id = 'signatures'`)).rows.length, 0);
    const otherDelete = await asOther(`delete from storage.objects where bucket_id = 'signatures'`);
    assert.equal(otherDelete.affected ?? 0, 0);
    const ownDelete = await asTech(`delete from storage.objects where bucket_id = 'signatures' and name = $1 || '/signature-2.png'`, [
      TECH,
    ]);
    assert.equal(ownDelete.affected, 1);
  });

  test('admins can view every signature', async () => {
    await db.query(`insert into storage.objects (bucket_id, name) values ('signatures', $1 || '/signature-3.png')`, [TECH]);
    assert.equal((await asAdmin(`select id from storage.objects where bucket_id = 'signatures'`)).rows.length, 1);
  });

  test('a deactivated technician loses access to their signature', async () => {
    await db.query('update public.profiles set is_active = false where id = $1', [TECH]);
    assert.equal((await asTech(`select id from storage.objects where bucket_id = 'signatures'`)).rows.length, 0);
    await db.query('update public.profiles set is_active = true where id = $1', [TECH]);
  });

  test('anon cannot read signatures', async () => {
    assert.equal((await runAs(db, 'anon', null, `select id from storage.objects where bucket_id = 'signatures'`)).rows?.length ?? 0, 0);
  });
});
