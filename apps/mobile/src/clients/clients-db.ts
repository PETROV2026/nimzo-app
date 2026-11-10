import type { ClientFormValues } from '@nimzo/shared';
import { randomUUID } from 'expo-crypto';
import { db } from '@/db/database';

export type ClientDetails = Omit<ClientFormValues, 'is_active'>;

export type LocalClient = ClientDetails & {
  id: string;
  technicianId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
};

type ClientRow = {
  id: string;
  technician_id: string;
  name: string;
  tax_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
};

function fromRow(row: ClientRow): LocalClient {
  return {
    id: row.id,
    technicianId: row.technician_id,
    name: row.name,
    tax_id: row.tax_id,
    contact_name: row.contact_name,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    notes: row.notes,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
  };
}

const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version += 1;
  for (const listener of listeners) listener();
}

export function subscribeClients(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function listClients(technicianId: string) {
  return db
    .getAllSync<ClientRow>(
      'select * from clients where technician_id = ? order by is_active desc, name collate nocase',
      technicianId,
    )
    .map(fromRow);
}

let snapshot: { technicianId: string; version: number; clients: LocalClient[] } | null = null;

export function clientsSnapshot(technicianId: string) {
  if (!snapshot || snapshot.technicianId !== technicianId || snapshot.version !== version) {
    snapshot = { technicianId, version, clients: listClients(technicianId) };
  }
  return snapshot.clients;
}

export function createClient(technicianId: string, details: ClientDetails): LocalClient {
  const now = new Date().toISOString();
  const id = randomUUID();
  db.runSync(
    `insert into clients (id, technician_id, name, tax_id, contact_name, contact_email,
       contact_phone, notes, is_active, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    id,
    technicianId,
    details.name,
    details.tax_id,
    details.contact_name,
    details.contact_email,
    details.contact_phone,
    details.notes,
    now,
    now,
  );
  notify();
  return {
    ...details,
    id,
    technicianId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  };
}

export function updateClient(id: string, technicianId: string, details: ClientDetails) {
  db.runSync(
    `update clients set name = ?, tax_id = ?, contact_name = ?, contact_email = ?,
       contact_phone = ?, notes = ?, updated_at = ?, synced_at = null
     where id = ? and technician_id = ?`,
    details.name,
    details.tax_id,
    details.contact_name,
    details.contact_email,
    details.contact_phone,
    details.notes,
    new Date().toISOString(),
    id,
    technicianId,
  );
  notify();
}

export function setClientActive(id: string, technicianId: string, active: boolean) {
  db.runSync(
    `update clients set is_active = ?, updated_at = ?, synced_at = null
     where id = ? and technician_id = ?`,
    active ? 1 : 0,
    new Date().toISOString(),
    id,
    technicianId,
  );
  notify();
}
