import { useSyncExternalStore } from 'react';
import { randomUUID } from 'expo-crypto';
import type { LocalBranch } from '@/clients/branches-db';
import type { LocalClient } from '@/clients/clients-db';
import type { LocalSystem } from '@/clients/systems-db';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';
import type { SignaturesValue } from '@/forms/signatures-block';
import { deletePhoto } from '@/lib/save-photo';
import {
  buildSnapshot,
  isFullySigned,
  type LocalReportStatus,
  parseAnswers,
  parseSnapshot,
  type ReportSnapshot,
  selectionProblem,
  unusedSignatureFiles,
} from '@/reports/report-rules';

export type LocalReport = {
  id: string;
  technicianId: string;
  clientId: string;
  branchId: string;
  systemId: string | null;
  servicePackageId: string | null;
  formCode: string;
  formVersion: number;
  status: LocalReportStatus;
  answers: Record<string, unknown>;
  snapshot: ReportSnapshot | null;
  signatures: SignaturesValue;
  startedAt: string;
  updatedAt: string;
  signedAt: string | null;
};

type ReportRow = {
  id: string;
  technician_id: string;
  client_id: string;
  branch_id: string;
  system_id: string | null;
  service_package_id: string | null;
  form_code: string;
  form_version: number;
  status: LocalReportStatus;
  answers: string;
  snapshot: string;
  supervisor_name: string | null;
  supervisor_signature_uri: string | null;
  technician_signature_uri: string | null;
  started_at: string;
  updated_at: string;
  signed_at: string | null;
};

type NewReport = {
  technicianId: string;
  form: { code: string; version: number };
  client: LocalClient;
  branch: LocalBranch;
  system: LocalSystem | null;
  packageId: string | null;
};

function fromRow(row: ReportRow): LocalReport {
  return {
    id: row.id,
    technicianId: row.technician_id,
    clientId: row.client_id,
    branchId: row.branch_id,
    systemId: row.system_id,
    servicePackageId: row.service_package_id,
    formCode: row.form_code,
    formVersion: row.form_version,
    status: row.status,
    answers: parseAnswers(row.answers),
    snapshot: parseSnapshot(row.snapshot),
    signatures: {
      supervisorName: row.supervisor_name ?? '',
      supervisorSignature: row.supervisor_signature_uri,
      technicianSignature: row.technician_signature_uri,
    },
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    signedAt: row.signed_at,
  };
}

function statusStore(status: LocalReportStatus) {
  return createTableStore((technicianId) =>
    db
      .getAllSync<ReportRow>(
        'select * from reports where technician_id = ? and status = ? order by updated_at desc',
        technicianId,
        status,
      )
      .map(fromRow),
  );
}

const stores: Record<LocalReportStatus, ReturnType<typeof statusStore>> = {
  draft: statusStore('draft'),
  pending: statusStore('pending'),
};

function notify() {
  stores.draft.notify();
  stores.pending.notify();
}

export function useReports(technicianId: string, status: LocalReportStatus) {
  const store = stores[status];
  return useSyncExternalStore(store.subscribe, () => store.snapshot(technicianId));
}

export function readReport(id: string) {
  const row = db.getFirstSync<ReportRow>('select * from reports where id = ?', id);
  return row ? fromRow(row) : null;
}

function now() {
  return new Date().toISOString();
}

export function createReport({ technicianId, form, client, branch, system, packageId }: NewReport) {
  const problem = selectionProblem(client, branch, system);
  if (problem) throw new Error(problem);
  const id = randomUUID();
  const time = now();
  db.runSync(
    `insert into reports (id, technician_id, client_id, branch_id, system_id, service_package_id,
       form_code, form_version, snapshot, started_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    technicianId,
    client.id,
    branch.id,
    system?.id ?? null,
    packageId,
    form.code,
    form.version,
    JSON.stringify(buildSnapshot(client, branch, system)),
    time,
    time,
  );
  notify();
  return id;
}

export function changeTarget(
  id: string,
  { client, branch, system }: Pick<NewReport, 'client' | 'branch' | 'system'>,
) {
  const problem = selectionProblem(client, branch, system);
  if (problem) throw new Error(problem);
  const result = db.runSync(
    `update reports set client_id = ?, branch_id = ?, system_id = ?, snapshot = ?, updated_at = ?
     where id = ? and status = 'draft'`,
    client.id,
    branch.id,
    system?.id ?? null,
    JSON.stringify(buildSnapshot(client, branch, system)),
    now(),
    id,
  );
  if (result.changes === 0) return false;
  notify();
  return true;
}

export function saveAnswers(id: string, answers: Record<string, unknown>) {
  const result = db.runSync(
    "update reports set answers = ?, updated_at = ? where id = ? and status = 'draft'",
    JSON.stringify(answers),
    now(),
    id,
  );
  if (result.changes === 0) return false;
  notify();
  return true;
}

export function saveSignatures(id: string, signatures: SignaturesValue) {
  const before = readReport(id);
  if (!before || before.status !== 'draft') return false;
  const time = now();
  const signed = isFullySigned(signatures);
  const sameSignatures =
    before.signatures.supervisorSignature === signatures.supervisorSignature &&
    before.signatures.technicianSignature === signatures.technicianSignature;
  const signedAt = signed ? (sameSignatures && before.signedAt ? before.signedAt : time) : null;
  const result = db.runSync(
    `update reports set supervisor_name = ?, supervisor_signature_uri = ?,
       technician_signature_uri = ?, signed_at = ?, updated_at = ?
     where id = ? and status = 'draft'`,
    signatures.supervisorName.trim() || null,
    signatures.supervisorSignature,
    signatures.technicianSignature,
    signedAt,
    time,
    id,
  );
  if (result.changes === 0) return false;
  for (const uri of unusedSignatureFiles(before.signatures, signatures)) deletePhoto(uri);
  notify();
  return true;
}

export function markPending(id: string) {
  const result = db.runSync(
    "update reports set status = 'pending', updated_at = ? where id = ? and status = 'draft' and signed_at is not null",
    now(),
    id,
  );
  if (result.changes === 0) return false;
  notify();
  return true;
}

export function reopen(id: string) {
  const before = readReport(id);
  const result = db.runSync(
    `update reports set status = 'draft', supervisor_signature_uri = null,
       technician_signature_uri = null, signed_at = null, updated_at = ?
     where id = ? and status = 'pending'`,
    now(),
    id,
  );
  if (result.changes === 0) return false;
  if (before) for (const uri of unusedSignatureFiles(before.signatures, null)) deletePhoto(uri);
  notify();
  return true;
}

export function deleteDraft(id: string) {
  const before = readReport(id);
  const result = db.runSync("delete from reports where id = ? and status = 'draft'", id);
  if (result.changes === 0) return false;
  if (before) for (const uri of unusedSignatureFiles(before.signatures, null)) deletePhoto(uri);
  notify();
  return true;
}
