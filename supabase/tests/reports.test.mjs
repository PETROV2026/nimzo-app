import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, describe, test } from 'node:test';

import { createTechnicianCatalog, createTestDb, createUser, runAs } from './harness.mjs';

const ADMIN = '00000000-0000-0000-0000-0000000000aa';
const TECH_A = '00000000-0000-0000-0000-0000000000ba';
const TECH_B = '00000000-0000-0000-0000-0000000000ca';

let db;
let catalogA;
let catalogB;
let form014;
let form104;
const asAdmin = (sql, params) => runAs(db, 'authenticated', ADMIN, sql, params);
const asTechA = (sql, params) => runAs(db, 'authenticated', TECH_A, sql, params);
const asTechB = (sql, params) => runAs(db, 'authenticated', TECH_B, sql, params);

const COLUMNS = [
  'id',
  'technician_id',
  'client_id',
  'branch_id',
  'system_id',
  'service_form_id',
  'form_code',
  'form_version',
  'answers',
  'snapshot',
  'supervisor_name',
  'supervisor_signature_path',
  'technician_signature_path',
  'started_at',
  'signed_at',
];

function reportRow(technicianId, catalog, overrides = {}) {
  const id = overrides.id ?? randomUUID();
  return {
    id,
    technician_id: technicianId,
    client_id: catalog.client,
    branch_id: catalog.branch,
    system_id: catalog.system,
    service_form_id: form014,
    form_code: 'F-SER-014',
    form_version: 1,
    answers: { vta: 'VTA-1' },
    snapshot: { client: { name: 'Cliente (demo)' }, branch: { name: 'Sucursal (demo)' } },
    supervisor_name: 'Supervisor Ejemplo',
    supervisor_signature_path: `${technicianId}/${id}/supervisor.png`,
    technician_signature_path: `${technicianId}/${id}/technician.png`,
    started_at: '2026-10-26T15:00:00Z',
    signed_at: '2026-10-26T16:00:00Z',
    ...overrides,
  };
}

function insertReport(as, row) {
  const values = COLUMNS.map((column) => row[column]);
  const placeholders = COLUMNS.map((_, index) => `$${index + 1}`).join(', ');
  return as(
    `insert into public.reports (${COLUMNS.join(', ')}) values (${placeholders}) returning folio, sent_at`,
    values,
  );
}

before(async () => {
  db = await createTestDb();
  await createUser(db, ADMIN, { fullName: 'Admin Reportes', role: 'admin' });
  await createUser(db, TECH_A, { fullName: 'Tecnico A' });
  await createUser(db, TECH_B, { fullName: 'Tecnico B' });
  catalogA = await createTechnicianCatalog(db, TECH_A, { prefix: 'A' });
  catalogB = await createTechnicianCatalog(db, TECH_B, { prefix: 'B' });
  const forms = (await db.query(`select code, id from public.service_forms where code in ('F-SER-014', 'F-SER-104')`))
    .rows;
  form014 = forms.find((form) => form.code === 'F-SER-014').id;
  form104 = forms.find((form) => form.code === 'F-SER-104').id;
});

