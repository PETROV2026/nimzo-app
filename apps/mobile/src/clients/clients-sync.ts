import type { TablesInsert } from '@nimzo/shared';
import type { PostgrestError } from '@supabase/supabase-js';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { branchesTable } from '@/clients/branches-db';
import { clientsTable } from '@/clients/clients-db';
import { systemsTable } from '@/clients/systems-db';
import type { SyncedMeta } from '@/db/synced-table';
import { reportError } from '@/lib/monitoring';
import { supabase } from '@/lib/supabase';
import { SyncTimeoutError, syncErrorToReport } from '@/lib/sync-errors';
import { useOnline } from '@/lib/use-online';

export type UploadCounts = { clients: number; branches: number; systems: number };

export type ClientsSyncStatus = {
  state: 'idle' | 'syncing' | 'failed';
  lastSyncedAt: string | null;
  uploaded?: UploadCounts;
};

type Page = PromiseLike<{ data: Record<string, unknown>[] | null; error: PostgrestError | null }>;

type SyncEntry = {
  key: keyof UploadCounts;
  local: typeof clientsTable | typeof branchesTable | typeof systemsTable;
  upsert: (rows: object[], signal: AbortSignal) => PromiseLike<{ error: PostgrestError | null }>;
  page: (technicianId: string, from: number, to: number, signal: AbortSignal) => Page;
};

const entries: SyncEntry[] = [
  {
    key: 'clients',
    local: clientsTable,
    upsert: (rows, signal) =>
      supabase
        .from('clients')
        .upsert(rows as TablesInsert<'clients'>[])
        .abortSignal(signal),
    page: (technicianId, from, to, signal) =>
      supabase
        .from('clients')
        .select(
          'id, technician_id, name, tax_id, contact_name, contact_email, contact_phone, notes, is_active, created_at, updated_at',
        )
        .eq('technician_id', technicianId)
        .order('id')
        .range(from, to)
        .abortSignal(signal),
  },
  {
    key: 'branches',
    local: branchesTable,
    upsert: (rows, signal) =>
      supabase
        .from('branches')
        .upsert(rows as TablesInsert<'branches'>[])
        .abortSignal(signal),
    page: (technicianId, from, to, signal) =>
      supabase
        .from('branches')
        .select(
          'id, technician_id, client_id, name, address, city, state, contact_name, contact_email, contact_phone, is_active, created_at, updated_at',
        )
        .eq('technician_id', technicianId)
        .order('id')
        .range(from, to)
        .abortSignal(signal),
  },
  {
    key: 'systems',
    local: systemsTable,
    upsert: (rows, signal) =>
      supabase
        .from('systems')
        .upsert(rows as TablesInsert<'systems'>[])
        .abortSignal(signal),
    page: (technicianId, from, to, signal) =>
      supabase
        .from('systems')
        .select(
          'id, technician_id, branch_id, system_type, name, location, notes, is_active, created_at, updated_at',
        )
        .eq('technician_id', technicianId)
        .order('id')
        .range(from, to)
        .abortSignal(signal),
  },
];

const retryMs = 30_000;
const pageSize = 1000;
const requestTimeoutMs = 15_000;

let status: ClientsSyncStatus = { state: 'idle', lastSyncedAt: null };
const listeners = new Set<() => void>();
let running: Promise<void> | null = null;
let rerun: string | null = null;

function setStatus(next: ClientsSyncStatus) {
  status = next;
  for (const listener of listeners) listener();
}

function subscribeStatus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isRejection(error: PostgrestError) {
  return /^2[23]/.test(error.code) || error.code === '42501' || error.code === 'P0001';
}

