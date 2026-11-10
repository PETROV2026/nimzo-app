import { matchesSearch, mexicanStateLabels } from '@nimzo/shared';
import { useSyncExternalStore } from 'react';
import { branchesSnapshot, subscribeBranches, type LocalBranch } from '@/clients/branches-db';
import { clientsSnapshot, subscribeClients, type LocalClient } from '@/clients/clients-db';

export function branchPlace(branch: LocalBranch) {
  return [branch.city, branch.state ? mexicanStateLabels[branch.state] : null]
    .filter(Boolean)
    .join(', ');
}

export function branchSearchText(branch: LocalBranch) {
  return [branch.name, branch.address ?? '', branchPlace(branch)].join('\n');
}

function clientSearchText(client: LocalClient, branches: LocalBranch[]) {
  return [
    client.name,
    client.tax_id ?? '',
    client.contact_name ?? '',
    client.contact_phone ?? '',
    client.contact_email ?? '',
    ...branches.map(branchSearchText),
  ].join('\n');
}

export function groupByClient(branches: LocalBranch[]) {
  const groups = new Map<string, LocalBranch[]>();
  for (const branch of branches) {
    groups.set(branch.clientId, [...(groups.get(branch.clientId) ?? []), branch]);
  }
  return groups;
}

export function useBranches(technicianId: string) {
  return useSyncExternalStore(subscribeBranches, () => branchesSnapshot(technicianId));
}

export function useClients(technicianId: string, search = '') {
  const clients = useSyncExternalStore(subscribeClients, () => clientsSnapshot(technicianId));
  const branches = useBranches(technicianId);
  if (!search.trim()) return clients;
  const byClient = groupByClient(branches);
  return clients.filter((client) =>
    matchesSearch(clientSearchText(client, byClient.get(client.id) ?? []), search),
  );
}
