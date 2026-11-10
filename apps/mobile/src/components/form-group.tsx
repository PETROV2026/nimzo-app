import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type FormGroupProps = {
  title: string;
  children: ReactNode;
};

export function FormGroup({ title, children }: FormGroupProps) {
  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="font-sans-semibold text-lg text-muted">
        {title}
      </Text>
      {children}
    </View>
  );
}
