import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';

import { createHandler, UserError } from '../functions/admin-users/handler.ts';

const ADMIN = '00000000-0000-0000-0000-0000000000a6';
const OTHER_ADMIN = '00000000-0000-0000-0000-0000000000b6';
const TECH = '00000000-0000-0000-0000-0000000000c6';

let profiles;
let calls;
let activeAdminsOverride;

function fakeBackend() {
  return {
    async getCallerId(token) {
      return { 'admin-token': ADMIN, 'tech-token': TECH }[token] ?? null;
    },
    async getProfile(id) {
      return profiles[id] ? { ...profiles[id] } : null;
    },
    async countActiveAdmins() {
      return activeAdminsOverride ?? Object.values(profiles).filter((p) => p.role === 'admin' && p.is_active).length;
    },
    async createUser(input) {
      if (input.email === 'repetido@ejemplo.com') throw new UserError(409, 'Ya existe una cuenta con ese correo.');
      calls.push(['createUser', input]);
      return { id: '00000000-0000-0000-0000-0000000000d6' };
    },
    async updateProfile(id, input) {
      calls.push(['updateProfile', id, input]);
      profiles[id].role = input.role;
    },
    async setActive(id, active) {
      calls.push(['setActive', id, active]);
      profiles[id].is_active = active;
    },
    async updatePassword(id, password) {
      calls.push(['updatePassword', id, password]);
    },
  };
}

async function call(body, { token = 'admin-token', method = 'POST' } = {}) {
  const handle = createHandler(fakeBackend());
  const response = await handle(
    new Request('https://example.supabase.co/functions/v1/admin-users', {
      method,
      headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {},
      body: method === 'POST' ? JSON.stringify(body) : undefined,
    }),
  );
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

beforeEach(() => {
  calls = [];
  activeAdminsOverride = undefined;
  profiles = {
    [ADMIN]: { role: 'admin', is_active: true },
    [TECH]: { role: 'technician', is_active: true },
  };
});

describe('admin-users function: who can call it', () => {
  test('answers the CORS preflight', async () => {
    const result = await call(null, { method: 'OPTIONS' });
    assert.equal(result.status, 204);
  });

  test('rejects requests without a session', async () => {
    const result = await call({ action: 'create' }, { token: null });
    assert.equal(result.status, 401);
  });

  test('rejects a technician', async () => {
    const result = await call({ action: 'reset_password', user_id: TECH, password: 'Segura123' }, { token: 'tech-token' });
    assert.equal(result.status, 403);
    assert.deepEqual(calls, []);
  });

  test('rejects an inactive admin', async () => {
    profiles[ADMIN].is_active = false;
    const result = await call({ action: 'reset_password', user_id: TECH, password: 'Segura123' });
    assert.equal(result.status, 403);
  });
});

describe('admin-users function: create', () => {
  test('creates an account with a normalized email', async () => {
    const result = await call({
      action: 'create',
      full_name: '  Ana Técnica ',
      email: ' Ana@Ejemplo.com ',
      role: 'technician',
      password: 'Temporal123',
    });
    assert.equal(result.status, 201);
    assert.deepEqual(calls, [
      ['createUser', { fullName: 'Ana Técnica', email: 'ana@ejemplo.com', role: 'technician', password: 'Temporal123' }],
    ]);
  });

  for (const [field, body] of [
    ['name', { full_name: '', email: 'a@ejemplo.com', role: 'technician', password: 'Temporal123' }],
    ['email', { full_name: 'Ana', email: 'no-es-correo', role: 'technician', password: 'Temporal123' }],
    ['role', { full_name: 'Ana', email: 'a@ejemplo.com', role: 'tecnico', password: 'Temporal123' }],
    ['supervisor role', { full_name: 'Ana', email: 'a@ejemplo.com', role: 'supervisor', password: 'Temporal123' }],
    ['password', { full_name: 'Ana', email: 'a@ejemplo.com', role: 'technician', password: 'corta' }],
  ]) {
    test(`rejects an invalid ${field}`, async () => {
      const result = await call({ action: 'create', ...body });
      assert.equal(result.status, 400);
      assert.equal(typeof result.body.error, 'string');
      assert.deepEqual(calls, []);
    });
  }

  test('reports a duplicated email', async () => {
    const result = await call({
      action: 'create',
      full_name: 'Ana',
      email: 'repetido@ejemplo.com',
      role: 'technician',
      password: 'Temporal123',
    });
    assert.equal(result.status, 409);
    assert.match(result.body.error, /Ya existe/);
  });
});

describe('admin-users function: update, deactivate and reset', () => {
  test('changes a name and role', async () => {
    const result = await call({ action: 'update', user_id: TECH, full_name: 'Ana Admin', role: 'admin' });
    assert.equal(result.status, 200);
    assert.deepEqual(calls, [['updateProfile', TECH, { fullName: 'Ana Admin', role: 'admin' }]]);
  });

  test('an admin cannot remove their own admin role', async () => {
    profiles[OTHER_ADMIN] = { role: 'admin', is_active: true };
    const result = await call({ action: 'update', user_id: ADMIN, full_name: 'Yo', role: 'technician' });
    assert.equal(result.status, 400);
    assert.deepEqual(calls, []);
  });

  test('can demote another admin while at least one active admin remains', async () => {
    profiles[OTHER_ADMIN] = { role: 'admin', is_active: true };
    const result = await call({ action: 'update', user_id: OTHER_ADMIN, full_name: 'Otro', role: 'technician' });
    assert.equal(result.status, 200);
  });

  test('never leaves the system without an active admin', async () => {
    profiles[OTHER_ADMIN] = { role: 'admin', is_active: true };
    activeAdminsOverride = 1;
    const demote = await call({ action: 'update', user_id: OTHER_ADMIN, full_name: 'Otro', role: 'technician' });
    const deactivate = await call({ action: 'set_active', user_id: OTHER_ADMIN, active: false });
    assert.equal(demote.status, 400);
    assert.equal(deactivate.status, 400);
    assert.match(deactivate.body.error, /al menos un administrador/);
    assert.deepEqual(calls, []);
  });

  test('deactivates and reactivates another user', async () => {
    assert.equal((await call({ action: 'set_active', user_id: TECH, active: false })).status, 200);
    assert.equal((await call({ action: 'set_active', user_id: TECH, active: true })).status, 200);
    assert.deepEqual(calls, [
      ['setActive', TECH, false],
      ['setActive', TECH, true],
    ]);
  });

  test('an admin cannot deactivate themselves', async () => {
    const result = await call({ action: 'set_active', user_id: ADMIN, active: false });
    assert.equal(result.status, 400);
    assert.match(result.body.error, /propia cuenta/);
    assert.deepEqual(calls, []);
  });

  test('resets a password', async () => {
    const result = await call({ action: 'reset_password', user_id: TECH, password: 'Nueva12345' });
    assert.equal(result.status, 200);
    assert.deepEqual(calls, [['updatePassword', TECH, 'Nueva12345']]);
  });

  test('returns 404 for an unknown user', async () => {
    const result = await call({
      action: 'reset_password',
      user_id: '00000000-0000-0000-0000-0000000000ff',
      password: 'Nueva12345',
    });
    assert.equal(result.status, 404);
  });

  test('rejects an unknown action', async () => {
    const result = await call({ action: 'delete', user_id: TECH });
    assert.equal(result.status, 400);
  });
});
