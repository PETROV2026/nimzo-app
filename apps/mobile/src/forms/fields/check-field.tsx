import { useState } from 'react';
import { Text, View } from 'react-native';
import type { FormField } from '@nimzo/shared';
import { TextField } from '@/components/text-field';
import type { CheckStatus, CheckValue, FieldProps } from '@/forms/types';
import { FieldRow, type RowTone } from './field-row';
import { OptionButtons, type Option } from './option-buttons';
import { cleanNumber, numberError, toNumber } from '@/forms/to-number';

type CheckFieldProps = FieldProps<Extract<FormField, { type: 'check' }>, CheckValue>;

const options: Option<CheckStatus>[] = [
  { value: 'na', label: 'N/A', tone: 'neutral' },
  { value: 'x', label: 'X', tone: 'danger' },
  { value: 'ok', label: 'OK' },
];

const tones: Record<CheckStatus, RowTone> = { ok: 'positive', x: 'negative', na: 'neutral' };

export function CheckField({ field, value, onChange, error, number }: CheckFieldProps) {
  const [text, setText] = useState(value?.value?.toString() ?? '');
  const { measurement } = field;
  const decimal = measurement?.inputMode === 'decimal';
  const external = value?.value?.toString() ?? '';
  if (toNumber(text, decimal) !== toNumber(external, decimal)) setText(external);

  function changeStatus(status?: CheckStatus) {
    if (!status) onChange(undefined);
    else onChange(status === 'na' ? { status } : { ...value, status });
  }

  return (
    <FieldRow
      field={field}
      number={number}
      tone={value ? tones[value.status] : 'empty'}
      error={error}
      control={
        <OptionButtons
          label={field.label}
          options={options}
          value={value?.status}
          onChange={changeStatus}
          allowDeselect={!field.required}
          segmented
        />
      }
    >
      {measurement && value && value.status !== 'na' ? (
        <View className="w-64">
          <TextField
            label={measurement.label}
            error={numberError(text, decimal)}
            inputMode={measurement.inputMode}
            value={text}
            onChangeText={(next) => {
              const clean = cleanNumber(next);
              setText(clean);
              onChange({ status: value.status, value: toNumber(clean, decimal) });
            }}
            rightAccessory={
              measurement.unit ? (
                <Text className="px-4 font-sans text-lg text-muted">{measurement.unit}</Text>
              ) : null
            }
          />
        </View>
      ) : null}
    </FieldRow>
  );
}
