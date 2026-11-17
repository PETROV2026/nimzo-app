import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import {
  applyRemoteClients,
  clientsStore,
  markClientsSynced,
  pendingClients,
} from '@/clients/clients-db';
import {
  applyRemoteBranches,
  branchesStore,
  markBranchesSynced,
  pendingBranches,
} from '@/clients/branches-db';
import {
  applyRemoteSystems,
  markSystemsSynced,
  pendingSystems,
  systemsStore,
} from '@/clients/systems-db';
import { supabase } from '@/lib/supabase';
import { useOnline } from '@/lib/use-online';

export type UploadCounts = { clients: number; branches: number; systems: number };

export type ClientsSyncStatus = {
  state: 'idle' | 'syncing' | 'failed';
  lastSyncedAt: string | null;
  uploaded?: UploadCounts;
};

const retryMs = 30_000;

let status: ClientsSyncStatus = { state: 'idle', lastSyncedAt: null };
const listeners = new Set<() => void>();
let running: Promise<void> | null = null;
let rerun = false;

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

async function upload(technicianId: string) {
  const pending = pendingClients(technicianId);
  if (pending.length === 0) return 0;
  const { error } = await supabase.from('clients').upsert(
    pending.map((client) => ({
      id: client.id,
      technician_id: technicianId,
      name: client.name,
      tax_id: client.tax_id,
      contact_name: client.contact_name,
      contact_email: client.contact_email,
      contact_phone: client.contact_phone,
      notes: client.notes,
      is_active: client.isActive,
      created_at: client.createdAt,
    })),
  );
  if (error) throw error;
  markClientsSynced(pending);
  return pending.length;
}

async function uploadBranches(technicianId: string) {
  const pending = pendingBranches(technicianId);
  if (pending.length === 0) return 0;
  const { error } = await supabase.from('branches').upsert(
    pending.map((branch) => ({
      id: branch.id,
      technician_id: technicianId,
      client_id: branch.clientId,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      contact_name: branch.contact_name,
      contact_email: branch.contact_email,
      contact_phone: branch.contact_phone,
      is_active: branch.isActive,
      created_at: branch.createdAt,
    })),
  );
  if (error) throw error;
  markBranchesSynced(pending);
  return pending.length;
}

async function uploadSystems(technicianId: string) {
  const pending = pendingSystems(technicianId);
  if (pending.length === 0) return 0;
  const { error } = await supabase.from('systems').upsert(
    pending.map((system) => ({
      id: system.id,
      technician_id: technicianId,
      branch_id: system.branchId,
      system_type: system.system_type,
      name: system.name,
      location: system.location,
      notes: system.notes,
      is_active: system.isActive,
      created_at: system.createdAt,
    })),
  );
  if (error) throw error;
  markSystemsSynced(pending);
  return pending.length;
}

async function downloadSystems(technicianId: string) {
  const { data, error } = await supabase
    .from('systems')
    .select(
      'id, technician_id, branch_id, system_type, name, location, notes, is_active, created_at, updated_at',
    )
    .eq('technician_id', technicianId);
  if (error) throw error;
  applyRemoteSystems(technicianId, data);
}

async function downloadBranches(technicianId: string) {
  const { data, error } = await supabase
    .from('branches')
    .select(
      'id, technician_id, client_id, name, address, city, state, contact_name, contact_email, contact_phone, is_active, created_at, updated_at',
    )
    .eq('technician_id', technicianId);
  if (error) throw error;
  applyRemoteBranches(technicianId, data);
}

async function download(technicianId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select(
      'id, technician_id, name, tax_id, contact_name, contact_email, contact_phone, notes, is_active, created_at, updated_at',
    )
    .eq('technician_id', technicianId);
  if (error) throw error;
  applyRemoteClients(technicianId, data);
}

async function run(technicianId: string) {
  setStatus({ state: 'syncing', lastSyncedAt: status.lastSyncedAt });
  const uploaded: UploadCounts = { clients: 0, branches: 0, systems: 0 };
  try {
    do {
      rerun = false;
      uploaded.clients += await upload(technicianId);
      uploaded.branches += await uploadBranches(technicianId);
      uploaded.systems += await uploadSystems(technicianId);
      await download(technicianId);
      await downloadBranches(technicianId);
      await downloadSystems(technicianId);
    } while (rerun);
    setStatus({ state: 'idle', lastSyncedAt: new Date().toISOString(), uploaded });
  } catch {
    setStatus({ state: 'failed', lastSyncedAt: status.lastSyncedAt });
  }
}

export function syncClients(technicianId: string) {
  if (running) {
    rerun = true;
    return running;
  }
  running = run(technicianId).finally(() => {
    running = null;
  });
  return running;
}

function pendingKeyOf(rows: { id: string; updatedAt: string; syncedAt: string | null }[]) {
  return rows
    .filter((row) => !row.syncedAt)
    .map((row) => `${row.id}:${row.updatedAt}`)
    .join(',');
}

export function useClientsSyncStatus() {
  return useSyncExternalStore(subscribeStatus, () => status);
}

export function useClientsSync(technicianId: string) {
  const online = useOnline();
  const pendingClientsKey = useSyncExternalStore(clientsStore.subscribe, () =>
    technicianId ? pendingKeyOf(clientsStore.snapshot(technicianId)) : '',
  );
  const pendingBranchesKey = useSyncExternalStore(branchesStore.subscribe, () =>
    technicianId ? pendingKeyOf(branchesStore.snapshot(technicianId)) : '',
  );
  const pendingSystemsKey = useSyncExternalStore(systemsStore.subscribe, () =>
    technicianId ? pendingKeyOf(systemsStore.snapshot(technicianId)) : '',
  );
  const pendingKey = pendingClientsKey + pendingBranchesKey + pendingSystemsKey;
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

const noRows: never[] = [];

export function usePendingUploads(technicianId: string): UploadCounts {
  const clients = useSyncExternalStore(clientsStore.subscribe, () =>
    technicianId ? clientsStore.snapshot(technicianId) : noRows,
  );
  const branches = useSyncExternalStore(branchesStore.subscribe, () =>
    technicianId ? branchesStore.snapshot(technicianId) : noRows,
  );
  const systems = useSyncExternalStore(systemsStore.subscribe, () =>
    technicianId ? systemsStore.snapshot(technicianId) : noRows,
  );
  return {
    clients: clients.filter((client) => !client.syncedAt).length,
    branches: branches.filter((branch) => !branch.syncedAt).length,
    systems: systems.filter((system) => !system.syncedAt).length,
  };
}

export function describeUploads({ clients, branches, systems }: UploadCounts) {
  const parts = [
    clients ? `${clients} ${clients === 1 ? 'cliente' : 'clientes'}` : null,
    branches ? `${branches} ${branches === 1 ? 'sucursal' : 'sucursales'}` : null,
    systems ? `${systems} ${systems === 1 ? 'sistema' : 'sistemas'}` : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}` : (parts[0] ?? '');
}
