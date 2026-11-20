import { Image } from 'expo-image';
import { View } from 'react-native';
import { Icon } from '@/components/icon';
import { formIconUrl } from '@/service-forms/form-icon-url';
import type { LocalServiceForm } from '@/service-forms/service-forms-db';
import { colors } from '@/theme';

export function FormIcon({ form }: { form: LocalServiceForm }) {
  const iconUrl = formIconUrl(form);

  return (
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
  );
}
