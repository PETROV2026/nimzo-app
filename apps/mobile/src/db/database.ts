import { openDatabaseSync } from 'expo-sqlite';

const migrations = [
  `
  create table if not exists notes (
    id text primary key not null,
    technician_id text not null,
    title text not null default '',
    body text not null default '',
    checklist text not null default '[]',
    client_id text,
    client_name text,
    pinned integer not null default 0,
    color text not null default 'none',
    remind_at text,
    notification_id text,
    created_at text not null,
    updated_at text not null
  );
  create index if not exists notes_technician_idx on notes (technician_id, pinned, updated_at);
  `,
  `
  create table if not exists clients (
    id text primary key not null,
    technician_id text not null,
    name text not null,
    tax_id text,
    contact_name text,
    contact_email text,
    contact_phone text,
    notes text,
    is_active integer not null default 1,
    created_at text not null,
    updated_at text not null,
    synced_at text
  );
  create index if not exists clients_technician_idx on clients (technician_id, is_active, name);
  `,
];

export const db = openDatabaseSync('nimzo.db');

db.execSync('pragma journal_mode = wal');

const applied = db.getFirstSync<{ user_version: number }>('pragma user_version')?.user_version ?? 0;

for (let index = applied; index < migrations.length; index += 1) {
  db.withTransactionSync(() => {
    db.execSync(migrations[index] ?? '');
    db.execSync(`pragma user_version = ${index + 1}`);
  });
}
