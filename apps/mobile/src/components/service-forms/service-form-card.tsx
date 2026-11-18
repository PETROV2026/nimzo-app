import { formTitle } from '@nimzo/shared';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icon';
import type { LocalServiceForm } from '@/service-forms/service-forms-db';
import { colors } from '@/theme';
import { HighlightedText } from '@/components/highlighted-text';
import { Image } from 'expo-image';
import { formIconUrl } from '@/service-forms/form-icon-url';

type ServiceFormCardProps = {
  form: LocalServiceForm;
  search?: string;
  onPress?: () => void;
};

export function ServiceFormCard({ form, search, onPress }: ServiceFormCardProps) {
  const iconUrl = formIconUrl(form);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formTitle(form)}
      onPress={onPress}
      className="min-h-20 flex-row items-center gap-4 rounded-2xl bg-background p-3 shadow-sm active:bg-border"
    >
      <View className="size-14 items-center justify-center rounded-xl bg-danger">
        {iconUrl ? (
          <Image
            source={iconUrl}
            style={{ width: 30, height: 30 }}
            contentFit="contain"
            cachePolicy="disk"
            accessible={false}
          />
        ) : (
          <Icon name="document-text" size={30} color={colors['on-danger']} />
        )}
      </View>
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
