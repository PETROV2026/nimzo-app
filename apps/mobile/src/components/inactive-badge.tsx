import { Text, View } from 'react-native';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type InactiveBadgeProps = {
  label?: 'Inactivo' | 'Inactiva';
};

export function InactiveBadge({ label = 'Inactivo' }: InactiveBadgeProps) {
  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-full bg-border px-3 py-1">
      <Icon name="archive-outline" size={16} color={colors.muted} />
      <Text className="font-sans-semibold text-sm text-muted">{label}</Text>
    </View>
  );
}
