import { Canvas, Path, useCanvasRef, usePathValue } from '@shopify/react-native-skia';
import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { colors } from '@/theme/colors';

type SignatureDialogProps = {
  onClose: () => void;
};

const strokeStyle = {
  color: colors.foreground,
  style: 'stroke',
  strokeWidth: 3,
  strokeCap: 'round',
  strokeJoin: 'round',
} as const;

function toSvgPath(points: number[]) {
  'worklet';
  let svg = `M${points[0]} ${points[1]}`;
  for (let index = 2; index < points.length; index += 2) {
    svg += ` L${points[index]} ${points[index + 1]}`;
  }
  return svg;
}

export function SignatureDialog({ onClose }: SignatureDialogProps) {
  const { saveSignature } = useSession();
  const canvasRef = useCanvasRef();
  const points = useSharedValue<number[]>([]);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const hasStrokes = strokes.length > 0;

  const currentPath = usePathValue((path) => {
    'worklet';
    const value = points.get();
    if (value.length < 2) return;
    path.moveTo(value[0], value[1]);
    for (let index = 2; index < value.length; index += 2) {
      path.lineTo(value[index], value[index + 1]);
    }
  });

  function addStroke(stroke: string) {
    setError(null);
    setStrokes((previous) => [...previous, stroke]);
  }

  function startStroke() {
    setError(null);
    setTouched(true);
  }

  function handleClear() {
    points.set([]);
    setStrokes([]);
    setTouched(false);
  }

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      points.set([event.x, event.y, event.x + 0.1, event.y]);
      scheduleOnRN(startStroke);
    })
    .onUpdate((event) => {
      points.modify((value) => {
        'worklet';
        value.push(event.x, event.y);
        return value;
      });
    })
    .onFinalize(() => {
      const value = points.get();
      if (value.length > 0) scheduleOnRN(addStroke, toSvgPath(value));
    });

  async function handleSave() {
    const png = canvasRef.current?.makeImageSnapshot().encodeToBytes();
    if (!png) return;
    setSaving(true);
    const result = await saveSignature(png);
    setSaving(false);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-foreground/40 p-4">
          <View className="w-full max-w-[880px] gap-5 rounded-2xl bg-background p-6">
            <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
              Mi firma
            </Text>
            <View className="h-[320px] overflow-hidden rounded-md border-2 border-dashed border-border-strong">
              <GestureDetector gesture={pan}>
                <Canvas ref={canvasRef} style={{ flex: 1 }}>
                  {strokes.map((stroke, index) => (
                    <Path key={index} path={stroke} {...strokeStyle} />
                  ))}
                  <Path path={currentPath} {...strokeStyle} />
                </Canvas>
              </GestureDetector>
              {hasStrokes || touched ? null : (
                <Text
                  pointerEvents="none"
                  className="absolute inset-x-0 top-28 text-center font-sans text-base text-muted"
                >
                  Firma aquí con el dedo o con el lápiz
                </Text>
              )}
              <View
                pointerEvents="none"
                className="absolute inset-x-8 bottom-12 h-px bg-border-strong"
              />
              <Text
                pointerEvents="none"
                className="absolute bottom-14 left-8 font-sans text-lg text-muted"
              >
                ×
              </Text>
            </View>
            {error ? (
              <Text accessibilityRole="alert" className="font-sans text-base text-danger-strong">
                {error}
              </Text>
            ) : null}
            <View className="flex-row justify-between gap-4">
              <View className="max-w-[190px] flex-1">
                <Button
                  variant="secondary"
                  label="Limpiar"
                  onPress={handleClear}
                  disabled={!hasStrokes || saving}
                />
              </View>
              <View className="max-w-[396px] flex-[2] flex-row gap-4">
                <View className="flex-1">
                  <Button
                    variant="secondary"
                    label="Cancelar"
                    onPress={onClose}
                    disabled={saving}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    variant="success"
                    label="Guardar firma"
                    onPress={handleSave}
                    disabled={!hasStrokes}
                    loading={saving}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
