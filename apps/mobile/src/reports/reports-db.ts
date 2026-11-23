import { useSyncExternalStore } from 'react';
import { randomUUID } from 'expo-crypto';
import type { BranchDetails } from '@/clients/branches-db';
import type { ClientDetails } from '@/clients/clients-db';
import type { SystemDetails } from '@/clients/systems-db';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';
import {
  buildSnapshot,
  canChangeStatus,
  canDeleteReport,
  isFullySigned,
  parseAnswers,
  type LocalReportStatus,
  type ReportSignatures,
  type ReportSnapshot,
} from '@/reports/report-rules';

export type LocalReport = ReportSignatures & {
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
  snapshot: ReportSnapshot;
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
  client: ClientDetails & { id: string };
  branch: BranchDetails & { id: string };
  system: (SystemDetails & { id: string }) | null;
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
    snapshot: JSON.parse(row.snapshot) as ReportSnapshot,
    supervisorName: row.supervisor_name,
    supervisorSignatureUri: row.supervisor_signature_uri,
    technicianSignatureUri: row.technician_signature_uri,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    signedAt: row.signed_at,
  };
}

const reportsStore = createTableStore((technicianId) =>
  db
    .getAllSync<ReportRow>(
      'select * from reports where technician_id = ? order by updated_at desc',
      technicianId,
    )
    .map(fromRow),
);

export function useReports(technicianId: string, status: LocalReportStatus) {
  const reports = useSyncExternalStore(reportsStore.subscribe, () =>
    reportsStore.snapshot(technicianId),
  );
  return reports.filter((report) => report.status === status);
}

function statusOf(id: string) {
  return db.getFirstSync<{ status: LocalReportStatus }>(
    'select status from reports where id = ?',
    id,
  )?.status;
}

function changeStatus(id: string, to: LocalReportStatus) {
  const from = statusOf(id);
  if (!from || !canChangeStatus(from, to)) return false;
  db.runSync(
    'update reports set status = ?, updated_at = ? where id = ?',
    to,
    new Date().toISOString(),
    id,
  );
  reportsStore.notify();
  return true;
}

export function createReport({ technicianId, form, client, branch, system, packageId }: NewReport) {
  const id = randomUUID();
  const now = new Date().toISOString();
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
    now,
    now,
  );
  reportsStore.notify();
  return id;
}

export function saveAnswers(id: string, answers: Record<string, unknown>) {
  db.runSync(
    "update reports set answers = ?, updated_at = ? where id = ? and status = 'draft'",
    JSON.stringify(answers),
    new Date().toISOString(),
    id,
  );
  reportsStore.notify();
}

export function saveSignatures(id: string, signatures: ReportSignatures) {
  const now = new Date().toISOString();
  db.runSync(
    `update reports set supervisor_name = ?, supervisor_signature_uri = ?,
       technician_signature_uri = ?, signed_at = ?, updated_at = ?
     where id = ? and status = 'draft'`,
    signatures.supervisorName,
    signatures.supervisorSignatureUri,
    signatures.technicianSignatureUri,
    isFullySigned(signatures) ? now : null,
    now,
    id,
  );
  reportsStore.notify();
}

export function markPending(id: string) {
  return changeStatus(id, 'pending');
}

export function reopen(id: string) {
  return changeStatus(id, 'draft');
}

export function deleteDraft(id: string) {
  const status = statusOf(id);
  if (!status || !canDeleteReport(status)) return false;
  db.runSync('delete from reports where id = ?', id);
  reportsStore.notify();
  return true;
}
