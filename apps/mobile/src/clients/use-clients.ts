import { matchesSearch, mexicanStateLabels } from '@nimzo/shared';
import { useSyncExternalStore } from 'react';
import { branchesStore, type LocalBranch } from '@/clients/branches-db';
import { clientsStore, type LocalClient } from '@/clients/clients-db';
import { systemsStore } from '@/clients/systems-db';

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
  return useSyncExternalStore(branchesStore.subscribe, () => branchesStore.snapshot(technicianId));
}

export function useSystems(technicianId: string) {
  return useSyncExternalStore(systemsStore.subscribe, () => systemsStore.snapshot(technicianId));
}

export function useClients(technicianId: string, search = '') {
  const clients = useSyncExternalStore(clientsStore.subscribe, () =>
    clientsStore.snapshot(technicianId),
  );
  const branches = useBranches(technicianId);
  if (!search.trim()) return clients;
  const byClient = groupByClient(branches);
  return clients.filter((client) =>
    matchesSearch(clientSearchText(client, byClient.get(client.id) ?? []), search),
  );
}
