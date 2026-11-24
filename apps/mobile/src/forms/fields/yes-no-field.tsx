import type { FormField } from '@nimzo/shared';
import type { FieldProps, YesNoValue } from '@/forms/types';
import { FieldRow } from './field-row';
import { OptionButtons, type Option } from './option-buttons';

type YesNoFieldProps = FieldProps<Extract<FormField, { type: 'yes_no' }>, YesNoValue>;

const options: Option<YesNoValue>[] = [
  { value: 'yes', label: 'SÍ' },
  { value: 'no', label: 'NO', tone: 'danger' },
];

export function YesNoField({ field, value, onChange, error, number }: YesNoFieldProps) {
  return (
    <FieldRow
      field={field}
      number={number}
      tone={value === 'yes' ? 'positive' : value === 'no' ? 'negative' : 'empty'}
      error={error}
      control={
        <OptionButtons
          label={field.label}
          options={options}
          value={value}
          onChange={onChange}
          allowDeselect={!field.required}
          segmented
        />
      }
    />
  );
}
