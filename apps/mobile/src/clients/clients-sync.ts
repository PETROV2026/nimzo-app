import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import {
  applyRemoteClients,
  clientsSnapshot,
  markClientsSynced,
  pendingClients,
  subscribeClients,
} from '@/clients/clients-db';
import {
  applyRemoteBranches,
  branchesSnapshot,
  markBranchesSynced,
  pendingBranches,
  subscribeBranches,
} from '@/clients/branches-db';
import { supabase } from '@/lib/supabase';
import { useOnline } from '@/lib/use-online';

export type ClientsSyncStatus =
  | { state: 'idle'; lastSyncedAt: string | null }
  | { state: 'syncing'; lastSyncedAt: string | null }
  | { state: 'failed'; lastSyncedAt: string | null };

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
  if (pending.length === 0) return;
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
}

async function uploadBranches(technicianId: string) {
  const pending = pendingBranches(technicianId);
  if (pending.length === 0) return;
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
  try {
    do {
      rerun = false;
      await upload(technicianId);
      await uploadBranches(technicianId);
      await download(technicianId);
      await downloadBranches(technicianId);
    } while (rerun);
    setStatus({ state: 'idle', lastSyncedAt: new Date().toISOString() });
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
  const pendingClientsKey = useSyncExternalStore(subscribeClients, () =>
    technicianId ? pendingKeyOf(clientsSnapshot(technicianId)) : '',
  );
  const pendingBranchesKey = useSyncExternalStore(subscribeBranches, () =>
    technicianId ? pendingKeyOf(branchesSnapshot(technicianId)) : '',
  );
  const pendingKey = pendingClientsKey + pendingBranchesKey;
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
