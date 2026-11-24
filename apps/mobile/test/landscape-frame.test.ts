import assert from 'node:assert/strict';
import { test } from 'node:test';

import { landscapeFrame } from '../src/lib/landscape-frame.ts';

test('a tall area gets a wide frame, turned and centered on it', () => {
  assert.deepEqual(landscapeFrame({ width: 700, height: 1100 }), {
    width: 1100,
    height: 700,
    left: -200,
    top: 200,
    rotated: true,
  });
});

test('a wide area is used as it is', () => {
  assert.deepEqual(landscapeFrame({ width: 1100, height: 700 }), {
    width: 1100,
    height: 700,
    left: 0,
    top: 0,
    rotated: false,
  });
});

test('the turned frame covers exactly the same area', () => {
  const area = { width: 751, height: 1203 };
  const { width, height, left, top } = landscapeFrame(area);
  assert.equal(left + width / 2, area.width / 2);
  assert.equal(top + height / 2, area.height / 2);
  assert.equal(width, area.height);
  assert.equal(height, area.width);
});
