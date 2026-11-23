import { formTitle, systemTypeLabels } from '@nimzo/shared';
import { Stack, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { branchPlace, useBranches, useClients, useSystems } from '@/clients/use-clients';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { Icon, type IconName } from '@/components/icon';
import { Notice } from '@/components/notice';
import { getDefinition } from '@/forms/definitions';
import { FormRenderer } from '@/forms/form-renderer';
import { type FormValues, isEmptyValue } from '@/forms/form-values';
import { useServiceForms } from '@/service-forms/service-forms-db';
import { colors } from '@/theme';

type ServiceParams = { code: string; client?: string; branch?: string; system?: string };

function InfoItem({
  icon,
  label,
  value,
  detail,
}: {
  icon: IconName;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <View className="min-w-56 flex-1 flex-row items-start gap-3">
      <View className="size-10 items-center justify-center rounded-full bg-surface">
        <Icon name={icon} size={20} color={colors.foreground} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-sans text-sm text-muted">{label}</Text>
        <Text className="font-sans-semibold text-lg text-foreground">{value}</Text>
        {detail ? <Text className="font-sans text-sm text-muted">{detail}</Text> : null}
      </View>
    </View>
  );
}

function ServiceHeader({ client, branch, system }: Omit<ServiceParams, 'code'>) {
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const clientRow = useClients(technicianId).find((item) => item.id === client);
  const branchRow = useBranches(technicianId).find((item) => item.id === branch);
  const systemRow = useSystems(technicianId).find((item) => item.id === system);
  if (!clientRow || !branchRow) return null;

  return (
    <View className="flex-row flex-wrap gap-x-8 gap-y-4 rounded-xl border border-border bg-background p-5">
      <InfoItem icon="business-outline" label="Cliente" value={clientRow.name} />
      <InfoItem
        icon="location-outline"
        label="Sucursal"
        value={branchRow.name}
        detail={branchRow.address ?? (branchPlace(branchRow) || undefined)}
      />
      {systemRow ? (
        <InfoItem
          icon="construct-outline"
          label="Sistema"
          value={systemRow.name}
          detail={systemTypeLabels[systemRow.system_type]}
        />
      ) : null}
    </View>
  );
}

export default function FillFormScreen() {
  const { code, client, branch, system } = useLocalSearchParams<ServiceParams>();
  const form = useServiceForms().find((item) => item.code === code);
  const definition = getDefinition(code);
  const [touched, setTouched] = useState(false);
  const [leaving, setLeaving] = useState<(() => void) | null>(null);

  usePreventRemove(touched, ({ repeat }) => setLeaving(() => repeat));

  function track(values: FormValues) {
    setTouched(Object.values(values).some((value) => !isEmptyValue(value)));
  }

  const title = form ? formTitle(form) : 'Formato';

  return (
    <>
      <Stack.Screen options={{ title }} />
      {definition ? (
        <FormRenderer
          definition={definition}
          onValuesChange={track}
          header={
            <>
              <ServiceHeader client={client} branch={branch} system={system} />
              <Notice message="Por ahora lo que llenes aquí no se guarda. Pronto se guardará en este dispositivo para que lo termines después y lo envíes." />
            </>
          }
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
