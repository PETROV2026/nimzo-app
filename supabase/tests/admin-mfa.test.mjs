import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { createTechnicianCatalog, createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-0000000000f1';
const TECH = '00000000-0000-0000-0000-0000000000f2';

let db;

const asAdmin = (aal, sql, params = []) => runAs(db, 'authenticated', ADMIN, sql, params, { aal });
const asTech = (aal, sql, params = []) => runAs(db, 'authenticated', TECH, sql, params, { aal });

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Prueba 2FA', role: 'admin' });
  await createUser(db, TECH, { fullName: 'Técnico Prueba 2FA' });
  await createTechnicianCatalog(db, TECH, { prefix: 'MFA ' });
});

describe('admins need a session verified with a second factor', () => {
  test('without 2FA an admin is not an admin', async () => {
    const isAdmin = await asAdmin('aal1', 'select private.is_admin() as value');
    assert.equal(isAdmin.rows[0].value, false);

    const clients = await asAdmin('aal1', 'select id from public.clients');
    assert.deepEqual(clients.rows, []);

    const insert = await asAdmin(
      'aal1',
      `insert into public.clients (name, technician_id) values ('Cliente Prueba 2FA', $1)`,
      [TECH],
    );
    assert.equal(insert.ok, false);
  });

  test('without 2FA an admin still reads their own profile, so the panel can ask for the code', async () => {
    const profile = await asAdmin('aal1', 'select id, role from public.profiles');
    assert.deepEqual(profile.rows, [{ id: ADMIN, role: 'admin' }]);
  });

  test('with 2FA the admin sees every technician catalog', async () => {
    const isAdmin = await asAdmin('aal2', 'select private.is_admin() as value');
    assert.equal(isAdmin.rows[0].value, true);

    const clients = await asAdmin('aal2', 'select id from public.clients');
    assert.ok(clients.rows.length > 0);
  });

  test('technicians do not need 2FA', async () => {
    const clients = await asTech('aal1', 'select id from public.clients');
    assert.ok(clients.rows.length > 0);
  });
});
