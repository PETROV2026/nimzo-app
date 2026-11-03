import { Image } from 'expo-image';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { getDefaultHeaderHeight } from 'expo-router/react-navigation';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { Icon, type IconName } from '@/components/icon';
import { initials } from '@/lib/initials';
import { colors } from '@/theme';

type Variant = 'rail' | 'dock';

const icons: Record<string, { active: IconName; inactive: IconName }> = {
  services: { active: 'clipboard', inactive: 'clipboard-outline' },
  clients: { active: 'people', inactive: 'people-outline' },
  notes: { active: 'document-text', inactive: 'document-text-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

const palette = {
  rail: {
    item: 'min-h-20 w-full',
    mark: 'h-14 w-14',
    activeMark: 'bg-danger',
    pressedMark: 'bg-background/20',
    iconSize: 28,
    activeIcon: colors['on-danger'],
    inactiveIcon: `${colors.background}B3`,
    labelSize: 'text-base',
    activeLabel: 'text-background',
    inactiveLabel: 'text-background/70',
    avatar: 'border-2 border-background/70',
    avatarText: 'text-background/70',
  },
  dock: {
    item: 'min-h-16 flex-1',
    mark: 'h-9 w-16',
    activeMark: '',
    pressedMark: 'bg-border',
    iconSize: 24,
    activeIcon: colors.danger,
    inactiveIcon: colors.muted,
    labelSize: 'text-sm',
    activeLabel: 'text-danger-strong',
    inactiveLabel: 'text-muted',
    avatar: 'border-2 border-muted',
    avatarText: 'text-muted',
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
  const session = useSession();
  const layout = useWindowDimensions();
  const signedIn = session.status === 'signed-in';
  const name = signedIn ? session.profile?.fullName || session.session.user.email || '' : '';
  const technicianInitials = initials(name);

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
            avatar={route.name === 'profile' && technicianInitials ? technicianInitials : undefined}
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
        className="w-[120px] items-center border-r border-background/20 bg-muted"
        style={{ paddingBottom: insets.bottom + 16, paddingLeft: insets.left }}
      >
        <View
          className="w-full items-center justify-center"
          style={{
            height: getDefaultHeaderHeight(layout, false, insets.top),
            paddingTop: insets.top,
          }}
        >
          <Image
            source={brandMark}
            style={{ width: 42, height: 54 }}
            contentFit="contain"
            accessibilityLabel="Nimzo"
          />
        </View>
        <View className="w-full flex-1 justify-center gap-4">{main}</View>
        <View className="mb-4 h-px w-14 bg-background/20" />
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
  avatar: string | undefined;
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
  avatar,
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
            className={`items-center justify-center rounded-full ${tone.mark} ${focused ? tone.activeMark : pressed ? tone.pressedMark : ''}`}
          >
            {avatar ? (
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${focused ? 'bg-danger' : tone.avatar}`}
              >
                <Text
                  maxFontSizeMultiplier={1.2}
                  className={`font-sans-bold text-sm ${focused ? 'text-on-danger' : tone.avatarText}`}
                >
                  {avatar}
                </Text>
              </View>
            ) : (
              <Icon
                name={focused ? icon.active : icon.inactive}
                size={tone.iconSize}
                color={focused ? tone.activeIcon : tone.inactiveIcon}
              />
            )}
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
