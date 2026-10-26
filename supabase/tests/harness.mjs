import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';

const migrationsDir = join(import.meta.dirname, '..', 'migrations');

const supabaseStub = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

  create schema extensions;
  grant usage on schema extensions to anon, authenticated, service_role;

  create schema storage;
  grant usage on schema storage to anon, authenticated, service_role;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null,
    owner uuid,
    created_at timestamptz not null default now()
  );
  alter table storage.objects enable row level security;
  grant all on storage.objects to anon, authenticated, service_role;
  grant select on storage.buckets to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key,
    raw_user_meta_data jsonb not null default '{}',
    raw_app_meta_data jsonb not null default '{}',
    email text,
    created_at timestamptz not null default now(),
    last_sign_in_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
  grant execute on function auth.uid(), auth.jwt() to anon, authenticated, service_role;
`;

function migrationFiles() {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

async function applyMigrations(db, files) {
  for (const file of files) {
    try {
      await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${error.message}`, { cause: error });
    }
  }
}

export async function createTestDb({ before } = {}) {
  const db = new PGlite({ extensions: { pg_trgm, unaccent } });
  await db.exec(supabaseStub);
  await applyMigrations(
    db,
    migrationFiles().filter((file) => !before || file < before),
  );
  return db;
}

export async function applyMigrationsFrom(db, first) {
  await applyMigrations(
    db,
    migrationFiles().filter((file) => file >= first),
  );
}

export async function createUser(db, id, { fullName = '', role } = {}) {
  await db.query(
    'insert into auth.users (id, raw_user_meta_data, raw_app_meta_data) values ($1, $2, $3)',
    [id, { full_name: fullName }, role ? { role } : {}],
  );
}

export async function runAs(db, role, userId, sql, params = []) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? '']);
  await db.exec(`set role ${role}`);
  try {
    const result = await db.query(sql, params);
    return { ok: true, rows: result.rows, affected: result.affectedRows };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}

export async function createTechnicianCatalog(db, technicianId, { prefix = '' } = {}) {
  const client = (
    await db.query(`insert into public.clients (name, technician_id) values ($1, $2) returning id`, [
      `Cliente ${prefix} (demo)`.trim(),
      technicianId,
    ])
  ).rows[0].id;
  const branch = (
    await db.query(
      `insert into public.branches (client_id, name, technician_id) values ($1, $2, $3) returning id`,
      [client, `Sucursal ${prefix}`.trim(), technicianId],
    )
  ).rows[0].id;
  const system = (
    await db.query(
      `insert into public.systems (branch_id, system_type, name, technician_id)
       values ($1, 'sprinkler', $2, $3) returning id`,
      [branch, `Rociadores ${prefix}`.trim(), technicianId],
    )
  ).rows[0].id;
  return { client, branch, system };
}
