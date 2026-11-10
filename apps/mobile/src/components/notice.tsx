import { Text, View } from 'react-native';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type NoticeProps = {
  message: string;
};

export function Notice({ message }: NoticeProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="flex-row items-start gap-3 rounded-lg bg-accent/25 px-4 py-3"
    >
      <Icon name="information-circle-outline" size={22} color={colors.foreground} />
      <Text className="flex-1 font-sans text-base text-foreground">{message}</Text>
    </View>
  );
}
