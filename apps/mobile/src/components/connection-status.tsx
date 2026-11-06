import { Text, View } from 'react-native';
import { Icon } from '@/components/icon';
import { useOnline } from '@/lib/use-online';
import { colors } from '@/theme';

export function ConnectionStatus() {
  const online = useOnline();
  if (online) return null;

  return (
    <View
      accessible
      accessibilityLabel="Sin conexión a internet"
      accessibilityLiveRegion="polite"
      className="mr-4 min-h-9 flex-row items-center gap-2 rounded-full bg-accent px-3"
    >
      <Icon name="cloud-offline-outline" size={22} color={colors['on-accent']} />
      <Text className="font-sans-medium text-sm text-on-accent">Sin conexión</Text>
    </View>
  );
}
