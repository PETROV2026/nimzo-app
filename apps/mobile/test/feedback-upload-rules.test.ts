import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  feedbackPhotoPath,
  isAlreadyUploaded,
  uploadOutcome,
} from '../src/feedback/feedback-upload-rules.ts';

const TECH = '00000000-0000-0000-0000-0000000000aa';
const MESSAGE = '11111111-1111-1111-1111-111111111111';

test('photos go in the folder of the message, numbered from one', () => {
  assert.equal(feedbackPhotoPath(TECH, MESSAGE, 0), `${TECH}/${MESSAGE}/photo-1.jpg`);
  assert.equal(feedbackPhotoPath(TECH, MESSAGE, 4), `${TECH}/${MESSAGE}/photo-5.jpg`);
});

test('no error means the message was sent', () => {
  assert.equal(uploadOutcome(null), 'sent');
});

test('a duplicate id means an earlier try already arrived', () => {
  assert.equal(uploadOutcome({ code: '23505' }), 'sent');
});

test('the server refusing the row means it will never go through', () => {
  assert.equal(uploadOutcome({ code: '23514' }), 'rejected');
  assert.equal(uploadOutcome({ code: '22001' }), 'rejected');
  assert.equal(uploadOutcome({ code: '42501' }), 'rejected');
  assert.equal(uploadOutcome({ code: 'P0001' }), 'rejected');
});

test('network failures and other errors are retried later', () => {
  assert.equal(uploadOutcome({ code: '' }), 'retry');
  assert.equal(uploadOutcome({ code: 'PGRST301' }), 'retry');
  assert.equal(uploadOutcome({ code: '57014' }), 'retry');
});

test('a photo that is already in storage counts as uploaded', () => {
  assert.equal(
    isAlreadyUploaded({ statusCode: '409', message: 'The resource already exists' }),
    true,
  );
  assert.equal(isAlreadyUploaded({ message: 'The resource already exists' }), true);
  assert.equal(
    isAlreadyUploaded({ statusCode: '403', message: 'new row violates row-level security policy' }),
    false,
  );
  assert.equal(isAlreadyUploaded(null), false);
});
