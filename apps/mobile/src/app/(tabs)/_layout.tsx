import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { colors, fonts } from '@/theme';
import type { ColorValue } from 'react-native';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <MaterialIcons name={name} color={color} size={size} />;
  };
}

export const unstable_settings = {
  initialRouteName: 'services',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors['brand-strong'],
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.background },
        tabBarLabelStyle: { fontFamily: fonts['sans-medium'] },
        headerStyle: { backgroundColor: colors.muted },
        headerTintColor: colors.background,
        headerTitleAlign: 'center',
        headerTitleStyle: { fontFamily: fonts['sans-bold'] },
      }}
    >
      <Tabs.Screen
        name="services"
        options={{ title: 'Servicios', tabBarIcon: tabIcon('assignment') }}
      />
      <Tabs.Screen
        name="clients"
        options={{ title: 'Clientes', tabBarIcon: tabIcon('people-outline') }}
      />
      <Tabs.Screen name="notes" options={{ title: 'Notas', tabBarIcon: tabIcon('event-note') }} />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('account-circle') }}
      />
    </Tabs>
  );
}
