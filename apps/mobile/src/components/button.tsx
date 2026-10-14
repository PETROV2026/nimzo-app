import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '@/theme/colors';

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, loading, disabled }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      className="items-center rounded-md bg-primary-strong px-4 py-3 active:opacity-80 disabled:opacity-50"
    >
      {loading ? (
        <ActivityIndicator color={colors['on-primary']} />
      ) : (
        <Text className="text-base font-semibold text-on-primary">{label}</Text>
      )}
    </Pressable>
  );
}
