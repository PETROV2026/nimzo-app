import { formTitle } from '@nimzo/shared';
import { router, Stack, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { announce } from '@/components/announcement-toast';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import {
  EditServiceButton,
  PendingServiceBadge,
  ServicePicker,
  ServiceSummary,
  type ServiceTarget,
  useServiceTargetComplete,
} from '@/components/service-forms/service-client-section';
import { getDefinition } from '@/forms/definitions';
import { FormRenderer } from '@/forms/form-renderer';
import { type FormValues, hasAnswer, visibleValues } from '@/forms/form-values';
import { SignaturesBlock, validateSignatures } from '@/forms/signatures-block';
import { isFullySigned } from '@/reports/report-rules';
import {
  type LocalReport,
  markPending,
  readReport,
  reopen,
  saveAnswers,
} from '@/reports/reports-db';
import { useReportDraft } from '@/reports/use-report-draft';
import { useServiceForms } from '@/service-forms/service-forms-db';
import { colors } from '@/theme';

type ServiceParams = {
  code: string;
  client?: string;
  branch?: string;
  system?: string;
  report?: string;
};

function initialTarget(
  { client, branch, system }: ServiceParams,
  report: LocalReport | null,
): ServiceTarget | null {
  if (report) {
    return { clientId: report.clientId, branchId: report.branchId, systemId: report.systemId };
  }
  return client && branch ? { clientId: client, branchId: branch, systemId: system ?? null } : null;
}

function FinishedReport({ onReopen }: { onReopen: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-canvas p-8">
      <Icon name="checkmark-circle-outline" size={64} color={colors['primary-strong']} />
      <View className="max-w-[480px] gap-2">
        <Text className="text-center font-sans-bold text-xl text-foreground">
          Este reporte ya está terminado
        </Text>
        <Text className="text-center font-sans text-base text-muted">
          Para cambiarlo, reábrelo. Se borrarán las dos firmas y tendrán que firmar otra vez.
        </Text>
      </View>
      <View className="flex-row gap-3">
        <Button variant="secondary" label="Volver" onPress={() => router.back()} />
        <Button label="Reabrir" icon="create-outline" onPress={onReopen} />
      </View>
    </View>
  );
}

export default function FillFormScreen() {
  const params = useLocalSearchParams<ServiceParams>();
  const form = useServiceForms().find((item) => item.code === params.code);
  const [initial, setInitial] = useState(() => (params.report ? readReport(params.report) : null));
  const title = form ? formTitle(form) : 'Formato';

  if (initial?.status === 'pending') {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <FinishedReport
          onReopen={() => {
            reopen(initial.id);
            setInitial(readReport(initial.id));
          }}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ReportForm key={initial?.status ?? 'new'} params={params} initial={initial} />
    </>
  );
}

function ReportForm({ params, initial }: { params: ServiceParams; initial: LocalReport | null }) {
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const profileSignaturePath =
    session.status === 'signed-in' ? (session.profile?.signaturePath ?? null) : null;
  const definition = getDefinition(params.code);
  const [target, setTarget] = useState<ServiceTarget | null>(() => initialTarget(params, initial));
  const [editing, setEditing] = useState(() => initialTarget(params, initial) === null);
  const [answered, setAnswered] = useState(false);
  const [leaving, setLeaving] = useState<(() => void) | null>(null);
  const [signatureErrors, setSignatureErrors] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const targetComplete = useServiceTargetComplete(technicianId, target);
  const complete = targetComplete && !editing;
  const draft = useReportDraft({
    technicianId,
    definition,
    target,
    editingTarget: editing,
    initial,
    profileSignaturePath,
  });

  usePreventRemove(answered && !draft.reportId, ({ repeat }) => setLeaving(() => repeat));

  function track(values: FormValues) {
    setAnswered(Object.values(values).some(hasAnswer));
    draft.saveValues(values);
  }

  function finish(values: FormValues) {
    if (!definition || !draft.reportId) return;
    draft.flush();
    saveAnswers(draft.reportId, visibleValues(definition, values));
    if (!markPending(draft.reportId)) {
      setSignatureErrors(true);
      return;
    }
    announce('Reporte terminado', 'Lo encuentras en Pendientes, listo para enviar.');
    router.back();
  }

  const signatures = draft.signatures;

  return (
    <>
      {definition && technicianId ? (
        <FormRenderer
          definition={definition}
          defaultValues={initial?.answers}
          onValuesChange={track}
          onFinish={finish}
          scrollEnabled={!drawing}
          lead={{
            title: 'Cliente y sucursal',
            icon: 'business-outline',
            complete,
            action: complete ? (
              <EditServiceButton onPress={() => setEditing(true)} />
            ) : target ? (
              <View />
            ) : (
              <PendingServiceBadge />
            ),
            children:
              editing || !target || !targetComplete ? (
                <ServicePicker
                  technicianId={technicianId}
                  initial={target}
                  onSave={(next) => {
                    setTarget(next);
                    setEditing(false);
                  }}
                  onCancel={target && targetComplete ? () => setEditing(false) : undefined}
                />
              ) : (
                <ServiceSummary technicianId={technicianId} target={target} />
              ),
          }}
          closing={{
            title: 'Firmas',
            icon: 'create-outline',
            complete: Boolean(signatures && isFullySigned(signatures)),
            onMissing: () => setSignatureErrors(true),
            children: signatures ? (
              <SignaturesBlock
                value={signatures}
                onChange={draft.changeSignatures}
                errors={signatureErrors ? validateSignatures(signatures) : undefined}
                onDrawingChange={setDrawing}
              />
            ) : (
              <Text className="font-sans text-base text-muted">
                Elige primero el cliente y la sucursal. Después podrán firmar aquí.
              </Text>
            ),
          }}
        />
      ) : (
        <EmptyState
          icon="document-text-outline"
          title="Este formato aún no está disponible"
          description="Actualiza la app para poder llenarlo."
        />
      )}
      {leaving ? (
        <ConfirmDialog
          title="¿Salir del formato?"
          message="Lo que llenaste se va a perder, porque aún no eliges el cliente y la sucursal."
          confirmLabel="Salir"
          tone="destructive"
          onClose={() => setLeaving(null)}
          onConfirm={() => {
            const leave = leaving;
            setLeaving(null);
            leave();
          }}
        />
      ) : null}
    </>
  );
}
