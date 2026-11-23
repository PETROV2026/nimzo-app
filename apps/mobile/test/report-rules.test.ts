import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildSnapshot,
  canChangeStatus,
  canDeleteReport,
  isFullySigned,
  parseAnswers,
} from '../src/reports/report-rules.ts';

const client = {
  name: 'Acme',
  tax_id: 'ACM010101AAA',
  contact_name: 'Ana',
  contact_email: 'ana@acme.mx',
  contact_phone: '6861234567',
  notes: 'nota interna',
};

const branch = {
  name: 'Centro',
  address: 'Av. Reforma 1',
  city: 'Mexicali',
  state: null,
  contact_name: null,
  contact_email: null,
  contact_phone: null,
};

const system = {
  system_type: 'fire_pump',
  name: 'Bomba 1',
  location: 'Cuarto de máquinas',
  notes: 'nota interna',
};

test('snapshot keeps client, branch and system data without notes', () => {
  const snapshot = buildSnapshot(client, branch, system);
  assert.deepEqual(snapshot.client, {
    name: 'Acme',
    tax_id: 'ACM010101AAA',
    contact_name: 'Ana',
    contact_email: 'ana@acme.mx',
    contact_phone: '6861234567',
  });
  assert.deepEqual(snapshot.branch, branch);
  assert.deepEqual(snapshot.system, {
    system_type: 'fire_pump',
    name: 'Bomba 1',
    location: 'Cuarto de máquinas',
  });
});

test('snapshot without system stores null', () => {
  assert.equal(buildSnapshot(client, branch, null).system, null);
});

test('draft goes to pending and back to draft', () => {
  assert.equal(canChangeStatus('draft', 'pending'), true);
  assert.equal(canChangeStatus('pending', 'draft'), true);
});

test('a status cannot change to itself', () => {
  assert.equal(canChangeStatus('draft', 'draft'), false);
  assert.equal(canChangeStatus('pending', 'pending'), false);
});

test('only drafts can be deleted', () => {
  assert.equal(canDeleteReport('draft'), true);
  assert.equal(canDeleteReport('pending'), false);
});

test('answers are read from saved JSON', () => {
  assert.deepEqual(parseAnswers('{"temp":25}'), { temp: 25 });
});

test('broken or non-object answers become empty', () => {
  assert.deepEqual(parseAnswers('no es json'), {});
  assert.deepEqual(parseAnswers('[1,2]'), {});
});

test('a report is signed only with both signatures', () => {
  const unsigned = {
    supervisorName: 'Luis',
    supervisorSignatureUri: 'file:///supervisor.png',
    technicianSignatureUri: null,
  };
  assert.equal(isFullySigned(unsigned), false);
  assert.equal(isFullySigned({ ...unsigned, technicianSignatureUri: 'file:///tecnico.png' }), true);
});
