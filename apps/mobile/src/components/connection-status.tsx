import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  cubicBezier,
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';
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

const easeOut = cubicBezier(0.23, 1, 0.32, 1);
const pillEntering = FadeIn.duration(200).reduceMotion(ReduceMotion.System);
const pillExiting = FadeOut.duration(150).reduceMotion(ReduceMotion.System);
const pillLayout = LinearTransition.duration(200)
  .easing(Easing.bezier(0.23, 1, 0.32, 1))
  .reduceMotion(ReduceMotion.System);

const spin = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};

const ripple = {
  from: { opacity: 0.6, transform: [{ scale: 1 }] },
  to: { opacity: 0, transform: [{ scale: 2.4 }] },
};

type StatusKind = 'syncing' | 'offline' | 'pending' | 'rejected';
type Tone = 'header' | 'page';

const tones = {
  header: {
    pill: 'border-background/20',
    idle: 'bg-background/10',
    pressed: 'bg-background/20',
    text: 'text-background',
    icon: colors.background,
    alert: colors.accent,
  },
  page: {
    pill: 'border-border',
    idle: 'bg-surface',
    pressed: 'bg-border',
    text: 'text-foreground',
    icon: colors.muted,
    alert: colors.danger,
  },
};

function StatusMark({ kind, tone }: { kind: StatusKind; tone: Tone }) {
  const reduced = useReducedMotion();
  if (kind === 'syncing') {
    return (
      <Animated.View
        style={
          reduced
            ? undefined
            : {
                animationName: spin,
                animationDuration: 1000,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              }
        }
      >
        <Icon
          name="sync-outline"
          size={22}
          color={tone === 'header' ? colors.background : colors.primary}
        />
      </Animated.View>
    );
  }
  if (kind === 'pending') {
    return (
      <View className="h-6 w-6 items-center justify-center">
        {reduced ? null : (
          <Animated.View
            className="absolute h-3 w-3 rounded-full bg-accent"
            style={{
              animationName: ripple,
              animationDuration: 1600,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-out',
            }}
          />
        )}
        <View className="h-3 w-3 rounded-full bg-accent" />
      </View>
    );
  }
  return (
    <Icon
      name={kind === 'offline' ? 'cloud-offline-outline' : 'alert-circle-outline'}
      size={22}
      color={kind === 'offline' ? tones[tone].icon : tones[tone].alert}
    />
  );
}

type ConnectionStatusProps = {
  tone?: Tone;
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
  const look = tones[tone];
  const pendingText = describeUploads(pending);
  const rejectedText = describeUploads(rejected);
  const kind: StatusKind = syncing
    ? 'syncing'
    : !settledOnline
      ? 'offline'
      : pendingTotal > 0
        ? 'pending'
        : 'rejected';

  return (
    <>
      <Animated.View entering={pillEntering} exiting={pillExiting} layout={pillLayout}>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={settledOnline ? label : `Sin conexión. ${label}`}
          accessibilityHint="Muestra qué está guardado en el dispositivo y qué falta sincronizar"
          pressRetentionOffset={16}
        >
          {({ pressed }) => (
            <Animated.View
              className={`min-h-14 flex-row items-center gap-3 rounded-full border pl-4 pr-5 ${look.pill} ${pressed ? look.pressed : look.idle}`}
              style={{
                transform: [{ scale: pressed ? 0.97 : 1 }],
                transitionProperty: 'transform',
                transitionDuration: 120,
                transitionTimingFunction: easeOut,
              }}
            >
              <StatusMark kind={kind} tone={tone} />
              <Text className={`font-sans-medium text-base ${look.text}`}>{label}</Text>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
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
