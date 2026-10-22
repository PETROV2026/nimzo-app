import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { applyMigrationsFrom, createTestDb, createUser, runAs } from './harness.mjs';

const MIGRATION = '20261016172102_profile_email_and_last_sign_in.sql';

const EXISTING = '00000000-0000-0000-0000-0000000000a5';
const ADMIN = '00000000-0000-0000-0000-0000000000b5';
const TECH = '00000000-0000-0000-0000-0000000000c5';

let db;

async function profile(id) {
  const { rows } = await db.query(
    'select email, last_sign_in_at from public.profiles where id = $1',
    [id],
  );
  return rows[0];
}

before(async () => {
  db = await createTestDb({ before: MIGRATION });
  await createUser(db, EXISTING, { fullName: 'Cuenta Previa' });
  await db.query(
    `update auth.users set email = 'previa@ejemplo.com', last_sign_in_at = '2026-10-01T10:00:00Z' where id = $1`,
    [EXISTING],
  );
  await applyMigrationsFrom(db, MIGRATION);

  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
     values ($1, 'admin@ejemplo.com', '{"full_name":"Admin"}', '{"role":"admin"}'),
            ($2, 'tecnico@ejemplo.com', '{"full_name":"Tecnico"}', '{}')`,
    [ADMIN, TECH],
  );
});

describe('profile email and last sign-in', () => {
  test('existing profiles are backfilled from auth.users', async () => {
    const row = await profile(EXISTING);
    assert.equal(row.email, 'previa@ejemplo.com');
    assert.equal(new Date(row.last_sign_in_at).toISOString(), '2026-10-01T10:00:00.000Z');
  });

  test('new accounts get their email in the profile', async () => {
    assert.equal((await profile(TECH)).email, 'tecnico@ejemplo.com');
  });

  test('signing in updates last_sign_in_at in the profile', async () => {
    await db.query(`update auth.users set last_sign_in_at = '2026-10-16T08:30:00Z' where id = $1`, [TECH]);
    assert.equal(
      new Date((await profile(TECH)).last_sign_in_at).toISOString(),
      '2026-10-16T08:30:00.000Z',
    );
  });

  test('changing the email in auth updates the profile', async () => {
    await db.query(`update auth.users set email = 'nuevo.tecnico@ejemplo.com' where id = $1`, [TECH]);
    assert.equal((await profile(TECH)).email, 'nuevo.tecnico@ejemplo.com');
  });

  test('a user cannot edit their own email in the profile', async () => {
    const result = await runAs(
      db,
      'authenticated',
      TECH,
      `update public.profiles set email = 'falso@ejemplo.com' where id = $1`,
      [TECH],
    );
    assert.equal(result.ok, false);
    assert.equal((await profile(TECH)).email, 'nuevo.tecnico@ejemplo.com');
  });

  test('an admin cannot edit emails in profiles either', async () => {
    const result = await runAs(
      db,
      'authenticated',
      ADMIN,
      `update public.profiles set email = 'falso@ejemplo.com' where id = $1`,
      [TECH],
    );
    assert.equal(result.ok, false);
  });

  test('a user can still edit their own name', async () => {
    const result = await runAs(
      db,
      'authenticated',
      TECH,
      `update public.profiles set full_name = 'Tecnico Renombrado' where id = $1`,
      [TECH],
    );
    assert.ok(result.ok, result.error);
  });
});
