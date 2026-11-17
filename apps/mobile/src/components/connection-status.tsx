import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import {
  describeUploads,
  retryRejected,
  useClientsSyncStatus,
  useUploadCounts,
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
  const { pending, rejected } = useUploadCounts(technicianId);
  const pendingTotal = pending.clients + pending.branches + pending.systems;
  const rejectedTotal = rejected.clients + rejected.branches + rejected.systems;
  const [open, setOpen] = useState(false);

  const syncing = state === 'syncing' && pendingTotal > 0;
  if (settledOnline && pendingTotal === 0 && rejectedTotal === 0) return null;

  const label = syncing
    ? 'Sincronizando…'
    : pendingTotal > 0
      ? `${pendingTotal} por sincronizar`
      : rejectedTotal > 0
        ? `${rejectedTotal} sin sincronizar`
        : 'Sin conexión';
  const tint = tone === 'header' ? `${colors.background}B3` : colors.muted;
  const text = tone === 'header' ? 'text-background/70' : 'text-muted';
  const pendingText = describeUploads(pending);
  const rejectedText = describeUploads(rejected);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={settledOnline ? label : `Sin conexión. ${label}`}
        accessibilityHint="Muestra qué está guardado en el dispositivo y qué falta sincronizar"
        hitSlop={tone === 'header' ? 8 : undefined}
        className={`flex-row items-center gap-2 rounded-lg px-3 ${tone === 'header' ? 'mr-2 min-h-11 active:bg-background/10' : 'min-h-14 active:bg-border'}`}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={tint} />
        ) : (
          <Icon
            name={
              !settledOnline
                ? 'cloud-offline-outline'
                : pendingTotal === 0 && rejectedTotal > 0
                  ? 'alert-circle-outline'
                  : 'cloud-upload-outline'
            }
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
                title={online ? 'Sincronización' : 'Sin conexión'}
                onClose={() => setOpen(false)}
              />
              <View className="gap-3">
                <Text className="font-sans text-lg text-foreground">
                  Toda tu información se guarda en este dispositivo, incluso sin conexión.
                </Text>
                <Text className="font-sans text-lg text-foreground">
                  {pendingText
                    ? `Pendiente de sincronizar: ${pendingText}. ${!online ? 'Se sincronizará automáticamente cuando haya conexión.' : state === 'failed' ? 'No se pudo sincronizar; se reintentará en unos segundos.' : 'Sincronizando ahora.'}`
                    : 'No hay cambios pendientes de sincronizar.'}
                </Text>
                {rejectedText ? (
                  <Text className="font-sans text-lg text-foreground">
                    {`No se pudo sincronizar: ${rejectedText}. El servidor rechazó estos cambios. Revisa sus datos y vuelve a intentarlo; si el problema continúa, escribe al soporte de Nimzo.`}
                  </Text>
                ) : null}
                <Text className="font-sans text-base text-muted">
                  {lastSyncedAt
                    ? `Última sincronización: ${timeFormat.format(new Date(lastSyncedAt))}`
                    : 'Aún no se ha sincronizado en esta sesión.'}
                </Text>
              </View>
              {online && pendingTotal + rejectedTotal > 0 && technicianId ? (
                <Button
                  label={pendingTotal > 0 ? 'Sincronizar ahora' : 'Volver a intentar'}
                  icon="sync-outline"
                  loading={state === 'syncing'}
                  onPress={() => retryRejected(technicianId)}
                />
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}
