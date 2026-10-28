import { Canvas, Path, useCanvasRef } from '@shopify/react-native-skia';
import { useState } from 'react';
import { Modal, Text, View, type GestureResponderEvent } from 'react-native';
import { useSession } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { colors } from '@/theme/colors';

type SignatureDialogProps = {
  onClose: () => void;
};

type Drawing = {
  done: string[];
  current: string | null;
};

const emptyDrawing: Drawing = { done: [], current: null };

const strokeStyle = {
  color: colors.foreground,
  style: 'stroke',
  strokeWidth: 3,
  strokeCap: 'round',
  strokeJoin: 'round',
} as const;

export function SignatureDialog({ onClose }: SignatureDialogProps) {
  const { saveSignature } = useSession();
  const canvasRef = useCanvasRef();
  const [drawing, setDrawing] = useState<Drawing>(emptyDrawing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStrokes = drawing.done.length > 0;

  function handleStart(event: GestureResponderEvent) {
    const { locationX: x, locationY: y } = event.nativeEvent;
    setError(null);
    setDrawing((previous) => ({ ...previous, current: `M${x} ${y} L${x + 0.1} ${y}` }));
  }

  function handleMove(event: GestureResponderEvent) {
    const { locationX: x, locationY: y } = event.nativeEvent;
    setDrawing((previous) =>
      previous.current ? { ...previous, current: `${previous.current} L${x} ${y}` } : previous,
    );
  }

  function handleEnd() {
    setDrawing((previous) =>
      previous.current ? { done: [...previous.done, previous.current], current: null } : previous,
    );
  }

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
      <View className="flex-1 items-center justify-center bg-foreground/40 p-4">
        <View className="w-full max-w-[880px] gap-5 rounded-2xl bg-background p-6">
          <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
            Mi firma
          </Text>
          <View
            className="h-[320px] overflow-hidden rounded-md border-2 border-dashed border-border-strong"
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={handleStart}
            onResponderMove={handleMove}
            onResponderRelease={handleEnd}
            onResponderTerminate={handleEnd}
          >
            <Canvas ref={canvasRef} style={{ flex: 1 }}>
              {drawing.done.map((stroke, index) => (
                <Path key={index} path={stroke} {...strokeStyle} />
              ))}
              {drawing.current ? <Path path={drawing.current} {...strokeStyle} /> : null}
            </Canvas>
            {hasStrokes || drawing.current ? null : (
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
                onPress={() => setDrawing(emptyDrawing)}
                disabled={!hasStrokes || saving}
              />
            </View>
            <View className="max-w-[396px] flex-[2] flex-row gap-4">
              <View className="flex-1">
                <Button variant="secondary" label="Cancelar" onPress={onClose} disabled={saving} />
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
    </Modal>
  );
}