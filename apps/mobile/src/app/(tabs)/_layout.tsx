import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { useClientsSync } from '@/clients/clients-sync';
import { AppHeader } from '@/components/app-header';
import { NavigationBar } from '@/components/navigation-bar';
import { SyncToast } from '@/components/sync-toast';
import { useOpenNoteFromNotification } from '@/notes/reminders';
import { colors } from '@/theme';

const railMinWidth = 900;

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const variant = width > height && width >= railMinWidth ? 'rail' : 'dock';

  const session = useSession();
  useClientsSync(session.status === 'signed-in' ? session.session.user.id : '');
  useOpenNoteFromNotification();
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <NavigationBar {...props} variant={variant} />}
        screenLayout={({ route, children }) =>
          route.name === 'profile' ? (
            children
          ) : (
            <View className="flex-1 overflow-hidden rounded-t-[28px] bg-canvas">{children}</View>
          )
        }
        screenOptions={{
          tabBarPosition: variant === 'rail' ? 'left' : 'bottom',
          header: ({ options, route }) => (
            <AppHeader
              title={typeof options.title === 'string' ? options.title : route.name}
              showBrand={variant === 'dock'}
              actions={options.headerRight?.({ canGoBack: false })}
            />
          ),
          sceneStyle: { backgroundColor: colors.muted },
        }}
      >
        <Tabs.Screen name="services" options={{ title: 'Servicios' }} />
        <Tabs.Screen name="clients" options={{ title: 'Clientes' }} />
        <Tabs.Screen name="notes" options={{ title: 'Notas' }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil', headerShown: false }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
      <SyncToast />
    </>
  );
}
