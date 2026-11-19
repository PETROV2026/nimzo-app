import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { defaultAllowedOrigins, parseAllowedOrigins } from '../functions/_shared/cors.ts';
import { createHandler as createLoginHandler } from '../functions/admin-login/handler.ts';
import { createHandler as createUsersHandler } from '../functions/admin-users/handler.ts';

const PANEL = 'https://panel.ejemplo.com';
const OTHER = 'https://otro-sitio.ejemplo.com';

function untouchedBackend(calls) {
  return new Proxy(
    {},
    {
      get: (_, name) => async () => {
        calls.push(name);
        return null;
      },
    },
  );
}

const functions = [
  ['admin-login', createLoginHandler],
  ['admin-users', createUsersHandler],
];

describe('allowed origins', () => {
  test('come from a comma separated list and fall back to the panel and localhost', () => {
    assert.deepEqual(parseAllowedOrigins(` ${PANEL} , http://localhost:5173 ,`), [
      PANEL,
      'http://localhost:5173',
    ]);
    assert.deepEqual(parseAllowedOrigins(undefined), defaultAllowedOrigins);
    assert.deepEqual(parseAllowedOrigins('  '), defaultAllowedOrigins);
    assert.ok(defaultAllowedOrigins.includes('https://nimzo-app-web.vercel.app'));
  });
});

for (const [name, createHandler] of functions) {
  describe(`${name} CORS`, () => {
    const url = `https://example.supabase.co/functions/v1/${name}`;

    test('a preflight from the panel gets its origin back', async () => {
      const handle = createHandler(untouchedBackend([]), { allowedOrigins: [PANEL] });
      const response = await handle(new Request(url, { method: 'OPTIONS', headers: { Origin: PANEL } }));
      assert.equal(response.status, 204);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), PANEL);
      assert.equal(response.headers.get('Vary'), 'Origin');
    });

    test('another origin is rejected before reaching the backend', async () => {
      const calls = [];
      const handle = createHandler(untouchedBackend(calls), { allowedOrigins: [PANEL] });
      for (const method of ['OPTIONS', 'POST']) {
        const response = await handle(
          new Request(url, {
            method,
            headers: { Origin: OTHER, 'Content-Type': 'application/json' },
            body: method === 'POST' ? '{}' : undefined,
          }),
        );
        assert.equal(response.status, 403, method);
        assert.equal(response.headers.get('Access-Control-Allow-Origin'), null, method);
      }
      assert.deepEqual(calls, []);
    });

    test('a call without an origin is not a browser and is not blocked by CORS', async () => {
      const handle = createHandler(untouchedBackend([]), { allowedOrigins: [PANEL] });
      const response = await handle(new Request(url, { method: 'GET' }));
      assert.equal(response.status, 405);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    });
  });
}
