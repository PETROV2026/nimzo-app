import { useState, type ReactNode, type Ref } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  rightAccessory?: ReactNode;
  ref?: Ref<TextInput>;
};

export function TextField({
  label,
  error,
  rightAccessory,
  ref,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const disabled = inputProps.editable === false;

  const borderClass = error
    ? 'border-danger'
    : disabled
      ? 'border-border'
      : focused
        ? 'border-primary-strong'
        : 'border-border-strong';

  return (
    <View className="gap-2">
      {label ? <Text className="font-sans-medium text-lg text-foreground">{label}</Text> : null}
      <View
        className={`flex-row items-center rounded-lg border-2 ${disabled ? 'bg-surface' : 'bg-background'} ${borderClass}`}
      >
        <TextInput
          ref={ref}
          className={`min-h-14 flex-1 px-4 font-sans text-lg ${disabled ? 'text-muted' : 'text-foreground'}`}
          placeholderTextColor={colors['border-strong']}
          cursorColor={colors['primary-strong']}
          selectionColor={colors.primary}
          accessibilityLabel={label}
          accessibilityHint={error}
          accessibilityState={{ disabled }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {rightAccessory}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger-strong">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
