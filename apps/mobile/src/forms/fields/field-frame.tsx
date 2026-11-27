import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { FormField } from '@nimzo/shared';

type FieldFrameProps = {
  field: Pick<FormField, 'label' | 'help' | 'required' | 'highlight'>;
  error?: string;
  hideLabel?: boolean;
  labelAccessory?: ReactNode;
  children: ReactNode;
};

export function FieldFrame({ field, error, hideLabel, labelAccessory, children }: FieldFrameProps) {
  return (
    <View className={`gap-2 rounded-lg ${field.highlight ? 'bg-surface p-3' : ''}`}>
      {hideLabel ? null : (
        <View className="flex-row items-center gap-1">
          <Text className="shrink font-sans-medium text-lg text-foreground">
            {field.label}
            {field.required ? <Text className="text-danger-strong"> *</Text> : null}
          </Text>
          {labelAccessory}
        </View>
      )}
      {children}
      {field.help ? <Text className="font-sans text-base text-muted">{field.help}</Text> : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
