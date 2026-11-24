import type { FormDefinition } from '@nimzo/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useBranches, useClients, useSystems } from '@/clients/use-clients';
import { createSignatures, type SignaturesValue } from '@/forms/signatures-block';
import type { FormValues } from '@/forms/form-values';
import { type ReportTarget, resolveTarget } from '@/reports/report-rules';
import {
  changeTarget,
  createReport,
  type LocalReport,
  saveAnswers,
  saveSignatures,
} from '@/reports/reports-db';

const saveDelayMs = 600;

type ReportDraftOptions = {
  technicianId: string;
  definition: FormDefinition | undefined;
  target: ReportTarget | null;
  editingTarget: boolean;
  initial: LocalReport | null;
  profileSignaturePath: string | null;
};

function sameTarget(a: ReportTarget | null, b: ReportTarget) {
  return a?.clientId === b.clientId && a.branchId === b.branchId && a.systemId === b.systemId;
}

export function useReportDraft({
  technicianId,
  definition,
  target,
  editingTarget,
  initial,
  profileSignaturePath,
}: ReportDraftOptions) {
  const clients = useClients(technicianId);
  const branches = useBranches(technicianId);
  const systems = useSystems(technicianId);
  const [reportId, setReportId] = useState(initial?.id ?? null);
  const [signatures, setSignatures] = useState<SignaturesValue | null>(initial?.signatures ?? null);
  const reportRef = useRef(initial?.id ?? null);
  const savedTarget = useRef<ReportTarget | null>(
    initial
      ? { clientId: initial.clientId, branchId: initial.branchId, systemId: initial.systemId }
      : null,
  );
  const latest = useRef<FormValues | null>(null);
  const lastSaved = useRef(initial ? JSON.stringify(initial.answers) : null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const id = reportRef.current;
    if (!id || !latest.current) return;
    const text = JSON.stringify(latest.current);
    if (text !== lastSaved.current) {
      saveAnswers(id, latest.current);
      lastSaved.current = text;
    }
    latest.current = null;
  }, []);

  useEffect(() => {
    if (!definition || editingTarget || !target || !technicianId) return;
    if (reportRef.current && sameTarget(savedTarget.current, target)) return;
    const resolved = resolveTarget(target, clients, branches, systems);
    if (!resolved) return;
    if (reportRef.current) {
      changeTarget(reportRef.current, resolved);
    } else {
      const id = createReport({
        technicianId,
        form: { code: definition.code, version: definition.version },
        ...resolved,
        packageId: null,
      });
      const fresh = createSignatures(profileSignaturePath);
      saveSignatures(id, fresh);
      reportRef.current = id;
      setReportId(id);
      setSignatures(fresh);
      if (latest.current) flush();
    }
    savedTarget.current = target;
  }, [
    branches,
    clients,
    definition,
    editingTarget,
    flush,
    profileSignaturePath,
    systems,
    target,
    technicianId,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => {
      subscription.remove();
      flush();
    };
  }, [flush]);

  const saveValues = useCallback(
    (values: FormValues) => {
      latest.current = values;
      if (!reportRef.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, saveDelayMs);
    },
    [flush],
  );

  const changeSignatures = useCallback((next: SignaturesValue) => {
    setSignatures(next);
    if (reportRef.current) saveSignatures(reportRef.current, next);
  }, []);

  return { reportId, signatures, saveValues, changeSignatures, flush };
}
