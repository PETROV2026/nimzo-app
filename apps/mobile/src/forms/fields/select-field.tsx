import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { FormField } from '@nimzo/shared';
import { Icon } from '@/components/icon';
import type { FieldProps, OptionValue } from '@/forms/types';
import { colors } from '@/theme';
import { FieldFrame } from './field-frame';

type SelectFieldProps = FieldProps<Extract<FormField, { type: 'select' }>, OptionValue>;

export function SelectField({ field, value, onChange, error }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = field.options.find((option) => option.value === value);
  
  function choose(next?: OptionValue) {
    setOpen(false);
    onChange(next);
  }

  return (
  <FieldFrame field={field} error={error}>
    <View className="min-w-72 self-start">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={field.label}
        accessibilityValue={{ text: selected?.label ?? 'Sin elegir' }}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        className="min-h-14 flex-row items-center justify-between gap-3 rounded-lg bg-muted px-4"
      >
        <Text className="font-sans text-lg text-background">
          {selected?.label ?? 'Elegir una opción'}
        </Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={24} color={colors.background} />
      </Pressable>
      {open ? (
        <View className="mt-1 overflow-hidden rounded-lg bg-muted">
          {field.options.map((option, index) => (
            <Pressable
              key={option.value ?? 'none'}
              accessibilityRole="radio"
              accessibilityState={{ checked: option.value === value }}
              onPress={() => choose(option.value)}
              className={`min-h-14 justify-center px-4 ${index > 0 ? 'border-t border-background' : ''}`}
            >
              <Text
                className={`text-lg text-background ${option.value === value ? 'font-sans-bold' : 'font-sans'}`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  </FieldFrame>
);
}