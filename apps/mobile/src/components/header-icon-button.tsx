import { Pressable } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { colors } from '@/theme';

type HeaderIconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

export function HeaderIconButton({ icon, label, onPress }: HeaderIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="mr-2 min-h-14 min-w-14 items-center justify-center rounded-full active:bg-background/20"
    >
      <Icon name={icon} size={26} color={colors.background} />
    </Pressable>
  );
}
