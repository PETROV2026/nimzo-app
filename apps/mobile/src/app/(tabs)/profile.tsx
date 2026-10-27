import { mexicanStateLabels, userRoleLabels } from '@nimzo/shared';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { EditProfileDialog } from '@/components/edit-profile-dialog'; 

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
        <View className="flex-row items-center justify-between gap-8 rounded-md bg-background px-8 py-4">
          <View className="max-w-[472px] flex-1 gap-3">
            <InfoField label="Nombre completo" value={profile?.fullName} />
            <InfoField label="Rol" value={profile ? userRoleLabels[profile.role] : null} />
            <InfoField label="Correo electrónico" value={session.session.user.email} />
            <InfoField label="Teléfono" value={profile?.phone} />
            <InfoField
              label="Estado"
              value={profile?.state ? mexicanStateLabels[profile.state] : null}
            />
            <InfoField label="Ciudad" value={profile?.city} />
          </View>
        </View>
        <View className="w-[232px]">
            <Button
              variant="secondary"
              label="Cerrar sesión"
              onPress={handleSignOut}
              loading={signingOut}
            />
          </View>
          <View className="w-[232px]">
            <Button label="Editar información" onPress={() => setEditing(true)} disabled={!profile} />
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
    <View className="gap-2">
      <Text className="font-sans-semibold text-base text-foreground">{label}</Text>
      <View className="h-10 justify-center rounded-md bg-surface px-4">
        <Text className={`font-sans text-base ${value ? 'text-foreground' : 'text-muted'}`}>
          {value || 'Sin registrar'}
        </Text>
      </View>
    </View>
  );
}