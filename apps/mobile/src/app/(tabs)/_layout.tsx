import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { ConnectionStatus } from '@/components/connection-status';
import { colors, fonts } from '@/theme';
import { Pressable, type ColorValue } from 'react-native';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <MaterialIcons name={name} color={color} size={size} />;
  };
}

function TabButton({
  children,
  style,
  onPress,
  onLongPress,
  accessibilityState,
  accessibilityLabel,
  testID,
}: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      android_ripple={null}
      style={style}
    >
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors['primary-strong'],
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.background },
          tabBarLabelStyle: { fontFamily: fonts['sans-medium'] },
          tabBarButton: TabButton,
          headerStyle: { backgroundColor: colors.muted },
          headerTintColor: colors.background,
          headerTitleAlign: 'center',
          headerTitleStyle: { fontFamily: fonts['sans-bold'] },
          headerRight: () => <ConnectionStatus />,
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
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </>
  );
}
