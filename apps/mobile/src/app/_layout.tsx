import '../global.css';

import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SessionProvider, useSession } from '@/auth/session-provider';
import { colors, fonts } from '@/theme';
import { KeyboardProvider } from 'react-native-keyboard-controller';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <KeyboardProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </KeyboardProvider>
    </SessionProvider>
  );
}

function RootNavigator() {
  const { status } = useSession();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const ready = (fontsLoaded || fontError !== null) && status !== 'initializing';

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  const signedIn = status === 'signed-in';

    return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && __DEV__}>
        <Stack.Screen
          name="form-preview"
          options={{
            headerShown: true,
            title: 'Vista previa de campos',
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: colors.muted },
            headerTintColor: colors.background,
            headerTitleStyle: { fontFamily: fonts['sans-bold'] },
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
