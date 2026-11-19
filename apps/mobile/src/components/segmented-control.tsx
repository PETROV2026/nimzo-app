import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { colors } from '@/theme';

export type Segment<T extends string> = {
  value: T;
  label: string;
  icon: IconName;
};

type SegmentedControlProps<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row gap-2 rounded-full border border-border bg-background p-1.5"
    >
      {segments.map((segment) => {
        const selected = segment.value === value;

        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(segment.value)}
            className={`min-h-16 grow flex-row items-center justify-center gap-2 rounded-full px-3 ${selected ? 'bg-danger-light' : 'active:bg-foreground/10'}`}
          >
            <Icon
              name={segment.icon}
              size={22}
              color={selected ? colors['on-danger-light'] : colors.muted}
            />
            <Text
              className={`font-sans-semibold text-base ${selected ? 'text-on-danger-light' : 'text-muted'}`}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
