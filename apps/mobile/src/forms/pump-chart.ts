export type ChartPoint = { x: number; y: number };

export type RunResult = {
  id: string;
  label: string;
  flow: number;
  net: number;
  adjusted: number;
  expected?: number;
  minimum?: number;
  passed?: boolean;
};

export type ChartAxes = { maxX: number; xStep: number; maxY: number; yStep: number };

export type PumpVerdict = 'acceptable' | 'not_acceptable';

export type PumpChartData = {
  runs: RunResult[];
  test: ChartPoint[];
  adjusted: ChartPoint[];
  factory: ChartPoint[];
  acceptance: ChartPoint[];
  axes: ChartAxes;
  verdict?: PumpVerdict;
};

type Values = Record<string, unknown>;

const acceptanceShare = 0.95;

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const number = Number(value.trim().replace(',', '.'));
  return Number.isFinite(number) ? number : undefined;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function adjustedPressure({
  discharge,
  suction,
  ratedSpeed,
  speed,
}: {
  discharge: number;
  suction: number;
  ratedSpeed?: number;
  speed?: number;
}) {
  const net = discharge - suction;
  if (ratedSpeed === undefined || speed === undefined) return round2(net);
  if (speed === 0) return 0;
  return round2(net * (ratedSpeed / speed) ** 2);
}

export function churnPressure(ratedPressure: number, maxPressure?: number) {
  return maxPressure !== undefined && maxPressure > 0 ? maxPressure : ratedPressure * 1.2;
}

export function pressureAt150(ratedPressure: number, plateValue?: number) {
  return plateValue !== undefined && plateValue > 0 ? plateValue : ratedPressure * 0.65;
}

export function expectedFactoryPressure(
  flow: number,
  ratedFlow: number,
  ratedPressure: number,
  churn: number,
  at150: number,
) {
  if (ratedFlow <= 0) return ratedPressure;
  if (flow <= 0) return churn;
  if (flow <= ratedFlow) return churn + (ratedPressure - churn) * (flow / ratedFlow);
  const maxFlow = ratedFlow * 1.5;
  if (flow <= maxFlow) {
    return ratedPressure + (at150 - ratedPressure) * ((flow - ratedFlow) / (maxFlow - ratedFlow));
  }
  const slope = (at150 - ratedPressure) / (maxFlow - ratedFlow);
  return at150 + slope * (flow - maxFlow);
}

export function niceStep(range: number, targetTicks: number) {
  const raw = range / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  for (const multiple of [1, 2, 2.5, 5, 10]) {
    if (raw <= multiple * magnitude) return multiple * magnitude;
  }
  return 10 * magnitude;
}

function runNumber(id: string) {
  const match = /(\d+)$/.exec(id);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function pumpChartData(values: Values): PumpChartData | undefined {
  const ratedFlow = toNumber(values.rated_flow);
  const ratedPressure = toNumber(values.rated_pressure);
  const ratedSpeed = toNumber(values.rated_speed);
  const hasPlate =
    ratedFlow !== undefined && ratedFlow > 0 && ratedPressure !== undefined && ratedPressure > 0;

  const churn = hasPlate ? churnPressure(ratedPressure, toNumber(values.max_pressure)) : 0;
  const at150 = hasPlate ? pressureAt150(ratedPressure, toNumber(values.pressure_150)) : 0;
  const factory: ChartPoint[] = hasPlate
    ? [
        { x: 0, y: churn },
        { x: ratedFlow, y: ratedPressure },
        { x: ratedFlow * 1.5, y: at150 },
      ]
    : [];
  const acceptance = factory.map((point) => ({ x: point.x, y: point.y * acceptanceShare }));

  const table =
    values.performance_runs && typeof values.performance_runs === 'object'
      ? (values.performance_runs as Record<string, Values | undefined>)
      : {};
  const runs = Object.entries(table)
    .sort(([a], [b]) => runNumber(a) - runNumber(b))
    .flatMap(([id, run]): RunResult[] => {
      const flow = toNumber(run?.flow_gpm);
      const discharge = toNumber(run?.discharge_pressure);
      const suction = toNumber(run?.suction_pressure);
      if (flow === undefined || discharge === undefined || suction === undefined) return [];
      const adjusted = adjustedPressure({
        discharge,
        suction,
        ratedSpeed,
        speed: ratedSpeed === undefined ? undefined : toNumber(run?.speed),
      });
      if (adjusted <= 0) return [];
      const label = `Desempeño ${runNumber(id) === Number.MAX_SAFE_INTEGER ? id : runNumber(id)}`;
      if (!hasPlate) return [{ id, label, flow, net: discharge - suction, adjusted }];
      const expected = expectedFactoryPressure(flow, ratedFlow, ratedPressure, churn, at150);
      const minimum = expected * acceptanceShare;
      return [
        {
          id,
          label,
          flow,
          net: discharge - suction,
          adjusted,
          expected,
          minimum,
          passed: adjusted >= minimum,
        },
      ];
    });

  if (!hasPlate && runs.length === 0) return undefined;

  const measured = [...runs].sort((a, b) => a.flow - b.flow);
  const test = measured.map((run) => ({ x: run.flow, y: run.net }));
  const adjusted = measured.map((run) => ({ x: run.flow, y: run.adjusted }));
  const all = [...test, ...adjusted, ...factory, ...acceptance];
  const maxFlow = Math.max(0, ...all.map((point) => point.x));
  const maxPsi = Math.max(0, ...all.map((point) => point.y));
  const xStep = hasPlate ? ratedFlow / 2 : niceStep(Math.max(maxFlow, 1), 4);
  const yStep = niceStep(Math.max(maxPsi, 1), 4);
  const stepCeil = Math.ceil(Math.max(maxFlow, xStep) / xStep) * xStep;
  const maxX = stepCeil - maxFlow > xStep * 0.5 ? maxFlow + xStep * 0.12 : stepCeil;
  const maxY = Math.ceil((maxPsi * 1.08) / yStep) * yStep;

  const verdict =
    hasPlate && runs.length > 0
      ? runs.every((run) => run.passed)
        ? 'acceptable'
        : 'not_acceptable'
      : undefined;

  return { runs, test, adjusted, factory, acceptance, axes: { maxX, xStep, maxY, yStep }, verdict };
}
