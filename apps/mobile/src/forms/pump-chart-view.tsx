import { Canvas, Circle, DashPathEffect, Path, Skia } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useController, useWatch } from 'react-hook-form';
import { DialogHeader } from '@/components/dialog-header';
import { Icon } from '@/components/icon';
import { TextAction } from '@/components/text-action';
import type { FormValues } from '@/forms/form-values';
import {
  type ChartPoint,
  type PumpChartData,
  pumpChartData,
  type RunResult,
} from '@/forms/pump-chart';
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

const verdictField = 'chart_result';
const chartHeight = 380;
const padding = { left: 56, right: 20, top: 28, bottom: 44 };

const series = {
  test: { label: 'Desempeño en prueba', color: colors.accent },
  adjusted: { label: 'Ajuste de velocidad', color: colors['primary-strong'] },
  factory: { label: 'Datos de fábrica', color: colors.foreground },
  acceptance: { label: 'Aceptación NFPA 25 (−5 %)', color: colors.danger },
};

const formatter = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
const format = (value: number | undefined) => (value === undefined ? '—' : formatter.format(value));

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

function ResultsTable({ runs }: { runs: RunResult[] }) {
  const columns = [
    'Corrida',
    'Flujo (GPM)',
    'Flujo ajustado (GPM)',
    'Neta (PSI)',
    'Presión ajustada (PSI)',
    'Mínimo (PSI)',
    'Resultado',
  ];
  return (
    <View className="overflow-hidden rounded-xl border border-border">
      <View className="flex-row bg-surface">
        {columns.map((column) => (
          <Text
            key={column}
            className="flex-1 px-3 py-2 font-sans-semibold text-sm text-foreground"
          >
            {column}
          </Text>
        ))}
      </View>
      {runs.map((run) => (
        <View key={run.id} className="flex-row items-center border-t border-border">
          <Text className="flex-1 px-3 py-2 font-sans-medium text-sm text-foreground">
            {run.label}
          </Text>
          <Text className="flex-1 px-3 py-2 font-sans text-sm text-foreground">
            {format(run.flow)}
          </Text>
          <Text className="flex-1 px-3 py-2 font-sans-semibold text-sm text-foreground">
            {format(run.adjustedFlow)}
          </Text>
          <Text className="flex-1 px-3 py-2 font-sans text-sm text-foreground">
            {format(run.net)}
          </Text>
          <Text className="flex-1 px-3 py-2 font-sans-semibold text-sm text-foreground">
            {format(run.adjusted)}
          </Text>
          <Text className="flex-1 px-3 py-2 font-sans text-sm text-foreground">
            {format(run.minimum)}
          </Text>
          <View className="flex-1 px-3 py-2">
            {run.passed === undefined ? (
              <Text className="font-sans text-sm text-muted">Sin datos de placa</Text>
            ) : (
              <View
                className={`self-start rounded-full px-2.5 py-0.5 ${run.passed ? 'bg-success' : 'bg-danger-strong'}`}
              >
                <Text
                  className={`font-sans-semibold text-xs ${run.passed ? 'text-on-success' : 'text-on-danger'}`}
                >
                  {run.passed ? 'Cumple' : 'No cumple'}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function Verdict({ verdict }: { verdict: 'acceptable' | 'not_acceptable' }) {
  const { field } = useController<FormValues>({ name: verdictField });
  const acceptable = verdict === 'acceptable';
  const applied = field.value === verdict;
  return (
    <View
      className={`flex-row flex-wrap items-center gap-3 rounded-lg px-4 py-3 ${acceptable ? 'bg-success/10' : 'bg-danger/10'}`}
    >
      <Text className="flex-1 font-sans-medium text-base text-foreground">
        {acceptable
          ? 'Todas las corridas cumplen con el 95 % de la curva de fábrica. Resultado sugerido: Aceptable.'
          : 'Al menos una corrida queda debajo del 95 % de la curva de fábrica. Resultado sugerido: No aceptable.'}
      </Text>
      {applied ? (
        <Text className="font-sans-semibold text-sm text-muted">Resultado aplicado</Text>
      ) : (
        <TextAction label="Usar este resultado" onPress={() => field.onChange(verdict)} />
      )}
    </View>
  );
}

function ChartPlot({ data, large }: { data: PumpChartData; large?: boolean }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const tickText = large ? 'text-sm' : 'text-xs';
  const plotWidth = Math.max(0, size.width - padding.left - padding.right);
  const plotHeight = Math.max(0, size.height - padding.top - padding.bottom);

  const drawing = useMemo(() => {
    if (plotWidth <= 0 || plotHeight <= 0) return null;
    const { maxX, xStep, maxY, yStep } = data.axes;
    const px = (x: number) => padding.left + (x / maxX) * plotWidth;
    const py = (y: number) => padding.top + (1 - y / maxY) * plotHeight;
    const line = (points: ChartPoint[]) => {
      const path = Skia.PathBuilder.Make();
      points.forEach((point, index) => {
        if (index === 0) path.moveTo(px(point.x), py(point.y));
        else path.lineTo(px(point.x), py(point.y));
      });
      return path.build();
    };
    const xTicks = Array.from({ length: Math.floor(maxX / xStep + 1e-9) + 1 }, (_, i) => i * xStep);
    const yTicks = Array.from({ length: Math.floor(maxY / yStep + 1e-9) + 1 }, (_, i) => i * yStep);
    const grid = Skia.PathBuilder.Make();
    for (const tick of xTicks) {
      grid.moveTo(px(tick), py(0));
      grid.lineTo(px(tick), py(maxY));
    }
    for (const tick of yTicks) {
      grid.moveTo(px(0), py(tick));
      grid.lineTo(px(maxX), py(tick));
    }
    const axes = Skia.PathBuilder.Make();
    axes.moveTo(px(0), py(maxY));
    axes.lineTo(px(0), py(0));
    axes.lineTo(px(maxX), py(0));
    return {
      px,
      py,
      xTicks,
      yTicks,
      grid: grid.build(),
      axes: axes.build(),
      test: line(data.test),
      adjusted: line(data.adjusted),
      factory: line(data.factory),
      acceptance: line(data.acceptance),
    };
  }, [data, plotHeight, plotWidth]);

  return (
    <View
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
      style={large ? { flex: 1 } : { height: chartHeight }}
      accessible
      accessibilityLabel={`Curva de desempeño, flujo contra presión, con ${data.runs.length} corridas`}
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
              path={drawing.acceptance}
              style="stroke"
              strokeWidth={2.5}
              color={series.acceptance.color}
            >
              <DashPathEffect intervals={[10, 8]} />
            </Path>
            <Path
              path={drawing.factory}
              style="stroke"
              strokeWidth={2.5}
              color={series.factory.color}
            />
            {data.factory.map((point) => (
              <Circle
                key={`f-${point.x}`}
                cx={drawing.px(point.x)}
                cy={drawing.py(point.y)}
                r={4.5}
                color={series.factory.color}
              />
            ))}
            <Path path={drawing.test} style="stroke" strokeWidth={2.5} color={series.test.color} />
            {data.test.map((point, index) => (
              <Circle
                key={`t-${index}`}
                cx={drawing.px(point.x)}
                cy={drawing.py(point.y)}
                r={4.5}
                color={series.test.color}
              />
            ))}
            <Path
              path={drawing.adjusted}
              style="stroke"
              strokeWidth={3}
              color={series.adjusted.color}
            />
            {data.runs
              .slice()
              .sort((a, b) => a.adjustedFlow - b.adjustedFlow)
              .map((run) => (
                <Circle
                  key={`a-${run.id}`}
                  cx={drawing.px(run.adjustedFlow)}
                  cy={drawing.py(run.adjusted)}
                  r={6.5}
                  color={run.passed === false ? colors['danger-strong'] : series.adjusted.color}
                />
              ))}
          </Canvas>
          <View pointerEvents="none" className="absolute inset-0">
            {drawing.yTicks.map((tick) => (
              <Text
                key={`y-${tick}`}
                className={`absolute w-12 text-right font-sans text-muted ${tickText}`}
                style={{ left: 0, top: drawing.py(tick) - 8 }}
              >
                {format(tick)}
              </Text>
            ))}
            {drawing.xTicks.map((tick) => (
              <Text
                key={`x-${tick}`}
                className={`absolute w-16 text-center font-sans text-muted ${tickText}`}
                style={{ left: drawing.px(tick) - 32, top: size.height - padding.bottom + 6 }}
              >
                {format(tick)}
              </Text>
            ))}
            <Text
              className="absolute font-sans-medium text-sm text-foreground"
              style={{ left: padding.left, bottom: 0 }}
            >
              Flujo (GPM)
            </Text>
            <Text
              className="absolute font-sans-medium text-sm text-foreground"
              style={{ left: padding.left, top: 0 }}
            >
              Presión neta (PSI)
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function Legend() {
  return (
    <View className="flex-row flex-wrap gap-x-6 gap-y-2">
      {Object.entries(series).map(([key, item]) => (
        <View key={key} className="flex-row items-center gap-2">
          <LegendLine color={item.color} dashed={key === 'acceptance'} />
          <Text className="font-sans text-sm text-foreground">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function ChartDialog({
  title,
  data,
  onClose,
}: {
  title: string;
  data: PumpChartData;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-foreground/40 p-6">
        <View className="flex-1 gap-5 rounded-3xl bg-background p-6">
          <DialogHeader title={title} onClose={onClose} />
          <ChartPlot data={data} large />
          <Legend />
        </View>
      </View>
    </Modal>
  );
}

export function PumpPerformanceChart({ title }: { title: string }) {
  const watched: readonly unknown[] = useWatch<FormValues>({ name: sources });
  const [enlarged, setEnlarged] = useState(false);
  const data = useMemo(
    () => pumpChartData(Object.fromEntries(sources.map((name, index) => [name, watched[index]]))),
    [watched],
  );

  return (
    <View className="gap-4 rounded-xl border border-border bg-background p-5">
      <View className="flex-row items-center gap-4">
        <Text
          accessibilityRole="header"
          className="flex-1 font-sans-semibold text-lg text-foreground"
        >
          {title}
        </Text>
        {data ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ampliar la gráfica"
            onPress={() => setEnlarged(true)}
            className="min-h-14 flex-row items-center gap-2 rounded-lg border-2 border-border-strong px-4 active:bg-surface"
          >
            <Icon name="expand-outline" size={20} color={colors.foreground} />
            <Text className="font-sans-semibold text-base text-foreground">Ampliar</Text>
          </Pressable>
        ) : null}
      </View>
      {!data ? (
        <NoteNode
          tone="info"
          text="Escribe el flujo y la presión nominales en «Datos del equipo», y las lecturas de cada corrida, para ver la gráfica."
        />
      ) : (
        <>
          <ChartPlot data={data} />
          <Legend />
          {data.runs.length > 0 ? (
            <ResultsTable runs={data.runs} />
          ) : (
            <Text className="font-sans text-sm text-muted">
              Llena el flujo, la succión y la descarga de cada corrida en la tabla de desempeño para
              dibujar la curva de la prueba.
            </Text>
          )}
          {data.verdict ? <Verdict verdict={data.verdict} /> : null}
          {enlarged ? (
            <ChartDialog title={title} data={data} onClose={() => setEnlarged(false)} />
          ) : null}
        </>
      )}
    </View>
  );
}
