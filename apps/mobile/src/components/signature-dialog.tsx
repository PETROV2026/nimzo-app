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
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { Icon } from '@/components/icon';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { colors } from '@/theme';

type SignatureDialogProps = {
  title: string;
  name: string;
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

export function SignatureDialog({ title, name, onSave, onClose }: SignatureDialogProps) {
  const { height } = useWindowDimensions();
  const compact = height < 800;
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

  const pan = usePanGesture({
    enabled: !saving && !confirmingDiscard,
    maxPointers: 1,
    minDistance: 0,
    onBegin: (event) => {
      'worklet';
      const builder = strokeBuilder.get();
      builder
        .reset()
        .moveTo(event.x, event.y)
        .lineTo(event.x + 0.1, event.y);
      lastPoint.set({ x: event.x, y: event.y });
      strokePath.set(builder.build());
      scheduleOnRN(startStroke);
    },
    onUpdate: (event) => {
      'worklet';
      const builder = strokeBuilder.get();
      const last = lastPoint.get();
      builder.quadTo(last.x, last.y, (last.x + event.x) / 2, (last.y + event.y) / 2);
      lastPoint.set({ x: event.x, y: event.y });
      strokePath.set(builder.build());
    },
    onFinalize: () => {
      'worklet';
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
    },
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
          <View
            className={`w-full rounded-3xl bg-background ${compact ? 'max-w-[760px] gap-4 p-6' : 'max-w-[880px] gap-6 p-8'}`}
          >
            <DialogHeader
              title={title}
              description="Se incluirá en cada reporte que envíes."
              onClose={handleClose}
              disabled={saving}
            />

            <View className="gap-2">
              <View
                className={`overflow-hidden rounded-xl border-2 ${hasInk ? 'border-border' : 'border-dashed border-border-strong'} ${compact ? 'h-56' : 'h-72'}`}
              >
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
                  <Text numberOfLines={1} className="text-center font-sans text-sm text-muted">
                    {name}
                  </Text>
                </View>
                {hasInk ? (
                  <Pressable
                    onPress={handleClear}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Borrar firma y empezar de nuevo"
                    className="absolute right-2 top-2 min-h-14 flex-row items-center gap-2 rounded-lg bg-background px-4 active:bg-border"
                  >
                    <Icon name="trash-outline" size={20} color={colors['primary-strong']} />
                    <Text className="font-sans-semibold text-base text-primary-strong">Borrar</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">
                {!hasInk
                  ? 'Usa todo el espacio: una firma grande se lee mejor en el reporte.'
                  : canSave
                    ? 'Revisa que se lea bien antes de guardarla.'
                    : 'Haz la firma un poco más grande para poder guardarla.'}
              </Text>
            </View>

            {error ? (
              <Text accessibilityRole="alert" className="font-sans text-base text-destructive">
                {error}
              </Text>
            ) : null}

            {confirmingDiscard ? (
              <View className="gap-4">
                <Text className="font-sans-medium text-lg text-foreground">
                  ¿Descartar la firma que dibujaste?
                </Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      variant="secondary"
                      label="Seguir firmando"
                      onPress={() => setConfirmingDiscard(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button variant="destructive" label="Descartar" onPress={onClose} />
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-3">
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
                    variant="success"
                    onPress={handleSave}
                    disabled={!canSave}
                    loading={saving}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
