import { randomUUID } from 'expo-crypto';
import type { SQLiteBindValue } from 'expo-sqlite';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';

export type SyncedRow = {
  id: string;
  technician_id: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  sync_error: string | null;
  [column: string]: string | number | null;
};

export type SyncedMeta = {
  id: string;
  technicianId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  syncError: string | null;
};

type Values = Record<string, SQLiteBindValue>;

export function syncedMeta(row: SyncedRow): SyncedMeta {
  return {
    id: row.id,
    technicianId: row.technician_id,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    syncError: row.sync_error,
  };
}

export function createSyncedTable<T>(
  table: 'clients' | 'branches' | 'systems',
  columns: readonly string[],
  fromRow: (row: SyncedRow) => T,
) {
  const store = createTableStore((technicianId) =>
    db
      .getAllSync<SyncedRow>(
        `select * from ${table} where technician_id = ? order by is_active desc, name collate nocase`,
        technicianId,
      )
      .map(fromRow),
  );
  const assignments = columns.map((column) => `${column} = ?`).join(', ');

  function insert(technicianId: string, values: Values) {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.runSync(
      `insert into ${table} (id, technician_id, ${columns.join(', ')}, is_active, created_at, updated_at)
       values (?, ?, ${columns.map(() => '?').join(', ')}, 1, ?, ?)`,
      id,
      technicianId,
      ...columns.map((column) => values[column] ?? null),
      now,
      now,
    );
    store.notify();
    return { id, now };
  }

  function update(id: string, technicianId: string, values: Values) {
    db.runSync(
      `update ${table} set ${assignments}, updated_at = ?, synced_at = null, sync_error = null
       where id = ? and technician_id = ?`,
      ...columns.map((column) => values[column] ?? null),
      new Date().toISOString(),
      id,
      technicianId,
    );
    store.notify();
  }

  function setActive(id: string, technicianId: string, active: boolean) {
    db.runSync(
      `update ${table} set is_active = ?, updated_at = ?, synced_at = null, sync_error = null
       where id = ? and technician_id = ?`,
      active ? 1 : 0,
      new Date().toISOString(),
      id,
      technicianId,
    );
    store.notify();
  }

  function pending(technicianId: string) {
    return db.getAllSync<SyncedRow>(
      `select * from ${table} where technician_id = ? and synced_at is null and sync_error is null`,
      technicianId,
    );
  }

  function payload(row: SyncedRow) {
    return {
      id: row.id,
      technician_id: row.technician_id,
      ...Object.fromEntries(columns.map((column) => [column, row[column] ?? null])),
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  function markSynced(rows: SyncedRow[]) {
    const syncedAt = new Date().toISOString();
    db.withTransactionSync(() => {
      for (const row of rows) {
        db.runSync(
          `update ${table} set synced_at = ? where id = ? and updated_at = ?`,
          syncedAt,
          row.id,
          row.updated_at,
        );
      }
    });
    store.notify();
  }

  function markRejected(row: SyncedRow, reason: string) {
    db.runSync(
      `update ${table} set sync_error = ? where id = ? and updated_at = ?`,
      reason,
      row.id,
      row.updated_at,
    );
    store.notify();
  }

  function clearRejected(technicianId: string) {
    db.runSync(
      `update ${table} set sync_error = null where technician_id = ? and sync_error is not null`,
      technicianId,
    );
    store.notify();
  }

  function applyRemote(technicianId: string, remote: readonly Record<string, unknown>[]) {
    const syncedAt = new Date().toISOString();
    db.withTransactionSync(() => {
      for (const row of remote) {
        db.runSync(
          `insert into ${table} (id, technician_id, ${columns.join(', ')}, is_active, created_at,
             updated_at, synced_at)
           values (?, ?, ${columns.map(() => '?').join(', ')}, ?, ?, ?, ?)
           on conflict (id) do update set ${columns
             .map((column) => `${column} = excluded.${column}`)
             .join(', ')}, is_active = excluded.is_active, updated_at = excluded.updated_at,
             synced_at = excluded.synced_at, sync_error = null
           where ${table}.synced_at is not null`,
          row.id as string,
          technicianId,
          ...columns.map((column) => (row[column] ?? null) as SQLiteBindValue),
          row.is_active ? 1 : 0,
          row.created_at as string,
          row.updated_at as string,
          syncedAt,
        );
      }
      db.runSync(
        `delete from ${table} where technician_id = ? and synced_at is not null
           and id not in (select value from json_each(?))`,
        technicianId,
        JSON.stringify(remote.map((row) => row.id)),
      );
    });
    store.notify();
  }

  return {
    table,
    store,
    insert,
    update,
    setActive,
    pending,
    payload,
    markSynced,
    markRejected,
    clearRejected,
    applyRemote,
  };
}

export type SyncedTable = ReturnType<typeof createSyncedTable>;
