import type { ComponentProps } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { TextField } from '@/components/text-field';

type FormTextFieldProps<T extends FieldValues> = Omit<
  ComponentProps<typeof TextField>,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  control: Control<T>;
  name: FieldPath<T>;
  format?: (text: string) => string;
};

export function FormTextField<T extends FieldValues>({
  control,
  name,
  format,
  ...props
}: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          value={field.value ?? ''}
          onChangeText={(text) => field.onChange(format ? format(text) : text)}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
