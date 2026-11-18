import { Pressable, TextInput, View } from 'react-native';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel?: string;
  autoFocus?: boolean;
};

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel = placeholder,
  autoFocus,
}: SearchFieldProps) {
  return (
    <View className="min-h-14 flex-row items-center gap-2 rounded-xl border-2 border-border bg-background px-3">
      <Icon name="search" size={24} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={accessibilityLabel}
        returnKeyType="search"
        autoFocus={autoFocus}
        disableFullscreenUI
        className="min-h-14 flex-1 font-sans text-lg text-foreground"
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
          className="-mr-2 min-h-14 min-w-14 items-center justify-center"
        >
          <Icon name="close-circle" size={24} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}