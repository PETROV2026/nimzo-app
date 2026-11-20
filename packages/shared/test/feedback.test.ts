import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  feedbackKindLabels,
  feedbackMaxPhotos,
  feedbackSchema,
  feedbackScreenLabel,
} from '../src/feedback.ts';

test('a message with a kind and text is valid and comes out trimmed', () => {
  const result = feedbackSchema.safeParse({ kind: 'bug', message: '  No guarda la firma  ' });
  assert.ok(result.success);
  assert.equal(result.data.message, 'No guarda la firma');
});

test('a blank message is rejected with a spanish error', () => {
  const result = feedbackSchema.safeParse({ kind: 'idea', message: '   ' });
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, 'Escribe tu comentario');
});

test('a missing kind is rejected with a spanish error', () => {
  const result = feedbackSchema.safeParse({ message: 'Hola' });
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].message, 'Elige si es una falla o una idea');
});

test('messages longer than 4000 characters are rejected', () => {
  const result = feedbackSchema.safeParse({ kind: 'bug', message: 'a'.repeat(4001) });
  assert.equal(result.success, false);
});

test('kinds have spanish labels and the photo limit matches the database', () => {
  assert.deepEqual(feedbackKindLabels, { bug: 'Falla', idea: 'Idea' });
  assert.equal(feedbackMaxPhotos, 5);
});

test('screens are shown with the tab name, and unknown screens as they are', () => {
  assert.equal(feedbackScreenLabel('services'), 'Servicios');
  assert.equal(feedbackScreenLabel('profile'), 'Perfil');
  assert.equal(feedbackScreenLabel('reports/123'), 'reports/123');
});
