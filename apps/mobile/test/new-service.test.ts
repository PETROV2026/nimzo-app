import assert from 'node:assert/strict';
import { test } from 'node:test';

import { serviceChoices } from '../src/service-forms/new-service.ts';

const client = (id: string, name: string, isActive = true) => ({ id, name, isActive });
const branch = (id: string, clientId: string, isActive = true) => ({
  id,
  clientId,
  name: id,
  isActive,
});
const system = (id: string, branchId: string, isActive = true) => ({
  id,
  branchId,
  name: id,
  isActive,
});

const clients = [client('c2', 'Zeta'), client('c1', 'Álamo'), client('c3', 'Inactivo', false)];
const branches = [
  branch('b1', 'c1'),
  branch('b2', 'c2'),
  branch('b3', 'c2'),
  branch('b4', 'c2', false),
];
const systems = [system('s1', 'b2'), system('s2', 'b2', false)];

test('only active clients are offered, sorted by name', () => {
  const choices = serviceChoices(clients, branches, systems, {});
  assert.deepEqual(
    choices.clients.map((item) => item.id),
    ['c1', 'c2'],
  );
  assert.equal(choices.ready, false);
});

test('a client with a single branch gets it chosen automatically', () => {
  const choices = serviceChoices(clients, branches, systems, { clientId: 'c1' });
  assert.equal(choices.branchId, 'b1');
  assert.deepEqual(choices.systems, []);
  assert.equal(choices.ready, true);
});

test('a client with several branches waits for the technician to pick one', () => {
  const choices = serviceChoices(clients, branches, systems, { clientId: 'c2' });
  assert.deepEqual(
    choices.branches.map((item) => item.id),
    ['b2', 'b3'],
  );
  assert.equal(choices.branchId, null);
  assert.equal(choices.ready, false);
});

test('only active systems of the chosen branch are offered and the system is optional', () => {
  const choices = serviceChoices(clients, branches, systems, { clientId: 'c2', branchId: 'b2' });
  assert.deepEqual(
    choices.systems.map((item) => item.id),
    ['s1'],
  );
  assert.equal(choices.systemId, null);
  assert.equal(choices.ready, true);
});

test('a branch or system that does not belong to the choice is dropped', () => {
  const choices = serviceChoices(clients, branches, systems, {
    clientId: 'c2',
    branchId: 'b1',
    systemId: 's1',
  });
  assert.equal(choices.branchId, null);
  assert.equal(choices.systemId, null);
});
