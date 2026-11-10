import { matchesSearch } from '@nimzo/shared';
import { useSyncExternalStore } from 'react';
import { clientsSnapshot, subscribeClients, type LocalClient } from '@/clients/clients-db';

export function clientSearchText(client: LocalClient) {
  return [
    client.name,
    client.tax_id ?? '',
    client.contact_name ?? '',
    client.contact_phone ?? '',
    client.contact_email ?? '',
  ].join('\n');
}

export function useClients(technicianId: string, search = '') {
  const clients = useSyncExternalStore(subscribeClients, () => clientsSnapshot(technicianId));
  return search.trim()
    ? clients.filter((client) => matchesSearch(clientSearchText(client), search))
    : clients;
}
