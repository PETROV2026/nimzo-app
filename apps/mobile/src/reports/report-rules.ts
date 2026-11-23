import type { ReportStatus } from '@nimzo/shared';
import type { BranchDetails } from '@/clients/branches-db';
import type { ClientDetails } from '@/clients/clients-db';
import type { SystemDetails } from '@/clients/systems-db';

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

export type ReportSignatures = {
  supervisorName: string | null;
  supervisorSignatureUri: string | null;
  technicianSignatureUri: string | null;
};

export function isFullySigned(signatures: ReportSignatures) {
  return Boolean(signatures.supervisorSignatureUri && signatures.technicianSignatureUri);
}
