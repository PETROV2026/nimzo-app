import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { isDownloadDue, shouldReplaceCatalog } from '../src/service-forms/catalog-sync-rules.ts';

const row = (code: string, updated_at: string) => ({ code, updated_at });

describe('shouldReplaceCatalog', () => {
  const saved = [
    row('fire_alarm_weekly', '2026-11-01T10:00:00Z'),
    row('electric_pump', '2026-11-02T10:00:00Z'),
  ];

  test('the same forms in any order are not written again', () => {
    assert.equal(shouldReplaceCatalog(saved, [...saved].reverse()), false);
  });

  test('a changed, added or removed form replaces the catalog', () => {
    assert.equal(
      shouldReplaceCatalog(saved, [saved[0], row('electric_pump', '2026-11-03T10:00:00Z')]),
      true,
    );
    assert.equal(
      shouldReplaceCatalog(saved, [...saved, row('site_survey', '2026-11-04T10:00:00Z')]),
      true,
    );
    assert.equal(shouldReplaceCatalog(saved, [saved[0]]), true);
    assert.equal(shouldReplaceCatalog([], saved), true);
  });

  test('an empty answer never wipes a saved catalog', () => {
    assert.equal(shouldReplaceCatalog(saved, []), false);
    assert.equal(shouldReplaceCatalog([], []), false);
  });
});

describe('isDownloadDue', () => {
  const minute = 60_000;

  test('the first download and a forced one always run', () => {
    assert.equal(isDownloadDue(null, 0, { force: false }), true);
    assert.equal(isDownloadDue(1_000, 1_000 + minute, { force: true }), true);
  });

  test('returning to the app downloads again only after ten minutes', () => {
    assert.equal(isDownloadDue(0, 9 * minute, { force: false }), false);
    assert.equal(isDownloadDue(0, 10 * minute, { force: false }), true);
  });
});
