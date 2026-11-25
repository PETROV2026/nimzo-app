import { mexicanStateLabels } from '@nimzo/shared';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session-provider';
import { signOutNote } from '@/auth/sign-out-note';
import { describeUploads, retryRejected, useUploadCounts } from '@/clients/clients-sync';
import { announce } from '@/components/announcement-toast';
import { createDemoReports, deleteDemoReports } from '@/dev/demo-reports';
import { showDeveloperTools } from '@/dev/developer-tools';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ConnectionStatus } from '@/components/connection-status';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { Icon, type IconName } from '@/components/icon';
import { SectionHeader } from '@/components/section-header';
import { SignatureDialog } from '@/components/signature-dialog';
import { SignaturePreview } from '@/components/signature-preview';
import { SupportDialog } from '@/components/support-dialog';
import { openFeedback } from '@/feedback/open-feedback';
import { useToast } from '@/components/toast';
import { PrivacyNoticeDialog } from '@/components/privacy-notice-dialog';
import { initials } from '@/lib/initials';
import { useOnline } from '@/lib/use-online';
import { useNotificationAccess } from '@/notes/reminders';
import { colors } from '@/theme';

const roomyWidth = 640;
const appVersion = Constants.expoConfig?.version;

export default function ProfileScreen() {
  const session = useSession();
  const online = useOnline();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const notifications = useNotificationAccess();
  const [editing, setEditing] = useState(false);
  const [signing, setSigning] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showingSupport, setShowingSupport] = useState(false);
  const [showingPrivacy, setShowingPrivacy] = useState(false);
  const { toast, showToast } = useToast();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const uploads = useUploadCounts(technicianId);

  if (session.status !== 'signed-in') {
    return null;
  }

  const { profile, signOut, saveSignature } = session;
  const roomy = width >= roomyWidth;
  const contactLayout = !roomy ? 'stacked' : width > height ? 'row' : 'grid';
  const canEdit = online && profile !== null;
  const email = session.session.user.email ?? null;
  const name = profile?.fullName || email || '';
  const city = profile?.city || null;
  const state = profile?.state ? mexicanStateLabels[profile.state] : null;
  const place = [city, state].filter(Boolean).join(', ');
  const missingSignature = profile?.signaturePath === null;
  const edit = canEdit ? () => setEditing(true) : undefined;
  const pending = describeUploads(uploads.pending);
  const rejected = describeUploads(uploads.rejected);
  const syncLabel = pending ? 'Sincronizar primero' : rejected ? 'Volver a intentar' : undefined;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  function syncFirst() {
    void retryRejected(technicianId);
    setConfirmingSignOut(false);
  }

  const signatureAlert = missingSignature ? (
    <View
      accessibilityRole="alert"
      className="flex-row items-center gap-4 rounded-2xl bg-accent px-5 py-4"
    >
      <Icon name="warning-outline" size={26} color={colors['on-accent']} />
      <Text className="flex-1 font-sans-medium text-base text-on-accent">
        Registra tu firma. Es necesaria para enviar reportes.
      </Text>
      {canEdit ? (
        <View className="w-[190px]">
          <Button
            variant="secondary"
            icon="create-outline"
            label="Crear firma"
            onPress={() => setSigning(true)}
          />
        </View>
      ) : null}
    </View>
  ) : null;

  const identity = (
    <View className="flex-row items-center gap-5">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Text className="font-sans-bold text-3xl text-background">{initials(name)}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          className="font-sans-bold text-3xl text-foreground"
        >
          {name}
        </Text>
        {place ? (
          <Text numberOfLines={1} className="font-sans text-base text-muted">
            {place}
          </Text>
        ) : null}
        {email && email !== name ? (
          <Text numberOfLines={1} className="font-sans text-base text-muted">
            {email}
          </Text>
        ) : null}
      </View>
      <ConnectionStatus tone="page" />
    </View>
  );

  const offlineHint = online ? null : (
    <View className="flex-row items-center gap-3 px-1">
      <Icon name="cloud-offline-outline" size={22} color={colors.muted} />
      <Text className="flex-1 font-sans text-base text-muted">
        Se requiere conexión para editar tus datos y tu firma.
      </Text>
    </View>
  );

  const contactFields: Omit<InfoRowProps, 'onAdd'>[] = [
    {
      icon: 'call-outline',
      label: 'Teléfono',
      value: profile?.phone ?? null,
      emptyLabel: 'Agregar teléfono',
    },
    { icon: 'business-outline', label: 'Ciudad', value: city, emptyLabel: 'Agregar ciudad' },
    { icon: 'map-outline', label: 'Estado', value: state, emptyLabel: 'Agregar estado' },
  ];

  const profileMissing = (
    <Text className="font-sans text-base text-foreground">
      No se pudo cargar tu perfil. Se cargará automáticamente cuando haya conexión.
    </Text>
  );

  const signatureHero = (
    <View className="gap-6">
      <View className="gap-5 rounded-2xl border border-border bg-background p-6">
        <SectionHeader
          title="Tu firma"
          description="Así aparece en cada reporte que envías."
          action={
            <Button
              variant={missingSignature ? 'primary' : 'ghost'}
              icon="create-outline"
              label={missingSignature ? 'Crear firma' : 'Cambiar'}
              onPress={() => setSigning(true)}
              disabled={!canEdit}
            />
          }
        />
        <SignaturePreview signaturePath={profile ? profile.signaturePath : undefined} name={name} />
      </View>
      <View className="gap-5 rounded-2xl border border-border bg-background p-6">
        <SectionHeader
          title="Datos de contacto"
          description="Aparecen junto a tu firma en cada reporte."
          action={
            <Button
              variant="ghost"
              icon="pencil-outline"
              label="Editar"
              onPress={() => setEditing(true)}
              disabled={!canEdit}
            />
          }
        />
        {profile ? (
          <View
            className={
              contactLayout === 'row'
                ? 'flex-row gap-6'
                : contactLayout === 'grid'
                  ? 'flex-row flex-wrap gap-x-6 gap-y-5'
                  : 'gap-4'
            }
          >
            {contactFields.map((field, index) => (
              <View
                key={field.label}
                className={
                  contactLayout === 'row'
                    ? 'flex-1'
                    : contactLayout === 'grid'
                      ? index === 0
                        ? 'w-full'
                        : 'min-w-0 flex-1 basis-[40%]'
                      : ''
                }
              >
                <InfoRow {...field} onAdd={edit} />
              </View>
            ))}
          </View>
        ) : (
          profileMissing
        )}
      </View>
    </View>
  );

  const notificationsRow =
    notifications.access === 'askable' || notifications.access === 'blocked' ? (
      <ActionRow
        icon="notifications-off-outline"
        title="Notificaciones desactivadas"
        description="No recibirás los recordatorios de tus notas. Toca para activar las notificaciones."
        tone="attention"
        onPress={() => void notifications.enable()}
      />
    ) : null;

  return (
    <View className="flex-1 bg-canvas">
      <View className="bg-muted" style={{ height: insets.top }} />
      <ScrollView className="flex-1" contentContainerClassName="items-center p-7">
        <View className="w-full max-w-[1120px] gap-6">
          {signatureAlert}
          {identity}
          {offlineHint}
          {signatureHero}
          <View className="gap-3">
            {notificationsRow}
            <ActionRow
              icon="chatbubble-ellipses-outline"
              title="Enviar comentarios"
              description="Cuéntanos qué falló o qué mejorarías en la app."
              onPress={() => openFeedback('profile')}
            />
            <ActionRow
              icon="help-buoy-outline"
              title="Ayuda y soporte"
              description="Escríbenos por correo si necesitas ayuda."
              onPress={() => setShowingSupport(true)}
            />
            <ActionRow
              icon="document-lock-outline"
              title="Aviso de privacidad"
              description="Cómo usamos y protegemos tus datos."
              onPress={() => setShowingPrivacy(true)}
            />
            {__DEV__ && showDeveloperTools ? (
              <>
                <ActionRow
                  icon="document-text-outline"
                  title="Vista previa de formatos"
                  description="Solo en desarrollo: abre cualquier formato para llenarlo."
                  onPress={() => router.push('/form-preview')}
                />
                <ActionRow
                  icon="flask-outline"
                  title="Crear reportes de prueba"
                  description="Solo en desarrollo: un reporte falso por formato, en Pendientes."
                  onPress={() => {
                    const count = createDemoReports(session.session.user.id);
                    announce('Reportes de prueba creados', `${count} en Pendientes.`);
                  }}
                />
                <ActionRow
                  icon="trash-outline"
                  title="Borrar reportes de prueba"
                  description="Solo en desarrollo: quita los reportes falsos de este dispositivo."
                  onPress={() => {
                    const count = deleteDemoReports(session.session.user.id);
                    announce('Reportes de prueba borrados', `Se quitaron ${count}.`);
                  }}
                />
              </>
            ) : null}
            <ActionRow
              icon="log-out-outline"
              title="Cerrar sesión"
              tone="destructive"
              onPress={() => setConfirmingSignOut(true)}
            />
          </View>
          {appVersion ? (
            <Text className="text-center font-sans text-sm text-muted">Versión {appVersion}</Text>
          ) : null}
        </View>

        {editing && profile ? (
          <EditProfileDialog
            profile={profile}
            onClose={() => setEditing(false)}
            onSaved={() =>
              showToast('Tus datos se guardaron', 'Así aparecerán en tus próximos reportes.')
            }
          />
        ) : null}

        {signing ? (
          <SignatureDialog
            title="Tu firma"
            name={name}
            onSave={saveSignature}
            onClose={() => setSigning(false)}
            onSaved={() => showToast('Tu firma se guardó', 'Se usará en tus próximos reportes.')}
          />
        ) : null}

        {showingSupport ? (
          <SupportDialog accountEmail={email} onClose={() => setShowingSupport(false)} />
        ) : null}

        {showingPrivacy ? <PrivacyNoticeDialog onClose={() => setShowingPrivacy(false)} /> : null}

        {confirmingSignOut ? (
          <ConfirmDialog
            title="¿Cerrar sesión?"
            message={`Se cerrará la sesión de ${name} en este dispositivo.`}
            note={signOutNote({ pending, rejected })}
            secondaryLabel={online ? syncLabel : undefined}
            onSecondary={syncFirst}
            confirmLabel="Cerrar sesión"
            tone="destructive"
            onConfirm={handleSignOut}
            onClose={() => setConfirmingSignOut(false)}
            loading={signingOut}
          />
        ) : null}
      </ScrollView>
      {toast}
    </View>
  );
}

