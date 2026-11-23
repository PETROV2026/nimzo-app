export type ChartPoint = { x: number; y: number };

export type PumpChartData = {
  nameplate: ChartPoint[];
  minimum: ChartPoint[];
  test: ChartPoint[];
  adjusted: boolean;
  xMax: number;
  yMax: number;
};

type Values = Record<string, unknown>;

const minimumShare = 0.95;
const xStep = 25;

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const number = Number(value.trim().replace(',', '.'));
  return Number.isFinite(number) ? number : undefined;
}

function roundUp(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

export function pumpChartData(values: Values): PumpChartData | undefined {
  const ratedFlow = toNumber(values.rated_flow);
  const ratedPressure = toNumber(values.rated_pressure);
  if (!ratedFlow || ratedFlow <= 0 || ratedPressure === undefined) return undefined;

  const nameplate = [
    { x: 0, y: toNumber(values.max_pressure) },
    { x: 100, y: ratedPressure },
    { x: 150, y: toNumber(values.pressure_150) },
  ].filter((point): point is ChartPoint => point.y !== undefined);
  const minimum = nameplate.map((point) => ({ x: point.x, y: point.y * minimumShare }));

  const ratedSpeed = toNumber(values.rated_speed);
  const runs =
    values.performance_runs && typeof values.performance_runs === 'object'
      ? Object.values(values.performance_runs as Record<string, Values>)
      : [];
  let adjusted = false;
  const test = runs
    .flatMap((run): ChartPoint[] => {
      const flow = toNumber(run?.flow_gpm);
      const discharge = toNumber(run?.discharge_pressure);
      const suction = toNumber(run?.suction_pressure) ?? 0;
      if (flow === undefined || discharge === undefined) return [];
      const speed = toNumber(run?.speed);
      const factor = ratedSpeed && speed && speed > 0 ? ratedSpeed / speed : 1;
      if (factor !== 1) adjusted = true;
      return [{ x: ((flow * factor) / ratedFlow) * 100, y: (discharge - suction) * factor ** 2 }];
    })
    .sort((a, b) => a.x - b.x);

  const points = [...nameplate, ...test];
  const xMax = roundUp(Math.max(150, ...points.map((point) => point.x)) + 1, xStep);
  const highest = Math.max(ratedPressure, ...points.map((point) => point.y)) * 1.1;
  const yMax = roundUp(highest, highest > 200 ? 50 : 25);

  return { nameplate, minimum, test, adjusted, xMax, yMax };
}
