import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '@/theme/colors';

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

const variants = {
  primary: {
    container: 'bg-primary-strong',
    text: 'text-on-primary',
    spinner: colors['on-primary'],
  },
  secondary: {
    container: 'border-2 border-border-strong bg-background',
    text: 'text-foreground',
    spinner: colors.foreground,
  },
};

export function Button({ label, onPress, loading, disabled, variant = 'primary' }: ButtonProps) {
  const style = variants[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      className={`min-h-14 items-center justify-center rounded-lg px-6 active:opacity-80 disabled:opacity-50 ${style.container}`}
    >
      {loading ? (
        <ActivityIndicator color={style.spinner} />
      ) : (
        <Text className={`font-sans-semibold text-lg ${style.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
