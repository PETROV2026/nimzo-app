import { Picker } from '@expo/ui/community/picker';
import { View } from 'react-native';
import type { FormField } from '@nimzo/shared';
import type { FieldProps, OptionValue } from '@/forms/types';
import { fonts } from '@/theme';
import { FieldLabel } from './field-label';

type SelectFieldProps = FieldProps<Extract<FormField, { type: 'select' }>, OptionValue>;

export function SelectField({ field, value, onChange, error }: SelectFieldProps) {
  return (
    <FieldLabel field={field} error={error}>
      <View className="min-w-72 self-start">
        <Picker selectedValue={value ?? ''} onValueChange={(next) => onChange(next || undefined)}>
          <Picker.Item label="Elegir una opción" value="" fontFamily={fonts.sans} />
          {field.options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
              fontFamily={fonts.sans}
            />
          ))}
        </Picker>
      </View>
    </FieldLabel>
  );
}
