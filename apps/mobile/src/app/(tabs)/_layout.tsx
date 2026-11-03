import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectionStatus } from '@/components/connection-status';
import { NavigationBar } from '@/components/navigation-bar';
import { useOpenNoteFromNotification } from '@/notes/reminders';
import { colors, fonts } from '@/theme';

const railMinWidth = 900;
const headerBarHeight = 52;

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const variant = width > height && width >= railMinWidth ? 'rail' : 'dock';

  useOpenNoteFromNotification();
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <NavigationBar {...props} variant={variant} />}
        screenOptions={{
          tabBarPosition: variant === 'rail' ? 'left' : 'bottom',
          headerStyle: { backgroundColor: colors.muted, height: insets.top + headerBarHeight },
          headerShadowVisible: false,
          headerTintColor: colors.background,
          headerTitleAlign: 'center',
          headerTitleStyle: { fontFamily: fonts['sans-bold'], fontSize: 20 },
          headerRight: () => <ConnectionStatus />,
          sceneStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Tabs.Screen name="services" options={{ title: 'Servicios' }} />
        <Tabs.Screen name="clients" options={{ title: 'Clientes' }} />
        <Tabs.Screen name="notes" options={{ title: 'Notas' }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </>
  );
}
