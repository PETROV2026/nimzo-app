import type { FormField } from '@nimzo/shared';
import type { FieldProps, YesNoValue } from '@/forms/types';
import { FieldLabel } from './field-label';
import { OptionButtons, type Option } from './option-buttons';

type YesNoFieldProps = FieldProps<Extract<FormField, { type: 'yes_no' }>, YesNoValue>;

const options: Option<YesNoValue>[] = [
  { value: 'yes', label: 'SÍ' },
  { value: 'no', label: 'NO' },
];

export function YesNoField({ field, value, onChange, error }: YesNoFieldProps) {
  return (
    <FieldLabel field={field} error={error}>
      <OptionButtons label={field.label} options={options} value={value} onChange={onChange} />
    </FieldLabel>
  );
}