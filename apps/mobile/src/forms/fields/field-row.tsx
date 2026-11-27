import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { FormField } from '@nimzo/shared';

export type RowTone = 'positive' | 'negative' | 'neutral' | 'empty';

const accents: Record<RowTone, string> = {
  positive: 'bg-primary',
  negative: 'bg-danger',
  neutral: 'bg-border-strong',
  empty: 'bg-border',
};

type FieldRowProps = {
  field: Pick<FormField, 'label' | 'help' | 'required' | 'highlight'>;
  number?: string;
  tone: RowTone;
  error?: string;
  control: ReactNode;
  children?: ReactNode;
};

export function FieldRow({ field, number, tone, error, control, children }: FieldRowProps) {
  const indent = number ? 'pl-[52px]' : '';

  return (
    <View className={`gap-3 py-4 pl-6 pr-4 ${error ? 'bg-danger/5' : ''}`}>
      <View className={`absolute bottom-3 left-2 top-3 w-1 rounded-full ${accents[tone]}`} />
      <View className="flex-row gap-3">
        {number ? (
          <Text className="min-w-10 font-sans-semibold text-lg text-muted">{number}</Text>
        ) : null}
        <Text
          className={`flex-1 font-sans-medium text-lg ${field.highlight ? 'text-danger-strong' : 'text-foreground'}`}
        >
          {field.label}
          {field.required ? <Text className="text-danger-strong"> *</Text> : null}
        </Text>
      </View>
      {field.help ? (
        <Text className={`font-sans text-base text-muted ${indent}`}>{field.help}</Text>
      ) : null}
      <View className={`flex-row flex-wrap items-end gap-4 ${indent}`}>
        <View>{control}</View>
        {children}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className={`font-sans-medium text-sm text-destructive ${indent}`}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
