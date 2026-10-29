import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import type { FormField } from '@nimzo/shared';
import type { CheckboxValue, FieldProps } from '@/forms/types';
import { colors } from '@/theme';
import { FieldLabel } from './field-label';

type CheckboxFieldProps = FieldProps<Extract<FormField, { type: 'checkbox' }>, CheckboxValue>;

export function CheckboxField({ field, value, onChange, error }: CheckboxFieldProps) {
  const checked = value === true;

  return (
    <FieldLabel field={field} error={error} hideLabel>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        className="min-h-12 flex-row items-center gap-3 self-start"
      >
        <MaterialIcons
          name={checked ? 'check-box' : 'check-box-outline-blank'}
          size={32}
          color={checked ? colors['primary-strong'] : colors['border-strong']}
        />
        <Text className="font-sans-medium text-lg text-foreground">
          {field.label}
          {field.required ? <Text className="text-danger-strong"> *</Text> : null}
        </Text>
      </Pressable>
    </FieldLabel>
  );
}