import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { colors } from '@/theme';

type EmptyStateProps = {
  icon?: ComponentProps<typeof MaterialIcons>['name'];
  title?: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-8">
      {icon ? <MaterialIcons name={icon} size={64} color={colors.muted} /> : null}
      <View className="max-w-md items-center gap-2">
        {title ? (
          <Text className="text-center font-sans-semibold text-xl text-foreground">{title}</Text>
        ) : null}
        <Text className="text-center font-sans text-base text-muted">{description}</Text>
      </View>
      {action}
    </View>
  );
}