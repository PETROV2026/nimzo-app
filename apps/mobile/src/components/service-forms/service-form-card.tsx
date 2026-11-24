import { formTitle } from '@nimzo/shared';
import { Pressable, View } from 'react-native';
import { HighlightedText } from '@/components/highlighted-text';
import { Icon } from '@/components/icon';
import { FormIcon } from '@/components/service-forms/form-icon';
import type { LocalServiceForm } from '@/service-forms/service-forms-db';
import { colors } from '@/theme';

type ServiceFormCardProps = {
  form: LocalServiceForm;
  search?: string;
  onPress?: () => void;
};

export function ServiceFormCard({ form, search, onPress }: ServiceFormCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formTitle(form)}
      onPress={onPress}
      className="min-h-20 flex-row items-center gap-4 rounded-2xl bg-background p-3 shadow-sm active:bg-border"
    >
      <FormIcon form={form} />
      <View className="flex-1 gap-0.5">
        <HighlightedText
          text={form.name}
          term={search}
          className="font-sans-bold text-lg text-foreground"
        />
        {form.subtitle ? (
          <HighlightedText
            text={form.subtitle}
            term={search}
            className="font-sans text-sm text-muted"
          />
        ) : null}
      </View>
      <Icon name="arrow-forward" size={24} color={colors.foreground} />
    </Pressable>
  );
}
