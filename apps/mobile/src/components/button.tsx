import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { colors } from '@/theme';

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
  success: {
    container: 'bg-success',
    text: 'text-on-success',
    tint: colors['on-success'],
  },
  destructive: {
    container: 'bg-destructive',
    text: 'text-on-destructive',
    tint: colors['on-destructive'],
  },
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: keyof typeof variants;
  icon?: IconName;
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
          {icon ? <Icon name={icon} size={22} color={style.tint} /> : null}
          <Text className={`font-sans-semibold text-lg ${style.text}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
