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
  `
  create table if not exists branches (
    id text primary key not null,
    technician_id text not null,
    client_id text not null references clients (id),
    name text not null,
    address text,
    city text,
    state text,
    contact_name text,
    contact_email text,
    contact_phone text,
    is_active integer not null default 1,
    created_at text not null,
    updated_at text not null,
    synced_at text
  );
  create index if not exists branches_client_idx on branches (client_id, is_active, name);
  `,
  `
  create table if not exists systems (
    id text primary key not null,
    technician_id text not null,
    branch_id text not null references branches (id),
    system_type text not null,
    name text not null,
    location text,
    notes text,
    is_active integer not null default 1,
    created_at text not null,
    updated_at text not null,
    synced_at text
  );
  create index if not exists systems_branch_idx on systems (branch_id, is_active, name);
  `,
  `
  alter table clients add column sync_error text;
  alter table branches add column sync_error text;
  alter table systems add column sync_error text;
  `,

  `
  create table if not exists service_forms (
    code text primary key not null,
    name text not null,
    subtitle text,
    icon_path text,
    updated_at text not null
  );
  `,
  `
  create table if not exists feedback_outbox (
    id text primary key not null,
    technician_id text not null,
    kind text not null,
    message text not null,
    screen text not null,
    app_version text not null,
    os_version text not null,
    photo_uris text not null default '[]',
    written_at text not null,
    sync_error text
  );
  create index if not exists feedback_outbox_technician_idx on feedback_outbox (technician_id);
  `,

  `
  create table if not exists reports (
    id text primary key not null,
    technician_id text not null,
    client_id text not null,
    branch_id text not null,
    system_id text,
    service_package_id text,
    form_code text not null,
    form_version integer not null,
    status text not null default 'draft' check (status in ('draft', 'pending')),
    answers text not null default '{}',
    snapshot text not null,
    supervisor_name text,
    supervisor_signature_uri text,
    technician_signature_uri text,
    started_at text not null,
    updated_at text not null,
    signed_at text
  );
  create index if not exists reports_technician_idx on reports (technician_id, status, updated_at);
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
