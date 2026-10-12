import { reportStatusLabels, reportStatusSchema } from '@nimzo/shared';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder screen. Confirms the app runs, NativeWind styles apply and @nimzo/shared resolves.
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-4 p-8">
        <Text className="text-3xl font-semibold text-neutral-900">Nimzo</Text>
        <Text className="text-base text-neutral-500">Estados del reporte:</Text>
        <View className="flex-row flex-wrap justify-center gap-2">
          {reportStatusSchema.options.map((status) => (
            <Text
              key={status}
              className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-700"
            >
              {reportStatusLabels[status]}
            </Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
