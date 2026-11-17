import type { MexicanState } from '@nimzo/shared';
import { createSyncedTable, syncedMeta, type SyncedMeta } from '@/db/synced-table';

export type BranchDetails = {
  name: string;
  address: string | null;
  city: string | null;
  state: MexicanState | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

export type LocalBranch = BranchDetails & SyncedMeta & { clientId: string };

export const branchesTable = createSyncedTable(
  'branches',
  [
    'client_id',
    'name',
    'address',
    'city',
    'state',
    'contact_name',
    'contact_email',
    'contact_phone',
  ],
  (row): LocalBranch => ({
    ...syncedMeta(row),
    clientId: row.client_id as string,
    name: row.name as string,
    address: row.address as string | null,
    city: row.city as string | null,
    state: row.state as MexicanState | null,
    contact_name: row.contact_name as string | null,
    contact_email: row.contact_email as string | null,
    contact_phone: row.contact_phone as string | null,
  }),
);

export const branchesStore = branchesTable.store;

export function createBranch(technicianId: string, clientId: string, details: BranchDetails) {
  branchesTable.insert(technicianId, { ...details, client_id: clientId });
}

export function updateBranch(
  id: string,
  technicianId: string,
  clientId: string,
  details: BranchDetails,
) {
  branchesTable.update(id, technicianId, { ...details, client_id: clientId });
}

export function setBranchActive(id: string, technicianId: string, active: boolean) {
  branchesTable.setActive(id, technicianId, active);
}
