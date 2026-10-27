import { userRoleLabels } from '@nimzo/shared';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';

export default function ProfileScreen() {
  const session = useSession();
  const [signingOut, setSigningOut] = useState(false);

  if (session.status !== 'signed-in') {
    return null;
  }

  const { profile, signOut } = session;
  const name = profile?.fullName || session.session.user.email;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <View className="flex-1 items-center bg-canvas px-8 py-4">
      <View className="w-full max-w-[876px] gap-1">
        <Text accessibilityRole="header" className="font-sans-semibold text-lg text-foreground">
          Información personal
        </Text>
        <View className="flex-row items-center justify-between gap-8 rounded-md bg-background px-8 py-4">
          <View className="max-w-[472px] flex-1 gap-3">
            <InfoField label="Nombre completo" value={name} />
            {profile ? <InfoField label="Rol" value={userRoleLabels[profile.role]} /> : null}
          </View>
          <View className="w-[232px]">
            <Button
              variant="secondary"
              label="Cerrar sesión"
              onPress={handleSignOut}
              loading={signingOut}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <View className="gap-2">
      <Text className="font-sans-semibold text-base text-foreground">{label}</Text>
      <View className="h-10 justify-center rounded-md bg-surface px-4">
        <Text className="font-sans text-base text-foreground">{value}</Text>
      </View>
    </View>
  );
}
