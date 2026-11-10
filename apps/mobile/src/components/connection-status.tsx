import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import {
  describeUploads,
  syncClients,
  useClientsSyncStatus,
  usePendingUploads,
} from '@/clients/clients-sync';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { Icon } from '@/components/icon';
import { useOnline, useSettledOnline } from '@/lib/use-online';
import { colors } from '@/theme';

const timeFormat = new Intl.DateTimeFormat('es-MX', { timeStyle: 'short' });

type ConnectionStatusProps = {
  tone?: 'header' | 'page';
};

export function ConnectionStatus({ tone = 'header' }: ConnectionStatusProps) {
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const settledOnline = useSettledOnline();
  const online = useOnline();
  const { state, lastSyncedAt } = useClientsSyncStatus();
  const pending = usePendingUploads(technicianId);
  const pendingTotal = pending.clients + pending.branches;
  const [open, setOpen] = useState(false);

  const syncing = state === 'syncing' && pendingTotal > 0;
  if (settledOnline && pendingTotal === 0) return null;

  const label = syncing
    ? 'Subiendo…'
    : pendingTotal > 0
      ? `${pendingTotal} por subir`
      : 'Sin internet';
  const tint = tone === 'header' ? `${colors.background}B3` : colors.muted;
  const text = tone === 'header' ? 'text-background/70' : 'text-muted';
  const pendingText = describeUploads(pending);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={settledOnline ? label : `Sin internet. ${label}`}
        accessibilityHint="Muestra qué está guardado en la tablet y qué falta subir"
        hitSlop={tone === 'header' ? 8 : undefined}
        className={`flex-row items-center gap-2 rounded-lg px-3 ${tone === 'header' ? 'mr-2 min-h-11 active:bg-background/10' : 'min-h-14 active:bg-border'}`}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={tint} />
        ) : (
          <Icon
            name={settledOnline ? 'cloud-upload-outline' : 'cloud-offline-outline'}
            size={22}
            color={tint}
          />
        )}
        <Text className={`font-sans-medium text-base ${text}`}>{label}</Text>
      </Pressable>
      {open ? (
        <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View className="flex-1 items-center justify-center bg-foreground/40 p-8">
            <View className="w-full max-w-[520px] gap-6 rounded-3xl bg-background p-8">
              <DialogHeader
                title={online ? 'Sincronización' : 'Sin internet'}
                onClose={() => setOpen(false)}
              />
              <View className="gap-3">
                <Text className="font-sans text-lg text-foreground">
                  Todo lo que haces se guarda en esta tablet, aunque no haya señal.
                </Text>
                <Text className="font-sans text-lg text-foreground">
                  {pendingText
                    ? `Falta subir a la nube: ${pendingText}. ${!online ? 'Se subirán solos en cuanto haya internet.' : state === 'failed' ? 'No se pudieron subir; se volverá a intentar en unos segundos.' : 'Se están subiendo ahora.'}`
                    : 'No hay nada pendiente de subir.'}
                </Text>
                <Text className="font-sans text-base text-muted">
                  {lastSyncedAt
                    ? `Última sincronización: ${timeFormat.format(new Date(lastSyncedAt))}`
                    : 'Aún no se ha sincronizado en esta sesión.'}
                </Text>
              </View>
              {online && pendingTotal > 0 && technicianId ? (
                <Button
                  label="Sincronizar ahora"
                  icon="sync-outline"
                  loading={state === 'syncing'}
                  onPress={() => syncClients(technicianId)}
                />
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}
