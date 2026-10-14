import type { ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps =
  TextInputProps & {
    label: string;
    error?: string;
    rightAccessory?: ReactNode;
  };

export function TextField({ label, error, rightAccessory, ...inputProps }: TextFieldProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm text-muted">{label}</Text>
      <View className="flex-row items-center rounded-md border border-border-strong">
        <TextInput
          className="min-h-12 flex-1 px-3 text-base text-foreground"
          {...inputProps}
          accessibilityLabel={label}
        />
        {rightAccessory}
      </View>
      {error ? <Text className="text-sm text-danger-strong">{error}</Text> : null}
    </View>
  );
}
