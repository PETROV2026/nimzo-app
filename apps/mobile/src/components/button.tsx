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
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      className="min-h-14 items-center justify-center rounded-lg bg-primary-strong px-6 active:opacity-80 disabled:opacity-50"
    >
      {loading ? (
        <ActivityIndicator color={colors['on-primary']} />
      ) : (
        <Text className="font-sans-semibold text-lg text-on-primary">{label}</Text>
      )}
    </Pressable>
  );
}