type InfoRowProps = {
  icon: IconName;
  label: string;
  value: string | null;
  emptyLabel: string;
  onAdd: (() => void) | undefined;
};

function InfoRow({ icon, label, value, emptyLabel, onAdd }: InfoRowProps) {
  const content = (
    <>
      <Icon name={icon} size={24} color={colors.danger} />
      <View className="flex-1">
        <Text className="font-sans text-sm text-muted">{label}</Text>
        {value ? (
          <Text numberOfLines={2} className="font-sans-medium text-lg text-foreground">
            {value}
          </Text>
        ) : (
          <Text
            className={`font-sans-semibold text-lg ${onAdd ? 'text-primary-strong' : 'text-muted'}`}
          >
            {onAdd ? emptyLabel : 'No registrado'}
          </Text>
        )}
      </View>
    </>
  );

  if (!value && onAdd) {
    return (
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={emptyLabel}
        className="-mx-3 min-h-14 flex-row items-center gap-3.5 rounded-xl px-3 active:bg-primary/10"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value || 'no registrado'}`}
      className="flex-row items-center gap-3.5"
    >
      {content}
    </View>
  );
}

const actionTones = {
  default: {
    container: 'border border-border bg-background active:bg-border',
    icon: colors.danger,
    title: 'text-foreground',
  },
  attention: {
    container: 'border-2 border-accent bg-background active:bg-accent/20',
    icon: colors.foreground,
    title: 'text-foreground',
  },
  destructive: {
    container: 'border border-border bg-background active:bg-destructive/10',
    icon: colors.destructive,
    title: 'text-destructive',
  },
};

type ActionRowProps = {
  icon: IconName;
  title: string;
  description?: string;
  tone?: keyof typeof actionTones;
  onPress: () => void;
};

function ActionRow({ icon, title, description, tone = 'default', onPress }: ActionRowProps) {
  const style = actionTones[tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      className={`min-h-20 flex-row items-center gap-4 rounded-2xl px-5 py-3 ${style.container}`}
    >
      <Icon name={icon} size={24} color={style.icon} />
      <View className="flex-1 gap-0.5">
        <Text className={`font-sans-semibold text-lg ${style.title}`}>{title}</Text>
        {description ? <Text className="font-sans text-sm text-muted">{description}</Text> : null}
      </View>
      {tone === 'destructive' ? null : (
        <Icon name="chevron-forward" size={24} color={colors.muted} />
      )}
    </Pressable>
  );
}
