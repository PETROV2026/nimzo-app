import { useState } from 'react';
import { Text, View } from 'react-native';
import type { FormField } from '@nimzo/shared';
import { TextField } from '@/components/text-field';
import type { CheckStatus, CheckValue, FieldProps } from '@/forms/types';
import { FieldLabel } from './field-label';
import { OptionButtons, type Option } from './option-buttons';
import { toNumber } from '@/forms/to-number';

type CheckFieldProps = FieldProps<Extract<FormField, { type: 'check' }>, CheckValue>;

const options: Option<CheckStatus>[] = [
  { value: 'na', label: 'N/A' },
  { value: 'x', label: 'X', tone: 'danger' },
  { value: 'ok', label: 'OK' },
];

export function CheckField({ field, value, onChange, error }: CheckFieldProps) {
  const [text, setText] = useState(value?.value?.toString() ?? '');
  const { measurement } = field;

  function changeStatus(status: CheckStatus) {
    if (status === 'na') setText('');
    onChange(status === 'na' ? { status } : { ...value, status });
  }

  return (
    <FieldLabel field={field} error={error}>
      <View className="flex-row flex-wrap items-end gap-4">
        <OptionButtons
          label={field.label}
          options={options}
          value={value?.status}
          onChange={changeStatus}
        />
        {measurement && value && value.status !== 'na' ? (
          <View className="w-56">
            <TextField
              label={measurement.label}
              inputMode={measurement.inputMode}
              value={text}
              onChangeText={(next) => {
                setText(next);
                onChange({ status: value.status, value: toNumber(next) });
              }}
              rightAccessory={
                measurement.unit ? (
                  <Text className="px-4 font-sans text-lg text-muted">{measurement.unit}</Text>
                ) : null
              }
            />
          </View>
        ) : null}
      </View>
    </FieldLabel>
  );
}
