import {
  Canvas,
  PaintStyle,
  Path,
  Skia,
  StrokeCap,
  StrokeJoin,
  type SkPath,
  type SkPathBuilder,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { Button } from '@/components/button';
import { colors } from '@/theme/colors';

type SignatureDialogProps = {
  title: string;
  onSave: (png: Uint8Array) => Promise<string | null>;
  onClose: () => void;
};

type Ink = { svg: string; x: number; y: number; width: number; height: number };

const strokeWidth = 3.5;
const strokeStyle = {
  color: colors.foreground,
  style: 'stroke',
  strokeWidth,
  strokeCap: 'round',
  strokeJoin: 'round',
} as const;

const minimumInkSize = 24;
const exportPadding = 12;
const exportScale = 2;
const exportMaxWidth = 1200;

function renderSignaturePng(ink: Ink) {
  const path = Skia.Path.MakeFromSVGString(ink.svg);
  if (!path) return null;
  const scale = Math.min(exportScale, exportMaxWidth / (ink.width + exportPadding * 2));
  const width = Math.ceil((ink.width + exportPadding * 2) * scale);
  const height = Math.ceil((ink.height + exportPadding * 2) * scale);
  const surface = Skia.Surface.Make(width, height);
  if (!surface) return null;
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(colors.foreground));
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(strokeWidth);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  canvas.scale(scale, scale);
  canvas.translate(exportPadding - ink.x, exportPadding - ink.y);
  canvas.drawPath(path, paint);
  surface.flush();
  return surface.makeImageSnapshot().encodeToBytes();
}

export function SignatureDialog({ title, onSave, onClose }: SignatureDialogProps) {
  const inkBuilder = useSharedValue<SkPathBuilder>(Skia.PathBuilder.Make());
  const strokeBuilder = useSharedValue<SkPathBuilder>(Skia.PathBuilder.Make());
  const inkPath = useSharedValue<SkPath>(Skia.Path.Make());
  const strokePath = useSharedValue<SkPath>(Skia.Path.Make());
  const lastPoint = useSharedValue({ x: 0, y: 0 });
  const [ink, setInk] = useState<Ink | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const hasInk = ink !== null;
  const canSave = !!ink && ink.width + ink.height >= minimumInkSize;

  function startStroke() {
    setError(null);
    setDrawing(true);
  }

  function handleClear() {
    scheduleOnUI(() => {
      'worklet';
      inkBuilder.get().reset();
      strokeBuilder.get().reset();
      inkPath.set(Skia.Path.Make());
      strokePath.set(Skia.Path.Make());
    });
    setInk(null);
    setDrawing(false);
  }

  function handleClose() {
    if (saving) return;
    if (hasInk && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  }

  const pan = Gesture.Pan()
    .enabled(!saving && !confirmingDiscard)
    .maxPointers(1)
    .minDistance(0)
    .onBegin((event) => {
      const builder = strokeBuilder.get();
      builder
        .reset()
        .moveTo(event.x, event.y)
        .lineTo(event.x + 0.1, event.y);
      lastPoint.set({ x: event.x, y: event.y });
      strokePath.set(builder.build());
      scheduleOnRN(startStroke);
    })
    .onUpdate((event) => {
      const builder = strokeBuilder.get();
      const last = lastPoint.get();
      builder.quadTo(last.x, last.y, (last.x + event.x) / 2, (last.y + event.y) / 2);
      lastPoint.set({ x: event.x, y: event.y });
      strokePath.set(builder.build());
    })
    .onFinalize(() => {
      const builder = strokeBuilder.get();
      if (builder.isEmpty()) return;
      const last = lastPoint.get();
      const stroke = builder.lineTo(last.x, last.y).detach();
      const allInk = inkBuilder.get().addPath(stroke).build();
      inkPath.set(allInk);
      strokePath.set(Skia.Path.Make());
      const bounds = allInk.computeTightBounds();
      scheduleOnRN(setInk, {
        svg: allInk.toSVGString(),
        x: bounds.x - strokeWidth,
        y: bounds.y - strokeWidth,
        width: bounds.width + strokeWidth * 2,
        height: bounds.height + strokeWidth * 2,
      });
    });

  async function handleSave() {
    if (!ink) return;
    const png = renderSignaturePng(ink);
    if (!png) {
      setError('No se pudo leer la firma. Intenta de nuevo.');
      return;
    }
    setSaving(true);
    let result: string | null;
    try {
      result = await onSave(png);
    } catch {
      result = 'No se pudo guardar la firma. Intenta de nuevo.';
    } finally {
      setSaving(false);
    }
    if (result) {
      setError(result);
      return;
    }
    onClose();
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={handleClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-foreground/40 p-4">
          <View className="w-full max-w-[880px] gap-5 rounded-2xl bg-background p-6">
            <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
              {title}
            </Text>
            <View className="h-[320px] overflow-hidden rounded-md border-2 border-dashed border-border-strong">
              <GestureDetector gesture={pan}>
                <Canvas style={{ flex: 1 }}>
                  <Path path={inkPath} {...strokeStyle} />
                  <Path path={strokePath} {...strokeStyle} />
                </Canvas>
              </GestureDetector>
              {hasInk || drawing ? null : (
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
            {confirmingDiscard ? (
              <View className="flex-row items-center justify-between gap-4">
                <Text className="flex-1 font-sans-medium text-lg text-foreground">
                  ¿Descartar la firma que dibujaste?
                </Text>
                <View className="w-[190px]">
                  <Button
                    variant="secondary"
                    label="Seguir firmando"
                    onPress={() => setConfirmingDiscard(false)}
                  />
                </View>
                <View className="w-[190px]">
                  <Button label="Descartar" onPress={onClose} />
                </View>
              </View>
            ) : (
              <View className="flex-row justify-between gap-4">
                <View className="max-w-[190px] flex-1">
                  <Button
                    variant="secondary"
                    label="Limpiar"
                    onPress={handleClear}
                    disabled={!hasInk || saving}
                  />
                </View>
                <View className="max-w-[396px] flex-[2] flex-row gap-4">
                  <View className="flex-1">
                    <Button
                      variant="secondary"
                      label="Cancelar"
                      onPress={handleClose}
                      disabled={saving}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Guardar firma"
                      onPress={handleSave}
                      disabled={!canSave}
                      loading={saving}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
