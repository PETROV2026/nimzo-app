import { formTitle } from '@nimzo/shared';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icon';
import type { ServiceFormSummary } from '@/service-forms/mock-service-forms';
import { colors } from '@/theme';

type ServiceFormCardProps = {
  form: ServiceFormSummary;
  onPress?: () => void;
};

export function ServiceFormCard({ form, onPress }: ServiceFormCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formTitle(form)}
      onPress={onPress}
      className="min-h-20 flex-row items-center gap-4 rounded-2xl bg-background p-3 shadow-sm active:bg-border"
    >
      <View className="size-14 items-center justify-center rounded-xl bg-danger">
        <Icon name="document-text" size={30} color={colors['on-danger']} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-bold text-lg text-foreground">{form.name}</Text>
        {form.subtitle ? (
          <Text className="font-sans text-sm text-muted">{form.subtitle}</Text>
        ) : null}
      </View>
      <Icon name="arrow-forward" size={24} color={colors.foreground} />
    </Pressable>
  );
}
