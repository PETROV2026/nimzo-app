import { useState } from 'react';
import { Text } from 'react-native';
import type { FormField } from '@nimzo/shared';
import { TextField } from '@/components/text-field';
import { cleanNumber, toNumber } from '@/forms/to-number';
import type { FieldProps, TextValue } from '@/forms/types';
import { FieldLabel } from './field-frame';

type TextFormFieldProps = FieldProps<Extract<FormField, { type: 'text' }>, TextValue>;

export function TextFormField({ field, value, onChange, error }: TextFormFieldProps) {
  const [text, setText] = useState(value?.toString() ?? '');
  const numeric = field.inputMode === 'numeric' || field.inputMode === 'decimal';
  const external = value?.toString() ?? '';
  if (numeric ? toNumber(text) !== toNumber(external) : text !== external) setText(external);

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
          const clean = numeric ? cleanNumber(next, field.inputMode === 'decimal') : next;
          setText(clean);
          onChange(numeric ? toNumber(clean) : clean);
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
