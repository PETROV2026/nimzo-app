import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { syncClients, useClientsSyncStatus } from '@/clients/clients-sync';
import { useOnline } from '@/lib/use-online';
import { colors } from '@/theme';

type ClientsSyncStatusProps = {
  technicianId: string;
  pendingCount: number;
};

function pendingLabel(count: number) {
  return count === 1 ? '1 cambio por subir' : `${count} cambios por subir`;
}

export function ClientsSyncStatus({ technicianId, pendingCount }: ClientsSyncStatusProps) {
  const online = useOnline();
  const { state } = useClientsSyncStatus();

  let label = 'Guardados en la nube';
  let retry = false;

  if (state === 'syncing') {
    label = 'Sincronizando…';
  } else if (!online && pendingCount > 0) {
    label = `${pendingLabel(pendingCount)} cuando tengas internet`;
  } else if (state === 'failed') {
    label =
      pendingCount > 0
        ? `No se pudo subir: ${pendingLabel(pendingCount)}`
        : 'No se pudo sincronizar';
    retry = online;
  } else if (pendingCount > 0) {
    label = pendingLabel(pendingCount);
  } else if (!online) {
    label = 'Sin internet; tus cambios se guardan en la tablet';
  }

  const content = (
    <>
      {state === 'syncing' ? <ActivityIndicator size="small" color={colors.muted} /> : null}
      <Text
        className={`flex-1 font-sans-medium text-base ${state === 'failed' ? 'text-destructive' : 'text-muted'}`}
      >
        {label}
      </Text>
      {retry ? (
        <Text className="font-sans-semibold text-base text-primary-strong">Reintentar</Text>
      ) : null}
    </>
  );

  if (retry) {
    return (
      <Pressable
        onPress={() => syncClients(technicianId)}
        accessibilityRole="button"
        accessibilityHint="Vuelve a intentar subir tus clientes"
        className="min-h-14 flex-row items-center gap-2 rounded-lg px-1 active:bg-border"
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View accessibilityLiveRegion="polite" className="min-h-8 flex-row items-center gap-2 px-1">
      {content}
    </View>
  );
}
