import { reportStatusLabels, reportStatusSchema } from '@nimzo/shared';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 p-8">
        <Image
          source={require('@nimzo/brand/logos/logo-horizontal-color.webp')}
          style={{ width: 240, height: 93 }}
          contentFit="contain"
          accessibilityLabel="Nimzo"
        />
        <Text className="text-base text-muted">Estados del reporte:</Text>
        <View className="flex-row flex-wrap justify-center gap-2">
          {reportStatusSchema.options.map((status) => (
            <Text
              key={status}
              className="rounded-md border border-border-strong px-3 py-1 text-sm text-foreground"
            >
              {reportStatusLabels[status]}
            </Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
