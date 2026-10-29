import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isValidPhone } from '../src/phone.ts';

test('phone numbers in common mexican formats are accepted', () => {
  for (const phone of ['81 0000 1234', '+52 81 1234 5678', '(686) 123-4567', '8112345678']) {
    assert.ok(isValidPhone(phone), phone);
  }
});

test('text that is not a phone number is rejected', () => {
  for (const phone of ['llámame', '123', '81-ABC-1234', '1'.repeat(21), '+ ']) {
    assert.equal(isValidPhone(phone), false, phone);
  }
});
