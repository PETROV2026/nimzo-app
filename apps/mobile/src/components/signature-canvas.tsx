import { Canvas, Path } from '@shopify/react-native-skia';
import { Pressable, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { Icon } from '@/components/icon';
import { strokeStyle, type SignatureInk } from '@/lib/signature-ink';
import { colors } from '@/theme';

type ClearSignatureButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function ClearSignatureButton({ onPress, disabled }: ClearSignatureButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Borrar firma y empezar de nuevo"
      className="absolute right-2 top-2 min-h-14 flex-row items-center gap-2 rounded-lg px-4 active:bg-border"
    >
      <Icon name="sparkles-outline" size={20} color={colors['primary-strong']} />
      <Text className="font-sans-semibold text-base text-primary-strong">Borrar</Text>
    </Pressable>
  );
}

type SignatureCanvasProps = {
  signature: SignatureInk;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

export function SignatureCanvas({
  signature,
  name,
  disabled,
  invalid,
  className = 'h-56',
}: SignatureCanvasProps) {
  const { pan, inkPath, strokePath, ink, drawing, clear } = signature;
  const hasInk = ink !== null;
  const borderClass = hasInk
    ? 'border-border'
    : invalid
      ? 'border-dashed border-danger'
      : 'border-dashed border-border-strong';

  return (
    <View className={`overflow-hidden rounded-xl border-2 ${borderClass} ${className}`}>
      <GestureDetector gesture={pan}>
        <Canvas style={{ flex: 1 }}>
          <Path path={inkPath} {...strokeStyle} />
          <Path path={strokePath} {...strokeStyle} />
        </Canvas>
      </GestureDetector>
      {hasInk || drawing ? null : (
        <View
          pointerEvents="none"
          className="absolute inset-x-0 top-0 bottom-10 items-center justify-center gap-2"
        >
          <Icon name="create-outline" size={28} color={colors['border-strong']} />
          <Text className="font-sans text-base text-muted">
            Firma aquí con el dedo o con un lápiz
          </Text>
        </View>
      )}
      <View pointerEvents="none" className="absolute inset-x-8 bottom-4 gap-1">
        <View className="h-px bg-border-strong" />
        {name ? (
          <Text numberOfLines={1} className="text-center font-sans text-sm text-muted">
            {name}
          </Text>
        ) : null}
      </View>
      {hasInk ? <ClearSignatureButton onPress={clear} disabled={disabled} /> : null}
    </View>
  );
}
