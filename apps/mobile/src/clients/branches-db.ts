import type { BranchFormValues, MexicanState } from '@nimzo/shared';
import { randomUUID } from 'expo-crypto';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';

export type BranchDetails = Omit<BranchFormValues, 'is_active'>;

export type LocalBranch = BranchDetails & {
  id: string;
  technicianId: string;
  clientId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
};

type BranchRow = {
  id: string;
  technician_id: string;
  client_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
};

function fromRow(row: BranchRow): LocalBranch {
  return {
    id: row.id,
    technicianId: row.technician_id,
    clientId: row.client_id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state as MexicanState | null,
    contact_name: row.contact_name,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
  };
}

export const branchesStore = createTableStore((technicianId) =>
  db
    .getAllSync<BranchRow>(
      'select * from branches where technician_id = ? order by is_active desc, name collate nocase',
      technicianId,
    )
    .map(fromRow),
);

export function createBranch(
  technicianId: string,
  clientId: string,
  details: BranchDetails,
): LocalBranch {
  const now = new Date().toISOString();
  const id = randomUUID();
  db.runSync(
    `insert into branches (id, technician_id, client_id, name, address, city, state,
       contact_name, contact_email, contact_phone, is_active, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    id,
    technicianId,
    clientId,
    details.name,
    details.address,
    details.city,
    details.state,
    details.contact_name,
    details.contact_email,
    details.contact_phone,
    now,
    now,
  );
  branchesStore.notify();
  return {
    ...details,
    id,
    technicianId,
    clientId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  };
}

export function updateBranch(id: string, technicianId: string, details: BranchDetails) {
  db.runSync(
    `update branches set name = ?, address = ?, city = ?, state = ?, contact_name = ?,
       contact_email = ?, contact_phone = ?, updated_at = ?, synced_at = null
     where id = ? and technician_id = ?`,
    details.name,
    details.address,
    details.city,
    details.state,
    details.contact_name,
    details.contact_email,
    details.contact_phone,
    new Date().toISOString(),
    id,
    technicianId,
  );
  branchesStore.notify();
}

export function setBranchActive(id: string, technicianId: string, active: boolean) {
  db.runSync(
    `update branches set is_active = ?, updated_at = ?, synced_at = null
     where id = ? and technician_id = ?`,
    active ? 1 : 0,
    new Date().toISOString(),
    id,
    technicianId,
  );
  branchesStore.notify();
}

export function pendingBranches(technicianId: string) {
  return db
    .getAllSync<BranchRow>(
      'select * from branches where technician_id = ? and synced_at is null',
      technicianId,
    )
    .map(fromRow);
}

export function markBranchesSynced(branches: LocalBranch[]) {
  const syncedAt = new Date().toISOString();
  db.withTransactionSync(() => {
    for (const branch of branches) {
      db.runSync(
        'update branches set synced_at = ? where id = ? and updated_at = ?',
        syncedAt,
        branch.id,
        branch.updatedAt,
      );
    }
  });
  branchesStore.notify();
}

export type RemoteBranch = Omit<BranchRow, 'is_active' | 'synced_at'> & { is_active: boolean };

export function applyRemoteBranches(technicianId: string, remote: RemoteBranch[]) {
  const syncedAt = new Date().toISOString();
  db.withTransactionSync(() => {
    for (const row of remote) {
      db.runSync(
        `insert into branches (id, technician_id, client_id, name, address, city, state,
           contact_name, contact_email, contact_phone, is_active, created_at, updated_at, synced_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         on conflict (id) do update set
           client_id = excluded.client_id, name = excluded.name, address = excluded.address,
           city = excluded.city, state = excluded.state, contact_name = excluded.contact_name,
           contact_email = excluded.contact_email, contact_phone = excluded.contact_phone,
           is_active = excluded.is_active, updated_at = excluded.updated_at,
           synced_at = excluded.synced_at
         where branches.synced_at is not null`,
        row.id,
        technicianId,
        row.client_id,
        row.name,
        row.address,
        row.city,
        row.state,
        row.contact_name,
        row.contact_email,
        row.contact_phone,
        row.is_active ? 1 : 0,
        row.created_at,
        row.updated_at,
        syncedAt,
      );
    }
    db.runSync(
      `delete from branches where technician_id = ? and synced_at is not null
         and id not in (select value from json_each(?))`,
      technicianId,
      JSON.stringify(remote.map((row) => row.id)),
    );
  });
  branchesStore.notify();
}
