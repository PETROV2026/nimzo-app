import { formTitle } from '@nimzo/shared';
import { Stack, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { Notice } from '@/components/notice';
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
import { type FormValues, isEmptyValue } from '@/forms/form-values';
import { useServiceForms } from '@/service-forms/service-forms-db';

type ServiceParams = { code: string; client?: string; branch?: string; system?: string };

function initialTarget({ client, branch, system }: ServiceParams): ServiceTarget | null {
  return client && branch ? { clientId: client, branchId: branch, systemId: system ?? null } : null;
}

export default function FillFormScreen() {
  const params = useLocalSearchParams<ServiceParams>();
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const form = useServiceForms().find((item) => item.code === params.code);
  const definition = getDefinition(params.code);
  const [target, setTarget] = useState<ServiceTarget | null>(() => initialTarget(params));
  const [editing, setEditing] = useState(() => initialTarget(params) === null);
  const [answered, setAnswered] = useState(false);
  const [leaving, setLeaving] = useState<(() => void) | null>(null);
  const targetComplete = useServiceTargetComplete(technicianId, target);
  const complete = targetComplete && !editing;

  usePreventRemove(answered || target !== null, ({ repeat }) => setLeaving(() => repeat));

  function track(values: FormValues) {
    setAnswered(Object.values(values).some((value) => !isEmptyValue(value)));
  }

  const title = form ? formTitle(form) : 'Formato';

  return (
    <>
      <Stack.Screen options={{ title }} />
      {definition && technicianId ? (
        <FormRenderer
          definition={definition}
          onValuesChange={track}
          header={
            <Notice message="Por ahora lo que llenes aquí no se guarda. Pronto se guardará en este dispositivo para que lo termines después y lo envíes." />
          }
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
          message="Lo que llenaste se va a perder, porque todavía no se guarda."
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
