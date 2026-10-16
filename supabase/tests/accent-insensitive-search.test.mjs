import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-0000000000a7';
const TECH = '00000000-0000-0000-0000-0000000000b7';

let db;

const asAdmin = (sql, params) => runAs(db, 'authenticated', ADMIN, sql, params);

async function search(table, term) {
  const { rows } = await db.query(
    `select name from public.${table} where search_text ilike '%' || $1 || '%' order by name`,
    [term],
  );
  return rows.map((row) => row.name);
}

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Búsqueda', role: 'admin' });
  await createUser(db, TECH, { fullName: 'Técnica Peña' });
  await db.query(`update auth.users set email = 'tecnica.pena@ejemplo.com' where id = $1`, [TECH]);
});

describe('accent-insensitive search', () => {
  test('an admin can still create catalogs through the api', async () => {
    assert.ok((await asAdmin(`insert into public.clients (name, tax_id) values ('Construcción Muñoz', 'CMU010101AB1')`)).ok);
    assert.ok((await asAdmin(`insert into public.branches (client_id, name, city) values (1, 'Planta Querétaro', 'Querétaro')`)).ok);
    const system = await asAdmin(
      `insert into public.systems (branch_id, system_type, name, location) values (1, 'fire_pump', 'Cuarto de Bombas', 'Azotea Norte')`,
    );
    assert.ok(system.ok, system.error);
  });

  test('search_text is unaccented and lower case', async () => {
    const { rows } = await db.query('select search_text from public.clients');
    assert.equal(rows[0].search_text, 'construccion munoz cmu010101ab1');
  });

  test('finds clients ignoring accents, ñ and case, and by tax id', async () => {
    assert.deepEqual(await search('clients', 'construccion'), ['Construcción Muñoz']);
    assert.deepEqual(await search('clients', 'munoz'), ['Construcción Muñoz']);
    assert.deepEqual(await search('clients', 'cmu0101'), ['Construcción Muñoz']);
  });

  test('finds branches by name or city and systems by name or location', async () => {
    assert.deepEqual(await search('branches', 'queretaro'), ['Planta Querétaro']);
    assert.deepEqual(await search('systems', 'bombas'), ['Cuarto de Bombas']);
    assert.deepEqual(await search('systems', 'azotea'), ['Cuarto de Bombas']);
  });

  test('profiles created by the auth trigger are searchable by name and email', async () => {
    const byName = await db.query(`select full_name from public.profiles where search_text ilike '%tecnica pena%'`);
    const byEmail = await db.query(`select full_name from public.profiles where search_text ilike '%pena@ejemplo%'`);
    assert.deepEqual(byName.rows.map((row) => row.full_name), ['Técnica Peña']);
    assert.deepEqual(byEmail.rows.map((row) => row.full_name), ['Técnica Peña']);
  });

  test('search_text follows edits', async () => {
    assert.ok((await asAdmin(`update public.clients set name = 'Construcción Ávila' where id = 1`)).ok);
    assert.deepEqual(await search('clients', 'avila'), ['Construcción Ávila']);
    assert.deepEqual(await search('clients', 'munoz'), []);
  });

  test('the edge function (service role) can still rename a profile', async () => {
    const result = await runAs(db, 'service_role', null, `update public.profiles set full_name = 'Técnica Peña Ruiz' where id = $1`, [TECH]);
    assert.ok(result.ok, result.error);
    const { rows } = await db.query('select search_text from public.profiles where id = $1', [TECH]);
    assert.equal(rows[0].search_text, 'tecnica pena ruiz tecnica.pena@ejemplo.com');
  });

  test('search_text cannot be written by hand', async () => {
    const result = await asAdmin(`update public.clients set search_text = 'falso' where id = 1`);
    assert.equal(result.ok, false);
  });

  test('anon still cannot read the tables', async () => {
    const result = await runAs(db, 'anon', null, 'select search_text from public.clients');
    assert.equal(result.ok, false);
  });
});
