import { MaterialIcons } from '@expo/vector-icons';
import { mexicanStateLabels, userRoleLabels } from '@nimzo/shared';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { SectionHeader } from '@/components/section-header';
import { SignatureSection } from '@/components/signature-section';
import { SupportDialog } from '@/components/support-dialog';
import { useOnline } from '@/lib/use-online';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

const twoColumnWidth = 900;

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
  const area = profile
    ? [profile.city, profile.state ? mexicanStateLabels[profile.state] : null]
        .filter(Boolean)
        .join(', ') || null
    : null;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  const identity = (
    <View className="overflow-hidden rounded-2xl bg-background">
      <View className="h-24 bg-primary" />
      <View className="-mt-14 items-center gap-1 px-6 pb-6">
        <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-background bg-primary-strong">
          <Text className="font-sans-bold text-4xl text-on-primary">{initials(name)}</Text>
        </View>
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          className="mt-3 text-center font-sans-bold text-2xl text-foreground"
        >
          {name}
        </Text>
        {email ? (
          <Text numberOfLines={1} className="text-center font-sans text-base text-muted">
            {email}
          </Text>
        ) : null}
        {role ? (
          <View className="mt-3 rounded-full bg-canvas px-4 py-1.5">
            <Text className="font-sans-semibold text-sm text-primary-strong">{role}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const supportRow = (
    <Pressable
      onPress={() => setShowingSupport(true)}
      accessibilityRole="button"
      accessibilityLabel="Ayuda y soporte"
      accessibilityHint="Muestra el correo para contactar a soporte"
      className="min-h-16 flex-row items-center gap-4 rounded-2xl bg-background px-5 py-3 active:bg-surface"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
        <MaterialIcons name="support-agent" size={22} color={colors['primary-strong']} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold text-lg text-foreground">Ayuda y soporte</Text>
        <Text className="font-sans text-sm text-muted">
          ¿Algún problema con la app? Escríbenos.
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={26} color={colors.muted} />
    </Pressable>
  );

  const signOutRow = (
    <Pressable
      onPress={() => setConfirmingSignOut(true)}
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
      className="min-h-16 flex-row items-center gap-4 rounded-2xl bg-danger/10 px-5 active:bg-danger/20"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-danger">
        <MaterialIcons name="logout" size={22} color={colors['on-danger']} />
      </View>
      <Text className="flex-1 font-sans-semibold text-lg text-danger-strong">Cerrar sesión</Text>
      <MaterialIcons name="chevron-right" size={26} color={colors['danger-strong']} />
    </Pressable>
  );

  const details = (
    <View className="gap-6">
      <View className="gap-3">
        <SectionHeader
          title="Datos de contacto"
          description="Así te localizan tus clientes y el equipo de Nimzo."
          action={
            <Pressable
              onPress={() => setEditing(true)}
              disabled={!canEdit}
              accessibilityRole="button"
              accessibilityLabel="Editar datos de contacto"
              accessibilityState={{ disabled: !canEdit }}
              className={`min-h-14 flex-row items-center gap-2 rounded-full border-2 border-border px-5 active:bg-surface ${canEdit ? '' : 'opacity-50'}`}
            >
              <MaterialIcons name="edit" size={20} color={colors['primary-strong']} />
              <Text className="font-sans-semibold text-base text-primary-strong">Editar</Text>
            </Pressable>
          }
        />
        <View className="rounded-2xl bg-background px-5">
          {profile ? (
            <>
              <InfoRow icon="mail-outline" label="Correo" value={email} />
              <InfoRow icon="phone" label="Teléfono" value={profile.phone} />
              <InfoRow icon="place" label="Zona" value={area} last />
            </>
          ) : (
            <Text className="py-6 font-sans text-base text-foreground">
              No se pudo cargar tu perfil. Se cargará solo en cuanto tengas conexión.
            </Text>
          )}
        </View>
      </View>

      <SignatureSection
        signaturePath={profile ? profile.signaturePath : undefined}
        disabled={!canEdit}
        name={name}
        role={role}
      />
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="items-center p-6">
      {wide ? (
        <View className="w-full max-w-[1120px] flex-row items-start gap-6">
          <View className="w-[340px] gap-4">
            {identity}
            {supportRow}
            {signOutRow}
          </View>
          <View className="flex-1">{details}</View>
        </View>
      ) : (
        <View className="w-full max-w-[720px] gap-6">
          {identity}
          {details}
          {supportRow}
          {signOutRow}
        </View>
      )}

      {editing && profile ? (
        <EditProfileDialog profile={profile} onClose={() => setEditing(false)} />
      ) : null}

      {showingSupport ? (
        <SupportDialog accountEmail={email} onClose={() => setShowingSupport(false)} />
      ) : null}

      {confirmingSignOut ? (
        <ConfirmDialog
          title="¿Cerrar sesión?"
          message="Para volver a entrar necesitarás tu correo, tu contraseña y conexión a internet."
          confirmLabel="Cerrar sesión"
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
  value?: string | null;
  last?: boolean;
};

function InfoRow({ icon, label, value, last }: InfoRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value || 'sin capturar'}`}
      className={`min-h-[72px] flex-row items-center gap-4 py-3 ${last ? '' : 'border-b border-border'}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
        <MaterialIcons name={icon} size={22} color={colors['primary-strong']} />
      </View>
      <Text className="font-sans text-lg text-muted">{label}</Text>
      <Text
        numberOfLines={2}
        className={`flex-1 text-right font-sans-medium text-lg ${value ? 'text-foreground' : 'text-muted'}`}
      >
        {value || 'Sin capturar'}
      </Text>
    </View>
  );
}
