import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clientRows } from '../src/clients/client-rows.ts';

const client = (id: string, isActive = true) => ({ id, isActive });

test('active clients are split into rows of the column count', () => {
  const rows = clientRows([client('a'), client('b'), client('c')], 2);
  assert.deepEqual(rows, [
    { type: 'row', key: 'active:a', clients: [client('a'), client('b')] },
    { type: 'row', key: 'active:c', clients: [client('c')] },
  ]);
});

test('inactive clients come after a header, in their own rows', () => {
  const rows = clientRows([client('a'), client('x', false), client('b'), client('y', false)], 3);
  assert.deepEqual(rows, [
    { type: 'row', key: 'active:a', clients: [client('a'), client('b')] },
    { type: 'header', key: 'inactive', label: 'Inactivos' },
    { type: 'row', key: 'inactive:x', clients: [client('x', false), client('y', false)] },
  ]);
});

test('only inactive clients still show the header', () => {
  const rows = clientRows([client('x', false)], 1);
  assert.deepEqual(rows, [
    { type: 'header', key: 'inactive', label: 'Inactivos' },
    { type: 'row', key: 'inactive:x', clients: [client('x', false)] },
  ]);
});

test('no clients gives no rows', () => {
  assert.deepEqual(clientRows([], 2), []);
});

test('a column count below one is treated as one', () => {
  const rows = clientRows([client('a'), client('b')], 0);
  assert.equal(rows.length, 2);
});
