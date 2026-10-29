import type { FormField } from '@nimzo/shared';
import type { FieldProps, OptionValue } from '@/forms/types';
import { FieldLabel } from './field-label';
import { OptionButtons } from './option-buttons';

type ChoiceFieldProps = FieldProps<Extract<FormField, { type: 'choice' }>, OptionValue>;

export function ChoiceField({ field, value, onChange, error }: ChoiceFieldProps) {
  return (
    <FieldLabel field={field} error={error}>
      <OptionButtons
        label={field.label}
        options={field.options}
        value={value}
        onChange={onChange}
      />
    </FieldLabel>
  );
}
