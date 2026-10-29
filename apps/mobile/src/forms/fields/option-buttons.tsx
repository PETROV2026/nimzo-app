import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';

export type Option<T extends string> = { value: T; label: string; tone?: 'danger' };

type OptionButtonsProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value?: T;
  onChange: (value: T) => void;
};

const selectedStyles = {
  primary: {
    box: 'border-primary-strong bg-primary-strong',
    text: 'text-on-primary',
    icon: colors['on-primary'],
  },
  danger: {
    box: 'border-danger-strong bg-danger-strong',
    text: 'text-on-danger',
    icon: colors['on-danger'],
  },
};

export function OptionButtons<T extends string>({
  label,
  options,
  value,
  onChange,
}: OptionButtonsProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        const style = selectedStyles[option.tone ?? 'primary'];
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            className={`min-h-14 min-w-24 flex-row items-center justify-center gap-2 rounded-lg border-2 px-4 ${selected ? style.box : 'border-border-strong bg-background'}`}
          >
            {selected ? <MaterialIcons name="check" size={20} color={style.icon} /> : null}
            <Text
              className={`font-sans-semibold text-lg ${selected ? style.text : 'text-foreground'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}