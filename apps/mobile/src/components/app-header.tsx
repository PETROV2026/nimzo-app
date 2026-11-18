import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectionStatus } from '@/components/connection-status';

const brandMark = require('@nimzo/brand/logos/icon-color.webp');

const dateFormat = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function today() {
  const text = dateFormat.format(new Date());
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type AppHeaderProps = {
  title: string;
  showBrand: boolean;
};

export function AppHeader({ title, showBrand }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-muted" style={{ paddingTop: insets.top }}>
      <View
        className="min-h-24 flex-row items-center gap-4 py-3 pl-8"
        style={{ paddingRight: insets.right + 24 }}
      >
        {showBrand ? (
          <Image
            source={brandMark}
            style={{ width: 34, height: 44 }}
            contentFit="contain"
            accessibilityLabel="Nimzo"
          />
        ) : null}
        <View className="flex-1 gap-0.5">
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            className="font-sans-bold text-3xl text-background"
          >
            {title}
          </Text>
          <Text numberOfLines={1} className="font-sans text-base text-background/70">
            {today()}
          </Text>
        </View>
        <ConnectionStatus />
      </View>
    </View>
  );
}
