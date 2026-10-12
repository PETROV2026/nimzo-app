// Test harness for database migrations and RLS policies.
//
// Runs every migration in supabase/migrations against an in-memory Postgres (PGlite),
// with a minimal stub of what Supabase provides: the anon/authenticated/service_role roles,
// default grants on the public schema, auth.users and auth.uid().
//
// It does not replace testing against a real Supabase project (no GoTrue, Storage or
// Supabase extensions), but it catches SQL errors and permission regressions on every PR.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';

const migrationsDir = join(import.meta.dirname, '..', 'migrations');

const supabaseStub = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key,
    raw_user_meta_data jsonb not null default '{}',
    raw_app_meta_data jsonb not null default '{}'
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
  grant execute on function auth.uid(), auth.jwt() to anon, authenticated, service_role;
`;

/** Creates a fresh database with every migration applied, in filename order. */
export async function createTestDb() {
  const db = new PGlite();
  await db.exec(supabaseStub);
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${error.message}`, { cause: error });
    }
  }
  return db;
}

/** Creates an auth user; the auth trigger creates the matching profile. */
export async function createUser(db, id, { fullName = '', role } = {}) {
  await db.query(
    'insert into auth.users (id, raw_user_meta_data, raw_app_meta_data) values ($1, $2, $3)',
    [id, { full_name: fullName }, role ? { role } : {}],
  );
}

/**
 * Runs a query as a database role, optionally as a signed-in user (`userId` becomes auth.uid()).
 * Returns `{ ok, rows, affected }` or `{ ok: false, error }` instead of throwing,
 * so tests can assert on denied operations.
 */
export async function runAs(db, role, userId, sql, params = []) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? '']);
  await db.exec(`set role ${role}`);
  try {
    const result = await db.query(sql, params);
    return { ok: true, rows: result.rows, affected: result.affectedRows };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    // Back to a system context (no end user), like the SQL editor or a migration.
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}
