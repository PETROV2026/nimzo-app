import { Text, TextInput, View, type TextInputProps } from 'react-native';

type TextFieldProps = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'secureTextEntry' | 'autoCapitalize' | 'keyboardType'
> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm text-muted">{label}</Text>
      <TextInput
        className="rounded-md border border-border-strong px-3 py-2 text-base text-foreground"
        {...inputProps}
      />
      {error ? <Text className="text-sm text-danger-strong">{error}</Text> : null}
    </View>
  );
}
