import { useState, type ReactNode, type Ref } from 'react';
import { Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  rightAccessory?: ReactNode;
  ref?: Ref<TextInputInstance>;
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
  const floating = Boolean(error && label);

  const borderClass = error
    ? 'border-danger'
    : disabled
      ? 'border-border'
      : focused
        ? 'border-primary-strong'
        : 'border-border-strong';

  return (
    <View className="gap-2">
      {label && !floating ? (
        <Text className="font-sans-medium text-lg text-foreground">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-lg border-2 ${disabled ? 'bg-surface' : 'bg-background'} ${borderClass}`}
      >
        {floating ? (
          <Text className="absolute -top-3.5 left-3 z-10 bg-background px-1 font-sans-medium text-base text-destructive">
            {label}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          className={`min-h-14 flex-1 px-4 font-sans text-lg ${disabled ? 'text-muted' : 'text-foreground'}`}
          placeholderTextColor={colors.placeholder}
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
        <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
