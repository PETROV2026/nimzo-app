import { randomUUID } from 'expo-crypto';
import type { BranchDetails } from '@/clients/branches-db';
import type { ClientDetails } from '@/clients/clients-db';
import { db } from '@/db/database';
import { demoAnswers } from '@/dev/demo-answers';
import { demoSignaturePng } from '@/dev/demo-signature';
import { definitionCodes, getDefinition } from '@/forms/definitions';
import { visibleValues } from '@/forms/form-values';
import { saveSignaturePng } from '@/forms/signature-files';
import { deletePhoto } from '@/lib/save-photo';
import { buildSnapshot } from '@/reports/report-rules';
import { notifyReports } from '@/reports/reports-db';

const demoClient: ClientDetails = {
  name: 'Cliente de prueba',
  tax_id: null,
  contact_name: 'Contacto de prueba',
  contact_email: 'prueba@example.com',
  contact_phone: null,
  notes: null,
};

const demoBranch: BranchDetails = {
  name: 'Sucursal de prueba',
  address: 'Calle de prueba 123',
  city: 'Ciudad de prueba',
  state: null,
  contact_name: null,
  contact_email: null,
  contact_phone: null,
};

type DemoFiles = {
  supervisor_signature_uri: string | null;
  technician_signature_uri: string | null;
};

function clearDemoReports(technicianId: string) {
  const rows = db.getAllSync<DemoFiles>(
    "select supervisor_signature_uri, technician_signature_uri from reports where technician_id = ? and id like 'demo-%'",
    technicianId,
  );
  for (const row of rows) {
    if (row.supervisor_signature_uri) deletePhoto(row.supervisor_signature_uri);
    if (row.technician_signature_uri) deletePhoto(row.technician_signature_uri);
  }
  db.runSync("delete from reports where technician_id = ? and id like 'demo-%'", technicianId);
  return rows.length;
}

export function deleteDemoReports(technicianId: string) {
  const removed = clearDemoReports(technicianId);
  notifyReports();
  return removed;
}

export function createDemoReports(technicianId: string) {
  clearDemoReports(technicianId);
  const snapshot = JSON.stringify(buildSnapshot(demoClient, demoBranch, null));
  const png = demoSignaturePng();
  let created = 0;
  for (const code of definitionCodes) {
    const definition = getDefinition(code);
    if (!definition) continue;
    const time = new Date(Date.now() - created * 60_000).toISOString();
    db.runSync(
      `insert into reports (id, technician_id, client_id, branch_id, form_code, form_version, status,
         answers, snapshot, supervisor_name, supervisor_signature_uri, technician_signature_uri,
         started_at, updated_at, signed_at)
       values (?, ?, 'demo-client', 'demo-branch', ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
      `demo-${randomUUID()}`,
      technicianId,
      code,
      definition.version,
      JSON.stringify(visibleValues(definition, demoAnswers(definition))),
      snapshot,
      'Supervisor de prueba',
      saveSignaturePng(png),
      saveSignaturePng(png),
      time,
      time,
      time,
    );
    created += 1;
  }
  notifyReports();
  return created;
}
