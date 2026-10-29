import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
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
      <MaterialIcons name="cloud-off" size={22} color={colors['on-accent']} />
      <Text className="font-sans-medium text-sm text-on-accent">Sin conexión</Text>
    </View>
  );
}
