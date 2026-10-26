import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { createHandler } from '../functions/admin-login/handler.ts';

const ADMIN = '00000000-0000-0000-0000-0000000000a7';
const TECH = '00000000-0000-0000-0000-0000000000c7';

const accounts = {
  'admin@ejemplo.com': { password: 'Prueba123', userId: ADMIN },
  'tecnico@ejemplo.com': { password: 'Prueba123', userId: TECH },
  'baja@ejemplo.com': { password: 'Prueba123', banned: true },
};

let calls;
let adminActive;

function fakeBackend() {
  return {
    async verifyCaptcha(token, ip) {
      calls.push(['verifyCaptcha', token, ip]);
      return token === 'valid-captcha';
    },
    async signIn(email, password) {
      calls.push(['signIn', email]);
      const account = accounts[email];
      if (account?.banned) return { ok: false, code: 'user_banned' };
      if (!account || account.password !== password) return { ok: false, code: 'invalid_credentials' };
      return {
        ok: true,
        userId: account.userId,
        accessToken: `access-${account.userId}`,
        refreshToken: `refresh-${account.userId}`,
      };
    },
    async isActiveAdmin(userId) {
      return userId === ADMIN && adminActive;
    },
    async revokeSession(accessToken) {
      calls.push(['revokeSession', accessToken]);
    },
  };
}

async function call(body, { method = 'POST', headers = {} } = {}) {
  const handle = createHandler(fakeBackend());
  const response = await handle(
    new Request('https://example.supabase.co/functions/v1/admin-login', {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: method === 'POST' ? JSON.stringify(body) : undefined,
    }),
  );
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

const login = (overrides = {}) => ({
  email: 'admin@ejemplo.com',
  password: 'Prueba123',
  captcha_token: 'valid-captcha',
  ...overrides,
});

beforeEach(() => {
  calls = [];
  adminActive = true;
});

test('an active admin with a valid captcha gets a session', async () => {
  const { status, body } = await call(login({ email: ' Admin@Ejemplo.com ' }), {
    headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
  });
  assert.equal(status, 200);
  assert.deepEqual(body, { access_token: `access-${ADMIN}`, refresh_token: `refresh-${ADMIN}` });
  assert.deepEqual(calls[0], ['verifyCaptcha', 'valid-captcha', '203.0.113.7']);
  assert.deepEqual(calls[1], ['signIn', 'admin@ejemplo.com']);
});

test('a missing or failed captcha never reaches sign-in', async () => {
  const missing = await call(login({ captcha_token: undefined }));
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error, 'Completa la verificación de seguridad.');

  const failed = await call(login({ captcha_token: 'bot' }));
  assert.equal(failed.status, 400);
  assert.equal(failed.body.error, 'La verificación de seguridad falló. Intenta de nuevo.');
  assert.ok(!calls.some(([name]) => name === 'signIn'));
});

test('wrong credentials get the generic message', async () => {
  const { status, body } = await call(login({ password: 'otra' }));
  assert.equal(status, 400);
  assert.equal(body.error, 'El correo o la contraseña no son correctos.');
});

test('technicians, inactive admins and banned users get no session', async () => {
  const technician = await call(login({ email: 'tecnico@ejemplo.com' }));
  assert.equal(technician.status, 403);
  assert.equal(technician.body.access_token, undefined);
  assert.deepEqual(calls.at(-1), ['revokeSession', `access-${TECH}`]);

  adminActive = false;
  const inactive = await call(login());
  assert.equal(inactive.status, 403);
  assert.deepEqual(calls.at(-1), ['revokeSession', `access-${ADMIN}`]);

  const banned = await call(login({ email: 'baja@ejemplo.com' }));
  assert.equal(banned.status, 403);
  assert.equal(banned.body.error, 'Tu cuenta no tiene acceso al panel de administración.');
});

test('empty fields, bad JSON and other methods are rejected', async () => {
  assert.equal((await call(login({ email: '' }))).status, 400);
  assert.equal((await call(login({ password: '' }))).status, 400);
  assert.equal((await call(null, { method: 'GET' })).status, 405);
  assert.equal((await call(null, { method: 'OPTIONS' })).status, 204);

  const handle = createHandler(fakeBackend());
  const response = await handle(
    new Request('https://example.supabase.co/functions/v1/admin-login', { method: 'POST', body: '{' }),
  );
  assert.equal(response.status, 400);
});
