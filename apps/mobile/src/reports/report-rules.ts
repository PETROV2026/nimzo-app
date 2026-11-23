import type { ReportStatus } from '@nimzo/shared';
import type { BranchDetails } from '@/clients/branches-db';
import type { ClientDetails } from '@/clients/clients-db';
import type { SystemDetails } from '@/clients/systems-db';
import type { SignaturesValue } from '@/forms/signatures-block';

export type LocalReportStatus = Exclude<ReportStatus, 'sent'>;

const clientKeys = ['name', 'tax_id', 'contact_name', 'contact_email', 'contact_phone'] as const;
const branchKeys = [
  'name',
  'address',
  'city',
  'state',
  'contact_name',
  'contact_email',
  'contact_phone',
] as const;
const systemKeys = ['system_type', 'name', 'location'] as const;

export type ReportSnapshot = {
  client: Pick<ClientDetails, (typeof clientKeys)[number]>;
  branch: Pick<BranchDetails, (typeof branchKeys)[number]>;
  system: Pick<SystemDetails, (typeof systemKeys)[number]> | null;
};

function pick<T, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((key) => [key, source[key]])) as Pick<T, K>;
}

export function buildSnapshot(
  client: ClientDetails,
  branch: BranchDetails,
  system: SystemDetails | null,
): ReportSnapshot {
  return {
    client: pick(client, clientKeys),
    branch: pick(branch, branchKeys),
    system: system ? pick(system, systemKeys) : null,
  };
}

const allowedChange: Record<LocalReportStatus, LocalReportStatus> = {
  draft: 'pending',
  pending: 'draft',
};

export function canChangeStatus(from: LocalReportStatus, to: LocalReportStatus) {
  return allowedChange[from] === to;
}

export function canDeleteReport(status: LocalReportStatus) {
  return status === 'draft';
}

export function parseAnswers(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function isFullySigned(signatures: SignaturesValue) {
  return Boolean(
    signatures.supervisorName.trim() &&
    signatures.supervisorSignature &&
    signatures.technicianSignature,
  );
}

export function canFinish(report: { status: LocalReportStatus; signedAt: string | null }) {
  return report.status === 'draft' && report.signedAt !== null;
}

export function parseSnapshot(value: string): ReportSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const snapshot = parsed as Partial<ReportSnapshot>;
    return snapshot.client && snapshot.branch ? (snapshot as ReportSnapshot) : null;
  } catch {
    return null;
  }
}

export function selectionProblem(
  client: { id: string },
  branch: { id: string; clientId: string },
  system: { branchId: string } | null,
) {
  if (branch.clientId !== client.id) return 'La sucursal no pertenece al cliente.';
  if (system && system.branchId !== branch.id) return 'El sistema no pertenece a la sucursal.';
  return undefined;
}

export function unusedSignatureFiles(before: SignaturesValue, after: SignaturesValue | null) {
  const kept = new Set([after?.supervisorSignature, after?.technicianSignature]);
  return [before.supervisorSignature, before.technicianSignature].filter(
    (uri): uri is string => Boolean(uri) && !kept.has(uri),
  );
}
