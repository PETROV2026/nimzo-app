import { useState } from 'react';
import { Text } from 'react-native';
import type { FormField } from '@nimzo/shared';
import { TextField } from '@/components/text-field';
import { toNumber } from '@/forms/to-number';
import type { FieldProps, TextValue } from '@/forms/types';
import { FieldLabel } from './field-label';

type TextFormFieldProps = FieldProps<Extract<FormField, { type: 'text' }>, TextValue>;

export function TextFormField({ field, value, onChange, error }: TextFormFieldProps) {
  const [text, setText] = useState(value?.toString() ?? '');
  const numeric = field.inputMode === 'numeric' || field.inputMode === 'decimal';

  return (
    <FieldLabel field={field} error={error}>
      <TextField
        accessibilityLabel={field.label}
        inputMode={field.inputMode}
        multiline={field.multiline}
        numberOfLines={field.multiline ? 4 : undefined}
        textAlignVertical={field.multiline ? 'top' : 'center'}
        value={text}
        onChangeText={(next) => {
          setText(next);
          onChange(numeric ? toNumber(next) : next);
        }}
        rightAccessory={
          field.unit ? (
            <Text className="px-4 font-sans text-lg text-muted">{field.unit}</Text>
          ) : null
        }
      />
    </FieldLabel>
  );
}
