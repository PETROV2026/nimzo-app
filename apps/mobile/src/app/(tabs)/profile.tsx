import { mexicanStateLabels, userRoleLabels } from '@nimzo/shared';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { SectionHeader } from '@/components/section-header';
import { SignatureSection } from '@/components/signature-section';
import { SupportDialog } from '@/components/support-dialog';
import { useOnline } from '@/lib/use-online';
import { colors } from '@/theme';

const twoColumnWidth = 900;
const appVersion = Constants.expoConfig?.version;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export default function ProfileScreen() {
  const session = useSession();
  const online = useOnline();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showingSupport, setShowingSupport] = useState(false);

  if (session.status !== 'signed-in') {
    return null;
  }

  const { profile, signOut } = session;
  const wide = width >= twoColumnWidth;
  const canEdit = online && profile !== null;
  const email = session.session.user.email ?? null;
  const name = profile?.fullName || email || '';
  const role = profile ? userRoleLabels[profile.role] : '';
  const city = profile?.city || null;
  const state = profile?.state ? mexicanStateLabels[profile.state] : null;
  const subtitle = [role, [city, state].filter(Boolean).join(', ')].filter(Boolean).join(' · ');

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  const identity = (
    <View className="flex-row items-center gap-5">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-danger">
        <Text className="font-sans-bold text-3xl text-on-danger">{initials(name)}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          className="font-sans-bold text-3xl text-foreground"
        >
          {name}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="font-sans text-base text-muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const contact = (
    <View
      className={`gap-6 rounded-2xl border border-border bg-background p-6 ${wide ? 'flex-1' : ''}`}
    >
      <SectionHeader
        title="Datos de contacto"
        description="Así te localizan tus clientes y el equipo de Nimzo."
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
        <View className="gap-4">
          <InfoRow icon="email-outline" label="Correo electrónico" value={email} />
          <InfoRow icon="phone-outline" label="Teléfono" value={profile.phone} />
          <InfoRow icon="map-marker-outline" label="Ciudad" value={city} />
          <InfoRow icon="map-outline" label="Estado" value={state} />
        </View>
      ) : (
        <Text className="font-sans text-base text-foreground">
          No se pudo cargar tu perfil. Se cargará solo en cuanto tengas conexión.
        </Text>
      )}
    </View>
  );

  const supportRow = (
    <Pressable
      onPress={() => setShowingSupport(true)}
      accessibilityRole="button"
      accessibilityLabel="Ayuda y soporte"
      accessibilityHint="Muestra el correo para contactar a soporte"
      className="min-h-20 flex-row items-center gap-4 rounded-2xl border border-border bg-background px-5 py-3 active:bg-border"
    >
      <Icon name="face-agent" size={24} color={colors.danger} />
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold text-lg text-foreground">Ayuda y soporte</Text>
        <Text className="font-sans text-sm text-muted">¿Algo no funciona? Escríbenos.</Text>
      </View>
      <Icon name="chevron-right" size={24} color={colors.muted} />
    </Pressable>
  );

  const signOutRow = (
    <Pressable
      onPress={() => setConfirmingSignOut(true)}
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      className="min-h-16 flex-row items-center gap-3 rounded-xl px-4 active:bg-destructive/10"
    >
      <Icon name="logout" size={24} color={colors.destructive} />
      <Text className="font-sans-bold text-lg text-destructive">Cerrar sesión</Text>
    </Pressable>
  );

  const version = appVersion ? (
    <Text className="text-center font-sans text-sm text-muted">Versión {appVersion}</Text>
  ) : null;

  const footer = wide ? (
    <View className="flex-row items-center">
      <View className="flex-1" />
      {version}
      <View className="flex-1 items-end">{signOutRow}</View>
    </View>
  ) : (
    <View className="gap-1">
      <View className="items-end">{signOutRow}</View>
      {version}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="items-center p-7">
      <View className="w-full max-w-[1120px] gap-6">
        {identity}
        <View className={wide ? 'flex-row gap-6' : 'gap-6'}>
          {contact}
          <SignatureSection
            className={wide ? 'w-2/5' : undefined}
            signaturePath={profile ? profile.signaturePath : undefined}
            disabled={!canEdit}
            name={name}
            role={role}
          />
        </View>
        {supportRow}
        <View className="gap-1">
          <View className="mx-2.5 h-px bg-border" />
          {footer}
        </View>
      </View>

      {editing && profile ? (
        <EditProfileDialog profile={profile} email={email} onClose={() => setEditing(false)} />
      ) : null}

      {showingSupport ? (
        <SupportDialog accountEmail={email} onClose={() => setShowingSupport(false)} />
      ) : null}

      {confirmingSignOut ? (
        <ConfirmDialog
          title="¿Cerrar sesión?"
          message={`Vas a cerrar la sesión de ${name} en este dispositivo.`}
          note="Para volver a entrar necesitarás tu correo, tu contraseña y conexión a internet."
          confirmLabel="Cerrar sesión"
          tone="destructive"
          onConfirm={handleSignOut}
          onClose={() => setConfirmingSignOut(false)}
          loading={signingOut}
        />
      ) : null}
    </ScrollView>
  );
}

type InfoRowProps = {
  icon: IconName;
  label: string;
  value: string | null;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value || 'sin capturar'}`}
      className="flex-row items-center gap-3.5"
    >
      <Icon name={icon} size={24} color={colors.danger} />
      <View className="flex-1">
        <Text className="font-sans text-sm text-muted">{label}</Text>
        <Text numberOfLines={2} className="font-sans-medium text-lg text-foreground">
          {value || 'Sin capturar'}
        </Text>
      </View>
    </View>
  );
}
