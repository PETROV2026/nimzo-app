import { Pressable, View } from 'react-native';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type RemoveImageButtonProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export function RemoveImageButton({ label, disabled, onPress }: RemoveImageButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className="absolute -right-3 -top-3 size-14 items-center justify-center"
    >
      {({ pressed }) => (
        <View
          className={`size-10 items-center justify-center rounded-full border-2 border-background ${pressed ? 'bg-destructive' : 'bg-foreground'}`}
        >
          <Icon name="trash-outline" size={20} color={colors.background} />
        </View>
      )}
    </Pressable>
  );
}
