import type { FormField } from '@nimzo/shared';
import { SelectField as Dropdown } from '@/components/select-field';
import type { FieldProps, OptionValue } from '@/forms/types';
import { FieldFrame } from './field-frame';

type SelectFieldProps = FieldProps<Extract<FormField, { type: 'select' }>, OptionValue>;

const searchThreshold = 10;

export function SelectField({ field, value, onChange, error }: SelectFieldProps) {
  return (
    <FieldFrame field={field} error={error}>
      <Dropdown
        label={field.label}
        showLabel={false}
        value={value ?? null}
        options={field.options}
        onChange={onChange}
        onClear={field.required ? undefined : () => onChange(undefined)}
        searchPlaceholder={field.options.length > searchThreshold ? 'Buscar' : undefined}
      />
    </FieldFrame>
  );
}
