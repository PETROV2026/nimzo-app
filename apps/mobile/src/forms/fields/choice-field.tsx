import type { FormField } from '@nimzo/shared';
import type { FieldProps, OptionValue } from '@/forms/types';
import { FieldFrame } from './field-frame';
import { OptionButtons, type OptionTone } from './option-buttons';

type ChoiceFieldProps = FieldProps<Extract<FormField, { type: 'choice' }>, OptionValue> & {
  tones?: Partial<Record<string, OptionTone>>;
  segmented?: boolean;
};

export function ChoiceField({ field, value, onChange, error, tones, segmented }: ChoiceFieldProps) {
  return (
    <FieldFrame field={field} error={error}>
      <OptionButtons
        label={field.label}
        options={field.options.map((option) => ({ ...option, tone: tones?.[option.value] }))}
        value={value}
        onChange={onChange}
        allowDeselect={!field.required}
        segmented={segmented}
      />
    </FieldFrame>
  );
}
