import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatFolio } from '../src/report.ts';

test('folios are shown with six digits', () => {
  assert.equal(formatFolio(123), '000123');
  assert.equal(formatFolio(1), '000001');
  assert.equal(formatFolio(1234567), '1234567');
});
