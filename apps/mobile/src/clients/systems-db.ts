import type { SystemType } from '@nimzo/shared';
import { createSyncedTable, syncedMeta, type SyncedMeta } from '@/db/synced-table';

export type SystemDetails = {
  system_type: SystemType;
  name: string;
  location: string | null;
  notes: string | null;
};

export type LocalSystem = SystemDetails & SyncedMeta & { branchId: string };

export const systemsTable = createSyncedTable(
  'systems',
  ['branch_id', 'system_type', 'name', 'location', 'notes'],
  (row): LocalSystem => ({
    ...syncedMeta(row),
    branchId: row.branch_id as string,
    system_type: row.system_type as SystemType,
    name: row.name as string,
    location: row.location as string | null,
    notes: row.notes as string | null,
  }),
);

export const systemsStore = systemsTable.store;

export function createSystem(technicianId: string, branchId: string, details: SystemDetails) {
  systemsTable.insert(technicianId, { ...details, branch_id: branchId });
}

export function updateSystem(
  id: string,
  technicianId: string,
  branchId: string,
  details: SystemDetails,
) {
  systemsTable.update(id, technicianId, { ...details, branch_id: branchId });
}

export function setSystemActive(id: string, technicianId: string, active: boolean) {
  systemsTable.setActive(id, technicianId, active);
}
