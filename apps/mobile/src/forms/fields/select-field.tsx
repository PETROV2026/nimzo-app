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
      <View className="min-w-72 gap-2 self-start">
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
          <View accessibilityRole="radiogroup" accessibilityLabel={field.label} className="gap-2">
            {field.options.map((option) => {
              const checked = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked }}
                  onPress={() => choose(option.value)}
                  className={`min-h-14 flex-row items-center justify-between gap-3 rounded-lg border-2 px-4 ${checked ? 'border-muted bg-muted' : 'border-border-strong bg-background'}`}
                >
                  <Text
                    className={`text-lg ${checked ? 'font-sans-bold text-background' : 'font-sans text-foreground'}`}
                  >
                    {option.label}
                  </Text>
                  {checked ? <Icon name="checkmark" size={24} color={colors.background} /> : null}
                </Pressable>
              );
            })}
            {!field.required && selected ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => choose(undefined)}
                className="min-h-14 flex-row items-center gap-3 self-start rounded-lg px-4 active:bg-border"
              >
                <Icon name="close-circle-outline" size={24} color={colors.muted} />
                <Text className="font-sans-semibold text-lg text-muted">Quitar selección</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </FieldFrame>
  );
}
