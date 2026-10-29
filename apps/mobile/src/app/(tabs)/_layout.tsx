import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions } from 'react-native';
import { ConnectionStatus } from '@/components/connection-status';
import { NavigationBar } from '@/components/navigation-bar';
import { colors, fonts } from '@/theme';

const railMinWidth = 900;

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const variant = width > height && width >= railMinWidth ? 'rail' : 'dock';

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <NavigationBar {...props} variant={variant} />}
        screenOptions={{
          tabBarPosition: variant === 'rail' ? 'left' : 'bottom',
          headerStyle: { backgroundColor: colors.muted },
          headerShadowVisible: false,
          headerTintColor: colors.background,
          headerTitleAlign: 'left',
          headerTitleStyle: { fontFamily: fonts['sans-bold'], fontSize: 22 },
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
