import { MaterialIcons } from '@expo/vector-icons';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { colors } from '@/theme';

type DateTimeInputProps = {
  label: string;
  mode: 'date' | 'time';
  value?: Date;
  displayText?: string;
  placeholder: string;
  onChange: (date: Date) => void;
};

export function pad(number: number) {
  return String(number).padStart(2, '0');
}

export function DateTimeInput({
  label,
  mode,
  value,
  displayText,
  placeholder,
  onChange,
}: DateTimeInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: displayText ?? placeholder }}
        onPress={() => setOpen(true)}
        className="min-h-14 min-w-56 flex-row items-center gap-3 self-start rounded-lg border-2 border-border-strong bg-background px-4"
      >
        <MaterialIcons
          name={mode === 'date' ? 'event' : 'schedule'}
          size={24}
          color={colors.muted}
        />
        <Text className={`font-sans text-lg ${displayText ? 'text-foreground' : 'text-muted'}`}>
          {displayText ?? placeholder}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode={mode}
          is24Hour
          presentation="dialog"
          accentColor={colors['primary-strong']}
          onValueChange={(_, date) => {
            setOpen(false);
            onChange(date);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
