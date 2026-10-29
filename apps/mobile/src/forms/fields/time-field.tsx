import type { FormField } from '@nimzo/shared';
import type { FieldProps, TimeValue } from '@/forms/types';
import { DateTimeInput, pad } from './date-time-input';
import { FieldLabel } from './field-label';

type TimeFieldProps = FieldProps<Extract<FormField, { type: 'time' }>, TimeValue>;

function toValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TimeField({ field, value, onChange, error }: TimeFieldProps) {
  return (
    <FieldLabel field={field} error={error}>
      <DateTimeInput
        label={field.label}
        mode="time"
        value={value ? new Date(`2000-01-01T${value}:00`) : undefined}
        displayText={value}
        placeholder="Elegir hora"
        onChange={(date) => onChange(toValue(date))}
      />
    </FieldLabel>
  );
}
