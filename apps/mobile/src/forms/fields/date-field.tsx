import type { FormField } from '@nimzo/shared';
import type { DateValue, FieldProps } from '@/forms/types';
import { DateTimeInput, pad } from './date-time-input';
import { FieldLabel } from './field-label';

type DateFieldProps = FieldProps<Extract<FormField, { type: 'date' }>, DateValue>;

function toValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DateField({ field, value, onChange, error }: DateFieldProps) {
  return (
    <FieldLabel field={field} error={error}>
      <DateTimeInput
        label={field.label}
        mode="date"
        value={value ? new Date(`${value}T00:00:00`) : undefined}
        displayText={value?.split('-').reverse().join('/')}
        placeholder="Elegir fecha"
        onChange={(date) => onChange(toValue(date))}
      />
    </FieldLabel>
  );
}
