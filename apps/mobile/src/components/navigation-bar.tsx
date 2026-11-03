import { Image } from 'expo-image';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { colors } from '@/theme';

type Variant = 'rail' | 'dock';

const icons: Record<string, { active: IconName; inactive: IconName }> = {
  services: { active: 'clipboard-text', inactive: 'clipboard-text-outline' },
  clients: { active: 'account-group', inactive: 'account-group-outline' },
  notes: { active: 'note-text', inactive: 'note-text-outline' },
  profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

const palette = {
  rail: {
    item: 'min-h-20 w-full',
    pill: 'h-14 w-14',
    activePill: 'bg-background',
    pressedPill: 'bg-background/20',
    iconSize: 28,
    labelSize: 'text-base',
    activeLabel: 'text-background',
    inactiveLabel: 'text-background',
    inactiveIcon: colors.background,
  },
  dock: {
    item: 'min-h-16 flex-1',
    pill: 'h-9 w-16',
    activePill: '',
    pressedPill: 'bg-border',
    iconSize: 24,
    labelSize: 'text-sm',
    activeLabel: 'text-danger-strong',
    inactiveLabel: 'text-muted',
    inactiveIcon: colors.muted,
  },
};

const brandMark = require('@nimzo/brand/logos/icon-color.webp');

type NavigationBarProps = BottomTabBarProps & { variant: Variant };

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

      return {
        name: route.name,
        element: (
          <NavigationItem
            key={route.key}
            label={label}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            icon={icons[route.name]}
            badge={options.tabBarBadge}
            focused={focused}
            variant={variant}
            onPress={handlePress}
            onLongPress={handleLongPress}
          />
        ),
      };
    });

  if (variant === 'rail') {
    const main = items.filter((item) => item.name !== 'profile').map((item) => item.element);
    const profile = items.find((item) => item.name === 'profile')?.element;
    return (
      <View
        accessibilityRole="tablist"
        className="w-[120px] items-center bg-muted"
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
        <View className="w-full flex-1 justify-center gap-4">{main}</View>
        <View className="w-full">{profile}</View>
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
      {items.map((item) => item.element)}
    </View>
  );
}

type NavigationItemProps = {
  label: string;
  accessibilityLabel: string | undefined;
  testID: string | undefined;
  icon: { active: IconName; inactive: IconName };
  badge: string | number | undefined;
  focused: boolean;
  variant: Variant;
  onPress: () => void;
  onLongPress: () => void;
};

function NavigationItem({
  label,
  accessibilityLabel,
  testID,
  icon,
  badge,
  focused,
  variant,
  onPress,
  onLongPress,
}: NavigationItemProps) {
  const tone = palette[variant];
  const spokenLabel = accessibilityLabel ?? label;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      accessibilityRole="tab"
      accessibilityLabel={badge === undefined ? spokenLabel : `${spokenLabel}, ${badge} pendientes`}
      accessibilityState={{ selected: focused }}
      className={`items-center justify-center gap-1 ${tone.item}`}
    >
      {({ pressed }) => (
        <>
          <View
            className={`items-center justify-center rounded-full ${tone.pill} ${focused ? tone.activePill : pressed ? tone.pressedPill : ''}`}
          >
            <Icon
              name={focused ? icon.active : icon.inactive}
              size={tone.iconSize}
              color={focused ? colors.danger : tone.inactiveIcon}
            />
            {badge === undefined ? null : (
              <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1">
                <Text maxFontSizeMultiplier={1.2} className="font-sans-bold text-xs text-on-accent">
                  {badge}
                </Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
            className={`${tone.labelSize} ${focused ? `font-sans-bold ${tone.activeLabel}` : `font-sans-medium ${tone.inactiveLabel}`}`}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
