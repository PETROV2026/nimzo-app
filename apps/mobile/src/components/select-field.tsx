import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type SelectFieldProps<T extends string> = {
  label: string;
  value: T | null;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecciona una opción',
  disabled,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className="gap-2">
      <Text className="font-sans-medium text-lg text-foreground">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityState={{ disabled }}
        className={`min-h-14 flex-row items-center justify-between rounded-lg border-2 border-border-strong bg-background px-4 ${disabled ? 'opacity-50' : ''}`}
      >
        <Text className={`font-sans text-lg ${selected ? 'text-foreground' : 'text-muted'}`}>
          {selected?.label ?? placeholder}
        </Text>
        <MaterialIcons name="expand-more" size={24} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 items-center justify-center p-8">
          <Pressable
            className="absolute inset-0 bg-foreground/40"
            onPress={() => setOpen(false)}
            accessibilityLabel="Cerrar"
          />
          <View className="max-h-[480px] w-full max-w-[400px] rounded-2xl bg-background py-2">
            <Text className="px-6 py-3 font-sans-semibold text-xl text-foreground">{label}</Text>
            <ScrollView>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: option.value === value }}
                  className={`min-h-12 justify-center px-6 ${option.value === value ? 'bg-surface' : ''}`}
                >
                  <Text className="font-sans text-lg text-foreground">{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
