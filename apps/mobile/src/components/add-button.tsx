import { Pressable } from 'react-native';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type AddButtonProps = {
  label: string;
  onPress: () => void;
};

export function AddButton({ label, onPress }: AddButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="absolute bottom-6 right-6 h-[72px] w-[72px] items-center justify-center rounded-full bg-primary-strong active:opacity-80"
      style={{ elevation: 6 }}
    >
      <Icon name="add" size={36} color={colors['on-primary']} />
    </Pressable>
  );
}
