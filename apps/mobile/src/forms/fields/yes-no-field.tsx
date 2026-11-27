import type { FormField } from '@nimzo/shared';
import type { FieldProps, YesNoValue } from '@/forms/types';
import { FieldFrame } from './field-frame';
import { FieldRow } from './field-row';
import { OptionButtons, type Option, type OptionTone } from './option-buttons';

type YesNoFieldProps = FieldProps<Extract<FormField, { type: 'yes_no' }>, YesNoValue> & {
  stacked?: boolean;
  tones?: Partial<Record<string, OptionTone>>;
};

const options: Option<YesNoValue>[] = [
  { value: 'yes', label: 'SÍ' },
  { value: 'no', label: 'NO', tone: 'danger' },
];

export function YesNoField({
  field,
  value,
  onChange,
  error,
  number,
  stacked,
  tones,
}: YesNoFieldProps) {
  if (stacked) {
    return (
      <FieldFrame field={field} error={error}>
        <OptionButtons
          label={field.label}
          options={options.map((option) => ({
            ...option,
            tone: tones?.[option.value] ?? option.tone,
          }))}
          value={value}
          onChange={onChange}
          allowDeselect={!field.required}
          segmented
        />
      </FieldFrame>
    );
  }

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
