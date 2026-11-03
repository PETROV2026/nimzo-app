import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

const visibleMs = 3500;

const entering = FadeInDown.duration(240).reduceMotion(ReduceMotion.System);
const exiting = FadeOutDown.duration(180).reduceMotion(ReduceMotion.System);

type ToastProps = {
  title: string;
  description?: string;
  onHide: () => void;
};

export function Toast({ title, description, onHide }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onHide, visibleMs);
    return () => clearTimeout(timer);
  }, [onHide]);

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-8 items-center px-6">
      <Animated.View entering={entering} exiting={exiting} className="w-full max-w-[520px]">
        <Pressable
          onPress={onHide}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={description ? `${title}. ${description}` : title}
          accessibilityHint="Toca para cerrar el aviso"
          className="flex-row items-center gap-4 rounded-2xl bg-foreground py-4 pl-4 pr-5 active:opacity-90"
          style={{ elevation: 8 }}
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-success">
            <Icon name="checkmark" size={26} color={colors['on-success']} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-sans-semibold text-lg text-background">{title}</Text>
            {description ? (
              <Text className="font-sans text-sm text-background/80">{description}</Text>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
