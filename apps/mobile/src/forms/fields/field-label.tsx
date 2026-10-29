import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { FormField } from '@nimzo/shared';

type FieldLabelProps = {
  field: Pick<FormField, 'label' | 'help' | 'required' | 'highlight'>;
  error?: string;
  hideLabel?: boolean;
  children: ReactNode;
};

export function FieldLabel({ field, error, hideLabel, children }: FieldLabelProps) {
  return (
    <View className={`gap-2 rounded-lg ${field.highlight ? 'bg-surface p-3' : ''}`}>
      {hideLabel ? null : (
        <Text className="font-sans-medium text-lg text-foreground">
          {field.label}
          {field.required ? <Text className="text-danger-strong"> *</Text> : null}
        </Text>
      )}
      {children}
      {field.help ? <Text className="font-sans text-base text-muted">{field.help}</Text> : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger-strong">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
