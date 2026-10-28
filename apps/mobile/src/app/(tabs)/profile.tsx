import { mexicanStateLabels, userRoleLabels } from '@nimzo/shared';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { SignatureSection } from '@/components/signature-section';

export default function ProfileScreen() {
  const session = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState(false);

  if (session.status !== 'signed-in') {
    return null;
  }

  const { profile, signOut } = session;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="items-center px-8 py-4">
      <View className="w-full max-w-[876px] gap-1">
        <Text accessibilityRole="header" className="font-sans-semibold text-lg text-foreground">
          Información personal
        </Text>
        <View className="gap-6 rounded-md bg-background px-8 py-6">
          <View className="gap-4">
            <View className="flex-row gap-8">
              <InfoField label="Nombre completo" value={profile?.fullName} />
              <InfoField label="Rol" value={profile ? userRoleLabels[profile.role] : null} />
            </View>
            <View className="flex-row gap-8">
              <InfoField label="Correo electrónico" value={session.session.user.email} />
              <InfoField label="Teléfono" value={profile?.phone} />
            </View>
            <View className="flex-row gap-8">
              <InfoField
                label="Estado"
                value={profile?.state ? mexicanStateLabels[profile.state] : null}
              />
              <InfoField label="Ciudad" value={profile?.city} />
            </View>
          </View>
          <View className="w-[232px] self-end">
            <Button
              variant="brand"
              label="Editar información"
              onPress={() => setEditing(true)}
              disabled={!profile}
            />
          </View>
        </View>

        <View className="mt-8">
          <SignatureSection signaturePath={profile?.signaturePath ?? null} disabled={!profile} />
        </View>

        <View className="mt-12 h-px bg-border" />

        <View className="mt-8 w-[232px] self-end">
          <Button
            variant="secondary"
            label="Cerrar sesión"
            onPress={handleSignOut}
            loading={signingOut}
          />
        </View>
      </View>
      {editing && profile ? (
        <EditProfileDialog profile={profile} onClose={() => setEditing(false)} />
      ) : null}
    </ScrollView>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-1 gap-2">
      <Text className="font-sans-semibold text-base text-foreground">{label}</Text>
      <View className="h-10 justify-center rounded-md bg-surface px-4">
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className={`font-sans text-base ${value ? 'text-foreground' : 'text-muted'}`}
        >
          {value || 'Sin registrar'}
        </Text>
      </View>
    </View>
  );
}
