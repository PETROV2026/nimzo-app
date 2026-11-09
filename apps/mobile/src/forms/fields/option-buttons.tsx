import { Pressable, Text, View } from 'react-native';

export type Option<T extends string> = { value: T; label: string; tone?: 'danger' | 'neutral' };

type OptionButtonsProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value?: T;
  allowDeselect?: boolean;
  onChange: (value: T | undefined) => void;
};

const selectedStyles = {
  primary: {
    box: 'border-primary-strong bg-primary-strong',
    text: 'text-on-primary',
  },
  danger: {
    box: 'border-danger-strong bg-danger-strong',
    text: 'text-on-danger',
  },
  neutral: {
    box: 'border-muted bg-muted',
    text: 'text-background',
  },
};

export function OptionButtons<T extends string>({
  label,
  options,
  value,
  allowDeselect,
  onChange,
}: OptionButtonsProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row flex-wrap gap-2"
    >
      {options.map((option) => {
        const selected = option.value === value;
        const style = selectedStyles[option.tone ?? 'primary'];
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(selected && allowDeselect ? undefined : option.value)}
            className={`min-h-14 min-w-24 flex-row items-center justify-center gap-2 rounded-lg border-2 px-4 ${selected ? style.box : 'border-border-strong bg-background'}`}
          >
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
