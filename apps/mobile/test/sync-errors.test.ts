import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { isServerError, SyncTimeoutError, syncErrorToReport } from '../src/lib/sync-errors.ts';

describe('isServerError', () => {
  test('postgres and postgrest codes are server errors worth reporting', () => {
    assert.equal(isServerError({ code: '42501', message: 'permission denied' }), true);
    assert.equal(isServerError({ code: 'PGRST301', message: 'JWT expired' }), true);
  });

  test('network failures and timeouts are not', () => {
    assert.equal(isServerError({ code: '', message: 'TypeError: Network request failed' }), false);
    assert.equal(isServerError({ code: '20', message: 'AbortError: Aborted' }), false);
    assert.equal(isServerError(null), false);
    assert.equal(isServerError(new Error('boom')), false);
  });
});

describe('syncErrorToReport', () => {
  test('a timed out request is not reported', () => {
    assert.equal(syncErrorToReport(new SyncTimeoutError(15_000), 'Clients sync'), null);
  });

  test('a network failure is not reported', () => {
    const networkError = {
      message: 'TypeError: Network request failed',
      details: '',
      hint: '',
      code: '',
    };
    assert.equal(syncErrorToReport(networkError, 'Clients sync'), null);
  });

  test('a server error is reported with only its code and message', () => {
    const report = syncErrorToReport(
      { code: 'PGRST301', message: 'JWT expired', details: 'Prueba, prueba@example.com', hint: '' },
      'Clients sync',
    );
    assert.ok(report instanceof Error);
    assert.equal(report.message, 'Clients sync failed: PGRST301 JWT expired');
  });

  test('an unexpected error is reported as it is', () => {
    const error = new Error('Something broke');
    assert.equal(syncErrorToReport(error, 'Clients sync'), error);
  });
});
