import { createSyncedTable, syncedMeta, type SyncedMeta } from '@/db/synced-table';

export type ClientDetails = {
  name: string;
  tax_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
};

export type LocalClient = ClientDetails & SyncedMeta;

export const clientsTable = createSyncedTable(
  'clients',
  ['name', 'tax_id', 'contact_name', 'contact_email', 'contact_phone', 'notes'],
  (row): LocalClient => ({
    ...syncedMeta(row),
    name: row.name as string,
    tax_id: row.tax_id as string | null,
    contact_name: row.contact_name as string | null,
    contact_email: row.contact_email as string | null,
    contact_phone: row.contact_phone as string | null,
    notes: row.notes as string | null,
  }),
);

export const clientsStore = clientsTable.store;

export function createClient(technicianId: string, details: ClientDetails): LocalClient {
  const { id, now } = clientsTable.insert(technicianId, details);
  return {
    ...details,
    id,
    technicianId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    syncError: null,
  };
}

export function updateClient(id: string, technicianId: string, details: ClientDetails) {
  clientsTable.update(id, technicianId, details);
}

export function setClientActive(id: string, technicianId: string, active: boolean) {
  clientsTable.setActive(id, technicianId, active);
}
