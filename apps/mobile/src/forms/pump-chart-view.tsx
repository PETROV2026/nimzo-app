import { Canvas, Circle, DashPathEffect, Path, Skia } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useWatch } from 'react-hook-form';
import type { FormValues } from '@/forms/form-values';
import { type ChartPoint, pumpChartData } from '@/forms/pump-chart';
import { NoteNode } from '@/forms/render-node';
import { colors } from '@/theme';

const sources = [
  'rated_flow',
  'rated_pressure',
  'max_pressure',
  'pressure_150',
  'rated_speed',
  'performance_runs',
];

const chartHeight = 380;
const padding = { left: 56, right: 20, top: 16, bottom: 44 };

function LegendLine({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <View
      className="w-9"
      style={
        dashed
          ? { borderTopWidth: 3, borderStyle: 'dashed', borderColor: color }
          : { height: 3, backgroundColor: color, borderRadius: 2 }
      }
    />
  );
}

export function PumpPerformanceChart({ title }: { title: string }) {
  const watched: readonly unknown[] = useWatch<FormValues>({ name: sources });
  const [width, setWidth] = useState(0);
  const data = useMemo(
    () => pumpChartData(Object.fromEntries(sources.map((name, index) => [name, watched[index]]))),
    [watched],
  );

  const plotWidth = Math.max(0, width - padding.left - padding.right);
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const drawing = useMemo(() => {
    if (!data || plotWidth <= 0) return null;
    const px = (x: number) => padding.left + (x / data.xMax) * plotWidth;
    const py = (y: number) => padding.top + (1 - y / data.yMax) * plotHeight;
    const line = (points: ChartPoint[]) => {
      const path = Skia.PathBuilder.Make();
      points.forEach((point, index) => {
        if (index === 0) path.moveTo(px(point.x), py(point.y));
        else path.lineTo(px(point.x), py(point.y));
      });
      return path.build();
    };
    const yStep = data.yMax <= 150 ? 25 : 50;
    const xTicks = Array.from({ length: data.xMax / 25 + 1 }, (_, index) => index * 25);
    const yTicks = Array.from({ length: data.yMax / yStep + 1 }, (_, index) => index * yStep);
    const grid = Skia.PathBuilder.Make();
    for (const tick of xTicks) {
      grid.moveTo(px(tick), py(0));
      grid.lineTo(px(tick), py(data.yMax));
    }
    for (const tick of yTicks) {
      grid.moveTo(px(0), py(tick));
      grid.lineTo(px(data.xMax), py(tick));
    }
    const axes = Skia.PathBuilder.Make();
    axes.moveTo(px(0), py(data.yMax));
    axes.lineTo(px(0), py(0));
    axes.lineTo(px(data.xMax), py(0));
    return {
      px,
      py,
      xTicks,
      yTicks,
      grid: grid.build(),
      axes: axes.build(),
      nameplate: line(data.nameplate),
      minimum: line(data.minimum),
      test: line(data.test),
    };
  }, [data, plotHeight, plotWidth]);

  return (
    <View className="gap-4 rounded-xl border border-border bg-background p-5">
      <Text accessibilityRole="header" className="font-sans-semibold text-lg text-foreground">
        {title}
      </Text>
      {!data ? (
        <NoteNode
          tone="info"
          text="Escribe el flujo y la presión nominales en «Datos del equipo», y los valores de cada corrida, para ver la gráfica."
        />
      ) : (
        <>
          <View
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            style={{ height: chartHeight }}
            accessible
            accessibilityLabel={`Gráfica de flujo contra presión neta con ${data.test.length} corridas de la prueba`}
          >
            {drawing ? (
              <>
                <Canvas style={{ flex: 1 }}>
                  <Path path={drawing.grid} style="stroke" strokeWidth={1} color={colors.border} />
                  <Path
                    path={drawing.axes}
                    style="stroke"
                    strokeWidth={2}
                    color={colors['border-strong']}
                  />
                  <Path
                    path={drawing.minimum}
                    style="stroke"
                    strokeWidth={2.5}
                    color={colors.danger}
                  >
                    <DashPathEffect intervals={[10, 8]} />
                  </Path>
                  <Path
                    path={drawing.nameplate}
                    style="stroke"
                    strokeWidth={3}
                    color={colors.muted}
                  />
                  {data.nameplate.map((point) => (
                    <Circle
                      key={`n-${point.x}`}
                      cx={drawing.px(point.x)}
                      cy={drawing.py(point.y)}
                      r={5}
                      color={colors.muted}
                    />
                  ))}
                  <Path
                    path={drawing.test}
                    style="stroke"
                    strokeWidth={3}
                    color={colors['primary-strong']}
                  />
                  {data.test.map((point, index) => (
                    <Circle
                      key={`t-${index}`}
                      cx={drawing.px(point.x)}
                      cy={drawing.py(point.y)}
                      r={6}
                      color={colors['primary-strong']}
                    />
                  ))}
                </Canvas>
                <View pointerEvents="none" className="absolute inset-0">
                  {drawing.yTicks.map((tick) => (
                    <Text
                      key={`y-${tick}`}
                      className="absolute w-12 text-right font-sans text-xs text-muted"
                      style={{ left: 0, top: drawing.py(tick) - 8 }}
                    >
                      {tick}
                    </Text>
                  ))}
                  {drawing.xTicks.map((tick) => (
                    <Text
                      key={`x-${tick}`}
                      className="absolute w-12 text-center font-sans text-xs text-muted"
                      style={{ left: drawing.px(tick) - 24, top: chartHeight - padding.bottom + 6 }}
                    >
                      {tick}%
                    </Text>
                  ))}
                  <Text
                    className="absolute font-sans-medium text-sm text-foreground"
                    style={{ left: padding.left, bottom: 0 }}
                  >
                    Flujo (% del nominal)
                  </Text>
                  <Text
                    className="absolute font-sans-medium text-sm text-foreground"
                    style={{ left: padding.left + 8, top: padding.top }}
                  >
                    Presión neta (PSI)
                  </Text>
                </View>
              </>
            ) : null}
          </View>
          <View className="flex-row flex-wrap gap-x-6 gap-y-2">
            <View className="flex-row items-center gap-2">
              <LegendLine color={colors.muted} />
              <Text className="font-sans text-sm text-foreground">Curva de placa</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <LegendLine color={colors.danger} dashed />
              <Text className="font-sans text-sm text-foreground">Mínimo aceptable (95 %)</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <LegendLine color={colors['primary-strong']} />
              <Text className="font-sans text-sm text-foreground">
                {data.adjusted ? 'Prueba, ajustada a velocidad nominal' : 'Prueba'}
              </Text>
            </View>
          </View>
          {data.test.length === 0 ? (
            <Text className="font-sans text-sm text-muted">
              Llena las corridas en la tabla de desempeño para dibujar la curva de la prueba.
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}
