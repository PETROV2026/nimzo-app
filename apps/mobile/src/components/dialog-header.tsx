import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';

type DialogHeaderProps = {
  title: string;
  description?: string;
  onClose: () => void;
  disabled?: boolean;
};

export function DialogHeader({ title, description, onClose, disabled }: DialogHeaderProps) {
  return (
    <View className="gap-6">
      <View className="flex-row items-center justify-between gap-4">
        <Text accessibilityRole="header" className="flex-1 font-sans-bold text-2xl text-foreground">
          {title}
        </Text>
        <Pressable
          onPress={onClose}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          className={`min-h-14 flex-row items-center gap-2 rounded-lg px-3 active:bg-surface ${disabled ? 'opacity-50' : ''}`}
        >
          <MaterialIcons name="close" size={24} color={colors.muted} />
          <Text className="font-sans-medium text-base text-muted">Cerrar</Text>
        </Pressable>
      </View>
      {description ? <Text className="font-sans text-base text-muted">{description}</Text> : null}
    </View>
  );
}
