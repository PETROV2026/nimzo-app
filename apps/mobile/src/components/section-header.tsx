import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <View className="flex-row items-end justify-between gap-4 px-1">
      <View className="flex-1 gap-0.5">
        <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
          {title}
        </Text>
        <Text className="font-sans text-base text-muted">{description}</Text>
      </View>
      {action}
    </View>
  );
}
