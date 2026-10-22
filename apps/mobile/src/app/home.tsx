import { userRoleLabels } from '@nimzo/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';

export default function HomeScreen() {
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
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-10 p-8">
        <Image
          source={require('@nimzo/brand/logos/logo-horizontal-color.webp')}
          style={{ width: 240, height: 93 }}
          contentFit="contain"
          accessibilityLabel="Nimzo"
        />
        <View className="w-full max-w-md items-center gap-2">
          <Text
            accessibilityRole="header"
            className="text-center font-sans-bold text-3xl text-foreground"
          >
            Hola, {name}
          </Text>
          {profile ? (
            <Text className="font-sans text-lg text-muted">{userRoleLabels[profile.role]}</Text>
          ) : null}
        </View>
        <View className="w-full max-w-md">
          <Button label="Cerrar sesión" onPress={handleSignOut} loading={signingOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}
