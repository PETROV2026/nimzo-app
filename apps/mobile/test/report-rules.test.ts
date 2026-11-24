import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildSnapshot,
  canChangeStatus,
  canDeleteReport,
  canFinish,
  isFullySigned,
  parseAnswers,
  parseSnapshot,
  resolveTarget,
  selectionProblem,
  unusedSignatureFiles,
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

test('a report is signed only with the supervisor name and both signatures', () => {
  const signed = {
    supervisorName: 'Luis',
    supervisorSignature: 'file:///supervisor.png',
    technicianSignature: 'file:///tecnico.png',
  };
  assert.equal(isFullySigned(signed), true);
  assert.equal(isFullySigned({ ...signed, technicianSignature: null }), false);
  assert.equal(isFullySigned({ ...signed, supervisorSignature: null }), false);
  assert.equal(isFullySigned({ ...signed, supervisorName: '   ' }), false);
});

test('only a signed draft can be finished', () => {
  assert.equal(canFinish({ status: 'draft', signedAt: '2026-11-23T10:00:00Z' }), true);
  assert.equal(canFinish({ status: 'draft', signedAt: null }), false);
  assert.equal(canFinish({ status: 'pending', signedAt: '2026-11-23T10:00:00Z' }), false);
});

test('a broken snapshot reads as missing instead of failing', () => {
  const snapshot = buildSnapshot(client, branch, null);
  assert.deepEqual(parseSnapshot(JSON.stringify(snapshot)), snapshot);
  assert.equal(parseSnapshot('{"client":'), null);
  assert.equal(parseSnapshot('[]'), null);
});

test('the branch must belong to the client and the system to the branch', () => {
  const chosenClient = { id: 'c1' };
  const chosenBranch = { id: 'b1', clientId: 'c1' };
  assert.equal(selectionProblem(chosenClient, chosenBranch, null), undefined);
  assert.equal(
    selectionProblem(chosenClient, chosenBranch, { id: 's1', branchId: 'b1' }),
    undefined,
  );
  assert.ok(selectionProblem(chosenClient, { id: 'b2', clientId: 'c2' }, null));
  assert.ok(selectionProblem(chosenClient, chosenBranch, { id: 's2', branchId: 'b9' }));
});

test('signature files no longer used are listed for deletion', () => {
  const before = {
    supervisorName: 'Luis',
    supervisorSignature: 'file:///a.png',
    technicianSignature: 'file:///b.png',
  };
  assert.deepEqual(
    unusedSignatureFiles(before, { ...before, supervisorSignature: 'file:///c.png' }),
    ['file:///a.png'],
  );
  assert.deepEqual(unusedSignatureFiles(before, before), []);
  assert.deepEqual(unusedSignatureFiles(before, null), ['file:///a.png', 'file:///b.png']);
});

test('the chosen client, branch and system are found in the catalog', () => {
  const clients = [{ id: 'c1' }, { id: 'c2' }];
  const branches = [{ id: 'b1', clientId: 'c1' }];
  const systems = [{ id: 's1', branchId: 'b1' }];
  assert.deepEqual(
    resolveTarget({ clientId: 'c1', branchId: 'b1', systemId: 's1' }, clients, branches, systems),
    { client: clients[0], branch: branches[0], system: systems[0] },
  );
  assert.deepEqual(
    resolveTarget({ clientId: 'c1', branchId: 'b1', systemId: null }, clients, branches, systems),
    { client: clients[0], branch: branches[0], system: null },
  );
});

test('a target that is not in the catalog is not resolved', () => {
  const clients = [{ id: 'c1' }];
  const branches = [{ id: 'b1', clientId: 'c1' }];
  assert.equal(
    resolveTarget({ clientId: 'c9', branchId: 'b1', systemId: null }, clients, branches, []),
    null,
  );
  assert.equal(
    resolveTarget({ clientId: 'c1', branchId: 'b9', systemId: null }, clients, branches, []),
    null,
  );
  assert.equal(
    resolveTarget({ clientId: 'c1', branchId: 'b1', systemId: 's9' }, clients, branches, []),
    null,
  );
});
