import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

const variants = {
  primary: {
    container: 'bg-primary-strong',
    text: 'text-on-primary',
    tint: colors['on-primary'],
  },
  secondary: {
    container: 'border-2 border-border-strong bg-background',
    text: 'text-foreground',
    tint: colors.foreground,
  },
  outline: {
    container: 'border border-border bg-background',
    text: 'text-primary-strong',
    tint: colors['primary-strong'],
  },
  ghost: {
    container: '',
    text: 'text-primary-strong',
    tint: colors['primary-strong'],
  },
  danger: {
    container: 'bg-danger-strong',
    text: 'text-on-danger',
    tint: colors['on-danger'],
  },
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: keyof typeof variants;
  icon?: ComponentProps<typeof Feather>['name'];
};

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
}: ButtonProps) {
  const style = variants[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      className={`min-h-16 items-center justify-center rounded-lg px-6 active:opacity-80 ${disabled ? 'opacity-50' : ''} ${style.container}`}
    >
      {loading ? (
        <ActivityIndicator color={style.tint} />
      ) : (
        <View className="flex-row items-center gap-2.5">
          {icon ? <Feather name={icon} size={20} color={style.tint} /> : null}
          <Text className={`font-sans-semibold text-lg ${style.text}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}