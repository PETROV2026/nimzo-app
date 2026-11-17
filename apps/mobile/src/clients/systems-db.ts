import type { SystemType } from '@nimzo/shared';
import { randomUUID } from 'expo-crypto';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';

export type SystemDetails = {
  system_type: SystemType;
  name: string;
  location: string | null;
  notes: string | null;
};

export type LocalSystem = SystemDetails & {
  id: string;
  technicianId: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
};

type SystemRow = {
  id: string;
  technician_id: string;
  branch_id: string;
  system_type: string;
  name: string;
  location: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
};

function fromRow(row: SystemRow): LocalSystem {
  return {
    id: row.id,
    technicianId: row.technician_id,
    branchId: row.branch_id,
    system_type: row.system_type as SystemType,
    name: row.name,
    location: row.location,
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
  };
}

export const systemsStore = createTableStore((technicianId) =>
  db
    .getAllSync<SystemRow>(
      'select * from systems where technician_id = ? order by is_active desc, name collate nocase',
      technicianId,
    )
    .map(fromRow),
);

export function createSystem(technicianId: string, branchId: string, details: SystemDetails) {
  const now = new Date().toISOString();
  db.runSync(
    `insert into systems (id, technician_id, branch_id, system_type, name, location, notes,
       is_active, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    randomUUID(),
    technicianId,
    branchId,
    details.system_type,
    details.name,
    details.location,
    details.notes,
    now,
    now,
  );
  systemsStore.notify();
}

export function updateSystem(id: string, technicianId: string, details: SystemDetails) {
  db.runSync(
    `update systems set system_type = ?, name = ?, location = ?, notes = ?, updated_at = ?,
       synced_at = null
     where id = ? and technician_id = ?`,
    details.system_type,
    details.name,
    details.location,
    details.notes,
    new Date().toISOString(),
    id,
    technicianId,
  );
  systemsStore.notify();
}

export function setSystemActive(id: string, technicianId: string, active: boolean) {
  db.runSync(
    `update systems set is_active = ?, updated_at = ?, synced_at = null
     where id = ? and technician_id = ?`,
    active ? 1 : 0,
    new Date().toISOString(),
    id,
    technicianId,
  );
  systemsStore.notify();
}

export function pendingSystems(technicianId: string) {
  return db
    .getAllSync<SystemRow>(
      'select * from systems where technician_id = ? and synced_at is null',
      technicianId,
    )
    .map(fromRow);
}

export function markSystemsSynced(systems: LocalSystem[]) {
  const syncedAt = new Date().toISOString();
  db.withTransactionSync(() => {
    for (const system of systems) {
      db.runSync(
        'update systems set synced_at = ? where id = ? and updated_at = ?',
        syncedAt,
        system.id,
        system.updatedAt,
      );
    }
  });
  systemsStore.notify();
}

export type RemoteSystem = Omit<SystemRow, 'is_active' | 'synced_at'> & { is_active: boolean };

export function applyRemoteSystems(technicianId: string, remote: RemoteSystem[]) {
  const syncedAt = new Date().toISOString();
  db.withTransactionSync(() => {
    for (const row of remote) {
      db.runSync(
        `insert into systems (id, technician_id, branch_id, system_type, name, location, notes,
           is_active, created_at, updated_at, synced_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         on conflict (id) do update set
           branch_id = excluded.branch_id, system_type = excluded.system_type,
           name = excluded.name, location = excluded.location, notes = excluded.notes,
           is_active = excluded.is_active, updated_at = excluded.updated_at,
           synced_at = excluded.synced_at
         where systems.synced_at is not null`,
        row.id,
        technicianId,
        row.branch_id,
        row.system_type,
        row.name,
        row.location,
        row.notes,
        row.is_active ? 1 : 0,
        row.created_at,
        row.updated_at,
        syncedAt,
      );
    }
    db.runSync(
      `delete from systems where technician_id = ? and synced_at is not null
         and id not in (select value from json_each(?))`,
      technicianId,
      JSON.stringify(remote.map((row) => row.id)),
    );
  });
  systemsStore.notify();
}
