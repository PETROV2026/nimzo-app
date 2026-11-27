import { Pressable, Text, View } from 'react-native';

export type OptionTone = 'primary' | 'danger' | 'neutral' | 'destructive';

export type Option<T extends string> = { value: T; label: string; tone?: OptionTone };

type OptionButtonsProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value?: T;
  allowDeselect?: boolean;
  segmented?: boolean;
  onChange: (value: T | undefined) => void;
};

const selectedStyles = {
  primary: { box: 'bg-primary-strong', border: 'border-primary-strong', text: 'text-on-primary' },
  danger: { box: 'bg-danger-strong', border: 'border-danger-strong', text: 'text-on-danger' },
  neutral: { box: 'bg-muted', border: 'border-muted', text: 'text-background' },
  destructive: {
    box: 'bg-destructive',
    border: 'border-destructive',
    text: 'text-on-destructive',
  },
};

export function OptionButtons<T extends string>({
  label,
  options,
  value,
  allowDeselect,
  segmented,
  onChange,
}: OptionButtonsProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className={
        segmented
          ? 'flex-row self-start overflow-hidden rounded-lg border-2 border-border-strong'
          : 'flex-row flex-wrap gap-2'
      }
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const style = selectedStyles[option.tone ?? 'primary'];
        const shape = segmented
          ? `min-w-16 ${index > 0 ? 'border-l-2 border-border-strong' : ''}`
          : `min-w-20 rounded-lg border-2 ${selected ? style.border : 'border-border-strong'}`;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(selected && allowDeselect ? undefined : option.value)}
            className={`min-h-14 items-center justify-center px-4 ${shape} ${selected ? style.box : 'bg-background active:bg-surface'}`}
          >
            <Text
              className={`font-sans-semibold text-base ${selected ? style.text : 'text-foreground'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
