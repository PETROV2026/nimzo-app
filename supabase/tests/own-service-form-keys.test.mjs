import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { applyMigrationsFrom, createTechnicianCatalog, createTestDb, createUser, runAs } from './harness.mjs';

const MIGRATION = '20261027151738_own_service_form_keys.sql';
const ADMIN = '00000000-0000-0000-0000-0000000000a9';
const TECH = '00000000-0000-0000-0000-0000000000b9';
const REPORT = '00000000-0000-0000-0000-00000000c0f9';

let db;
let pkg;

before(async () => {
  db = await createTestDb({ before: MIGRATION });
  await createUser(db, ADMIN, { fullName: 'Admin Claves', role: 'admin' });
  await createUser(db, TECH, { fullName: 'Tecnico Claves' });
  const { client, branch } = await createTechnicianCatalog(db, TECH, { prefix: 'claves' });
  pkg = (
    await db.query(`insert into public.service_packages (branch_id, frequency) values ($1, 'weekly') returning id`, [branch])
  ).rows[0].id;
  await db.query(
    `insert into public.service_package_forms (package_id, service_form_id)
     select $1, id from public.service_forms where code = 'F-SER-015'`,
    [pkg],
  );
  await db.query(
    `insert into public.reports (id, technician_id, client_id, branch_id, service_form_id, form_code, form_version,
       answers, snapshot, supervisor_name, supervisor_signature_path, technician_signature_path, started_at, signed_at)
     select $1::uuid, $2::uuid, $3, $4, id, code, 1, '{}', '{}', 'Supervisor Demo', $2::text || '/' || $1::text || '/s.png',
       $2::text || '/' || $1::text || '/t.png', now(), now()
     from public.service_forms where code = 'F-SER-013'`,
    [REPORT, TECH, client, branch],
  );
  await applyMigrationsFrom(db, MIGRATION);
});

describe('own service form keys', () => {
  test('every form gets its own key and no F-SER code is left', async () => {
    const { rows } = await db.query('select code, name, subtitle from public.service_forms order by code');
    assert.equal(rows.length, 30);
    assert.ok(rows.every((row) => /^[a-z][a-z0-9_]*$/.test(row.code)));
    const byCode = Object.fromEntries(rows.map((row) => [row.code, `${row.name} · ${row.subtitle ?? ''}`]));
    assert.equal(byCode.diesel_pump_annual, 'Bomba diésel · Anual');
    assert.equal(byCode.control_valves_quarterly, 'Válvulas de control · Trimestral');
    assert.equal(byCode.quote_request, 'Solicitud de cotización · ');
  });

  test('sent reports and package forms keep pointing to the same form', async () => {
    const report = await db.query(
      `select r.form_code, f.code from public.reports r join public.service_forms f on f.id = r.service_form_id where r.id = $1`,
      [REPORT],
    );
    assert.deepEqual(report.rows[0], { form_code: 'diesel_pump_annual', code: 'diesel_pump_annual' });
    const packageForm = await db.query(
      `select f.code from public.service_package_forms p join public.service_forms f on f.id = p.service_form_id
       where p.package_id = $1`,
      [pkg],
    );
    assert.equal(packageForm.rows[0].code, 'diesel_pump_weekly');
  });

  test('sent reports and form keys still cannot change afterwards', async () => {
    const report = await db.query(`update public.reports set form_code = 'x' where id = $1`, [REPORT]).catch((error) => error);
    assert.match(report.message, /cannot be changed/);
    const form = await runAs(db, 'authenticated', ADMIN, `update public.service_forms set code = 'other' where code = 'quote_request'`);
    assert.equal(form.ok, false);
  });

  test('new forms need a snake_case key', async () => {
    const asAdmin = (sql) => runAs(db, 'authenticated', ADMIN, sql);
    assert.equal((await asAdmin(`insert into public.service_forms (code, name) values ('F-SER-112', 'X')`)).ok, false);
    assert.equal((await asAdmin(`insert into public.service_forms (code, name) values ('Smoke Detectors', 'X')`)).ok, false);
    const insert = await asAdmin(`insert into public.service_forms (code, name) values ('smoke_detectors_annual', 'Detectores')`);
    assert.ok(insert.ok, insert.error);
  });
});
