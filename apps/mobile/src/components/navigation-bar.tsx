import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icons: Record<string, { active: IconName; inactive: IconName }> = {
  services: { active: 'clipboard', inactive: 'clipboard-outline' },
  clients: { active: 'people', inactive: 'people-outline' },
  notes: { active: 'document-text', inactive: 'document-text-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

const brandMark = require('@nimzo/brand/logos/icon-color.webp');

type NavigationBarProps = BottomTabBarProps & { variant: 'rail' | 'dock' };

export function NavigationBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
  variant,
}: NavigationBarProps) {
  const items = state.routes
    .map((route, index) => ({ route, focused: state.index === index }))
    .filter(({ route }) => route.name in icons)
    .map(({ route, focused }) => {
      const { options } = descriptors[route.key];
      const label = typeof options.title === 'string' ? options.title : route.name;

      function handlePress() {
        const event = emitter.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!focused && !event.defaultPrevented) navigateToTab(route.key);
      }

      function handleLongPress() {
        emitter.emit({ type: 'tabLongPress', target: route.key });
      }

      return (
        <NavigationItem
          key={route.key}
          label={label}
          icon={icons[route.name]}
          badge={options.tabBarBadge}
          focused={focused}
          variant={variant}
          onPress={handlePress}
          onLongPress={handleLongPress}
        />
      );
    });

  if (variant === 'rail') {
    return (
      <View
        accessibilityRole="tablist"
        className="w-[104px] items-center bg-muted"
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingLeft: insets.left,
        }}
      >
        <Image
          source={brandMark}
          style={{ width: 34, height: 44 }}
          contentFit="contain"
          accessibilityLabel="Nimzo"
        />
        <View className="mt-10 w-full gap-3">{items}</View>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="tablist"
      className="w-full flex-row border-t border-border bg-background px-2 pt-2"
      style={{
        paddingBottom: insets.bottom + 8,
        paddingLeft: insets.left + 8,
        paddingRight: insets.right + 8,
      }}
    >
      {items}
    </View>
  );
}

type NavigationItemProps = {
  label: string;
  icon: { active: IconName; inactive: IconName };
  badge: string | number | undefined;
  focused: boolean;
  variant: 'rail' | 'dock';
  onPress: () => void;
  onLongPress: () => void;
};

function NavigationItem({
  label,
  icon,
  badge,
  focused,
  variant,
  onPress,
  onLongPress,
}: NavigationItemProps) {
  const rail = variant === 'rail';
  const iconColor = focused ? colors.danger : rail ? colors.background : colors.muted;
  const textColor = focused ? 'text-danger' : rail ? 'text-background' : 'text-muted';
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityLabel={badge ? `${label}, ${badge} pendientes` : label}
      accessibilityState={{ selected: focused }}
      className={`min-h-16 items-center justify-center gap-1 ${rail ? 'w-full' : 'flex-1'}`}
    >
      <View className="h-9 w-16 items-center justify-center">
        <View className="font-sans-medium text-muted">
          <Ionicons
            name={focused ? icon.active : icon.inactive}
            size={24}
            color={focused ? colors.danger : rail ? colors.background : colors.muted}
          />
        </View>
        {badge !== undefined ? (
          <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1">
            <Text className="font-sans-bold text-xs text-on-accent">{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        className={`text-sm ${focused ? 'font-sans-bold' : 'font-sans-medium'} ${textColor}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
