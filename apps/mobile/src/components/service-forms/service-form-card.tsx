import { formTitle } from '@nimzo/shared';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { HighlightedText } from '@/components/highlighted-text';
import { Icon } from '@/components/icon';
import { formIconUrl } from '@/service-forms/form-icon-url';
import type { LocalServiceForm } from '@/service-forms/service-forms-db';
import { colors } from '@/theme';

type ServiceFormCardProps = {
  form: LocalServiceForm;
  search?: string;
  onPress?: () => void;
};

function FormIcon({ form }: { form: LocalServiceForm }) {
  const iconUrl = formIconUrl(form);
  if (!iconUrl) {
    return (
      <View className="size-32 items-center justify-center">
        <Icon name="document-text-outline" size={92} color={colors.muted} />
      </View>
    );
  }
  return (
    <View className="size-32 items-center justify-center">
      <Image
        source={iconUrl}
        style={{ width: 124, height: 124 }}
        contentFit="contain"
        cachePolicy="disk"
        accessible={false}
      />
    </View>
  );
}

export function ServiceFormCard({ form, search, onPress }: ServiceFormCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formTitle(form)}
      onPress={onPress}
      className="flex-1 items-center gap-2 rounded-2xl border border-border bg-background px-3 pb-4 pt-4 active:border-primary active:bg-canvas"
    >
      <FormIcon form={form} />
      <View className="items-center gap-1">
        <HighlightedText
          text={form.name}
          term={search}
          numberOfLines={2}
          className="text-center font-sans-bold text-lg leading-6 text-foreground"
        />
        {form.subtitle ? (
          <HighlightedText
            text={form.subtitle}
            term={search}
            numberOfLines={1}
            className="text-center font-sans-semibold text-base text-primary-strong"
          />
        ) : null}
      </View>
    </Pressable>
  );
}