async function withTimeout<T>(request: (signal: AbortSignal) => PromiseLike<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const result = await request(controller.signal);
    if (controller.signal.aborted) {
      throw new SyncTimeoutError(requestTimeoutMs);
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

async function upload({ local, upsert }: SyncEntry, technicianId: string) {
  const rows = local.pending(technicianId);
  if (rows.length === 0) return 0;
  const { error } = await withTimeout((signal) => upsert(rows.map(local.payload), signal));
  if (!error) {
    local.markSynced(rows);
    return rows.length;
  }
  if (!isRejection(error)) throw error;
  let uploaded = 0;
  for (const row of rows) {
    const result = await withTimeout((signal) => upsert([local.payload(row)], signal));
    if (!result.error) {
      local.markSynced([row]);
      uploaded += 1;
    } else if (isRejection(result.error)) {
      local.markRejected(row, result.error.code);
    } else {
      throw result.error;
    }
  }
  return uploaded;
}

async function ensureSignedInAs(technicianId: string) {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user.id !== technicianId) throw new Error('The session changed during sync');
}

async function download({ local, page }: SyncEntry, technicianId: string) {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await withTimeout((signal) =>
      page(technicianId, from, from + pageSize - 1, signal),
    );
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  await ensureSignedInAs(technicianId);
  local.applyRemote(technicianId, rows);
}

async function run(technicianId: string) {
  setStatus({ state: 'syncing', lastSyncedAt: status.lastSyncedAt });
  const uploaded: UploadCounts = { clients: 0, branches: 0, systems: 0 };
  try {
    do {
      rerun = null;
      for (const entry of entries) uploaded[entry.key] += await upload(entry, technicianId);
      for (const entry of entries) await download(entry, technicianId);
    } while (rerun === technicianId);
    setStatus({ state: 'idle', lastSyncedAt: new Date().toISOString(), uploaded });
  } catch (error) {
    const report = syncErrorToReport(error, 'Clients sync');
    if (report) reportError(report);
    setStatus({ state: 'failed', lastSyncedAt: status.lastSyncedAt });
  }
}

export function syncClients(technicianId: string): Promise<void> {
  if (running) {
    rerun = technicianId;
    return running;
  }
  running = run(technicianId).finally(() => {
    running = null;
    const next = rerun;
    rerun = null;
    if (next && next !== technicianId) void syncClients(next);
  });
  return running;
}

export function retryRejected(technicianId: string) {
  for (const { local } of entries) local.clearRejected(technicianId);
  return syncClients(technicianId);
}

export function useClientsSyncStatus() {
  return useSyncExternalStore(subscribeStatus, () => status);
}

const noRows: never[] = [];

function useRows(technicianId: string): Record<keyof UploadCounts, SyncedMeta[]> {
  return {
    clients: useSyncExternalStore(clientsTable.store.subscribe, () =>
      technicianId ? clientsTable.store.snapshot(technicianId) : noRows,
    ),
    branches: useSyncExternalStore(branchesTable.store.subscribe, () =>
      technicianId ? branchesTable.store.snapshot(technicianId) : noRows,
    ),
    systems: useSyncExternalStore(systemsTable.store.subscribe, () =>
      technicianId ? systemsTable.store.snapshot(technicianId) : noRows,
    ),
  };
}

function isPending(row: SyncedMeta) {
  return !row.syncedAt && !row.syncError;
}

function isRejected(row: SyncedMeta) {
  return !row.syncedAt && Boolean(row.syncError);
}

function countRows(
  rows: Record<keyof UploadCounts, SyncedMeta[]>,
  keep: (row: SyncedMeta) => boolean,
): UploadCounts {
  return {
    clients: rows.clients.filter(keep).length,
    branches: rows.branches.filter(keep).length,
    systems: rows.systems.filter(keep).length,
  };
}

export function useClientsSync(technicianId: string) {
  const online = useOnline();
  const rows = useRows(technicianId);
  const pendingKey = [...rows.clients, ...rows.branches, ...rows.systems]
    .filter(isPending)
    .map((row) => `${row.id}:${row.updatedAt}`)
    .join(',');
  const { state } = useClientsSyncStatus();

  useEffect(() => {
    if (!technicianId || !online) return;
    syncClients(technicianId);
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') syncClients(technicianId);
    });
    return () => subscription.remove();
  }, [technicianId, online]);

  useEffect(() => {
    if (!technicianId || !online || !pendingKey) return;
    const timer = setTimeout(() => syncClients(technicianId), 1500);
    return () => clearTimeout(timer);
  }, [technicianId, online, pendingKey]);

  useEffect(() => {
    if (!technicianId || !online || state !== 'failed') return;
    const timer = setTimeout(() => syncClients(technicianId), retryMs);
    return () => clearTimeout(timer);
  }, [technicianId, online, state]);
}

export function useUploadCounts(technicianId: string) {
  const rows = useRows(technicianId);
  return { pending: countRows(rows, isPending), rejected: countRows(rows, isRejected) };
}

export function syncLabel(row: SyncedMeta) {
  if (row.syncedAt) return null;
  return row.syncError ? 'No se pudo sincronizar' : 'Pendiente de sincronizar';
}

export function describeUploads({ clients, branches, systems }: UploadCounts) {
  const parts = [
    clients ? `${clients} ${clients === 1 ? 'cliente' : 'clientes'}` : null,
    branches ? `${branches} ${branches === 1 ? 'sucursal' : 'sucursales'}` : null,
    systems ? `${systems} ${systems === 1 ? 'sistema' : 'sistemas'}` : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}` : (parts[0] ?? '');
}
