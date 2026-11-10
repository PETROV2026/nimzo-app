import { Pressable, Text } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { colors } from '@/theme';

type TextActionProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  accessibilityLabel?: string;
  expanded?: boolean;
};

export function TextAction({
  label,
  onPress,
  icon,
  accessibilityLabel,
  expanded,
}: TextActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      className="min-h-14 flex-row items-center gap-2 self-start rounded-lg px-3 active:bg-primary/10"
    >
      {icon ? <Icon name={icon} size={22} color={colors['primary-strong']} /> : null}
      <Text className="font-sans-semibold text-lg text-primary-strong">{label}</Text>
    </Pressable>
  );
}
