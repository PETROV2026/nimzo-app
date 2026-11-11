import {
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  type SkPath,
  type SkPathBuilder,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { usePanGesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { colors } from '@/theme';

export type Ink = { svg: string; x: number; y: number; width: number; height: number };

const strokeWidth = 3.5;
const minimumInkSize = 24;
const exportPadding = 12;
const exportScale = 2;
const exportMaxWidth = 1200;

export const strokeStyle = {
  color: colors.foreground,
  style: 'stroke',
  strokeWidth,
  strokeCap: 'round',
  strokeJoin: 'round',
} as const;

export function renderSignaturePng(ink: Ink) {
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

type SignatureInkOptions = {
  enabled: boolean;
  onStrokeStart?: () => void;
  onStrokeEnd?: () => void;
};

export function useSignatureInk({ enabled, onStrokeStart, onStrokeEnd }: SignatureInkOptions) {
  const inkBuilder = useSharedValue<SkPathBuilder>(Skia.PathBuilder.Make());
  const strokeBuilder = useSharedValue<SkPathBuilder>(Skia.PathBuilder.Make());
  const inkPath = useSharedValue<SkPath>(Skia.Path.Make());
  const strokePath = useSharedValue<SkPath>(Skia.Path.Make());
  const lastPoint = useSharedValue({ x: 0, y: 0 });
  const [ink, setInk] = useState<Ink | null>(null);
  const [drawing, setDrawing] = useState(false);

  function startStroke() {
    setDrawing(true);
    onStrokeStart?.();
  }

  function endStroke() {
    onStrokeEnd?.();
  }

  function clear() {
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

  const pan = usePanGesture({
    enabled,
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
      if (!builder.isEmpty()) {
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
      }
      scheduleOnRN(endStroke);
    },
  });

  return {
    pan,
    inkPath,
    strokePath,
    ink,
    drawing,
    clear,
    readable: ink !== null && ink.width + ink.height >= minimumInkSize,
  };
}

export type SignatureInk = ReturnType<typeof useSignatureInk>;

export function signatureHint(hasInk: boolean, readable: boolean, action: 'save' | 'accept') {
  if (!hasInk) return 'Usa todo el recuadro: una firma grande se lee mejor en el reporte.';
  if (!readable) {
    return `Haz la firma un poco más grande para poder ${action === 'save' ? 'guardarla' : 'aceptarla'}.`;
  }
  return action === 'save'
    ? 'Verifica que la firma sea legible antes de guardarla.'
    : 'Verifica que la firma sea legible antes de tocar "Listo".';
}