describe('reports', () => {
  let firstReport;

  test('a technician sends a report and gets a folio', async () => {
    firstReport = reportRow(TECH_A, catalogA);
    const first = await insertReport(asTechA, firstReport);
    assert.ok(first.ok, first.error);
    assert.ok(first.rows[0].folio > 0);
    assert.ok(first.rows[0].sent_at);

    const second = await insertReport(asTechA, reportRow(TECH_A, catalogA));
    assert.ok(second.ok, second.error);
    assert.ok(Number(second.rows[0].folio) > Number(first.rows[0].folio));
  });

  test('retrying the same report does not duplicate it', async () => {
    const retry = await insertReport(asTechA, firstReport);
    assert.match(retry.error, /duplicate key/);
    const { rows } = await db.query('select count(*)::int as count from public.reports where id = $1', [
      firstReport.id,
    ]);
    assert.equal(rows[0].count, 1);
  });

  test('technicians only see their own reports', async () => {
    assert.equal((await asTechB('select id from public.reports')).rows.length, 0);
    assert.equal((await asTechA('select id from public.reports')).rows.length, 2);
    assert.equal((await asAdmin('select id from public.reports')).rows.length, 2);
  });

  test('report references must belong to the technician', async () => {
    const foreignBranch = await insertReport(
      asTechA,
      reportRow(TECH_A, { ...catalogA, branch: catalogB.branch, system: null }),
    );
    assert.match(foreignBranch.error, /must belong to the technician/);

    const otherBranch = (
      await db.query(`insert into public.branches (client_id, name) values ($1, 'Otra A') returning id`, [
        catalogA.client,
      ])
    ).rows[0].id;
    const systemFromAnotherBranch = await insertReport(asTechA, reportRow(TECH_A, { ...catalogA, branch: otherBranch }));
    assert.match(systemFromAnotherBranch.error, /system must belong to the branch/);

    const wrongCode = await insertReport(asTechA, reportRow(TECH_A, catalogA, { service_form_id: form104 }));
    assert.match(wrongCode.error, /form_code must match/);

    const foreignPackage = (
      await db.query(`insert into public.service_packages (branch_id, frequency) values ($1, 'weekly') returning id`, [
        catalogB.branch,
      ])
    ).rows[0].id;
    const row = reportRow(TECH_A, catalogA);
    const withForeignPackage = await asTechA(
      `insert into public.reports (${COLUMNS.join(', ')}, service_package_id)
       values (${COLUMNS.map((_, index) => `$${index + 1}`).join(', ')}, $${COLUMNS.length + 1})`,
      [...COLUMNS.map((column) => row[column]), foreignPackage],
    );
    assert.match(withForeignPackage.error, /service package must belong to the branch/);
  });

  test('reports are sent by their own technician only', async () => {
    const forSomeoneElse = await insertReport(asTechA, reportRow(TECH_B, catalogB));
    assert.match(forSomeoneElse.error, /row-level security/);
    const byAdmin = await insertReport(asAdmin, reportRow(TECH_A, catalogA));
    assert.match(byAdmin.error, /row-level security/);
  });

  test("signatures must live in the report's folder", async () => {
    const id = randomUUID();
    const otherReport = await insertReport(
      asTechA,
      reportRow(TECH_A, catalogA, { id, supervisor_signature_path: `${TECH_A}/${randomUUID()}/supervisor.png` }),
    );
    assert.match(otherReport.error, /folder of the report/);
    const otherTechnician = await insertReport(
      asTechA,
      reportRow(TECH_A, catalogA, { id, technician_signature_path: `${TECH_B}/${id}/technician.png` }),
    );
    assert.match(otherTechnician.error, /folder of the report/);
  });

  test('sent reports cannot change, even for the service role', async () => {
    const update = await asTechA(`update public.reports set supervisor_name = 'Otro' where id = $1`, [firstReport.id]);
    assert.equal(update.affected ?? 0, 0);
    const remove = await asTechA('delete from public.reports where id = $1', [firstReport.id]);
    assert.equal(remove.affected ?? 0, 0);
    const adminUpdate = await asAdmin(`update public.reports set supervisor_name = 'Otro' where id = $1`, [
      firstReport.id,
    ]);
    assert.equal(adminUpdate.affected ?? 0, 0);
    await assert.rejects(
      db.query(`update public.reports set answers = '{}' where id = $1`, [firstReport.id]),
      /Sent reports cannot be changed/,
    );
  });

  test('anon cannot read reports', async () => {
    assert.equal((await runAs(db, 'anon', null, 'select id from public.reports')).ok, false);
  });
});

describe('report files', () => {
  const reportId = randomUUID();
  const ownPath = `${TECH_A}/${reportId}/photo-1.jpg`;

  test('the report-files bucket is private', async () => {
    const { rows } = await db.query(`select public from storage.buckets where id = 'report-files'`);
    assert.equal(rows[0].public, false);
  });

  test('technicians only touch their own report files', async () => {
    const upload = await asTechA(`insert into storage.objects (bucket_id, name) values ('report-files', $1)`, [ownPath]);
    assert.ok(upload.ok, upload.error);
    const foreign = await asTechA(`insert into storage.objects (bucket_id, name) values ('report-files', $1)`, [
      `${TECH_B}/${reportId}/photo-1.jpg`,
    ]);
    assert.match(foreign.error, /row-level security/);

    assert.equal((await asTechB(`select name from storage.objects where bucket_id = 'report-files'`)).rows.length, 0);
    assert.equal((await asTechA(`select name from storage.objects where bucket_id = 'report-files'`)).rows.length, 1);
    assert.equal((await asAdmin(`select name from storage.objects where bucket_id = 'report-files'`)).rows.length, 1);

    const overwrite = await asTechA(`update storage.objects set name = $1 where name = $2`, [
      `${TECH_A}/${reportId}/photo-2.jpg`,
      ownPath,
    ]);
    assert.equal(overwrite.affected ?? 0, 0);
    const remove = await asTechA('delete from storage.objects where name = $1', [ownPath]);
    assert.equal(remove.affected ?? 0, 0);
  });
});
