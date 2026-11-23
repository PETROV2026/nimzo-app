import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  adjustedPressure,
  churnPressure,
  expectedFactoryPressure,
  pressureAt150,
  pumpChartData,
} from '../src/forms/pump-chart.ts';

const close = (actual: number | undefined, expected: number, tolerance = 1e-9) =>
  assert.ok(
    actual !== undefined && Math.abs(actual - expected) <= tolerance,
    `${actual} is not close to ${expected}`,
  );

test('adjusted pressure is the net pressure when the speed equals nominal', () => {
  assert.equal(
    adjustedPressure({ discharge: 130, suction: 10, ratedSpeed: 1770, speed: 1770 }),
    120,
  );
});

test('adjusted pressure applies the squared affinity law for speed', () => {
  close(
    adjustedPressure({ discharge: 110, suction: 10, ratedSpeed: 1770, speed: 1765 }),
    100 * (1770 / 1765) ** 2,
    0.01,
  );
  assert.ok(adjustedPressure({ discharge: 100, suction: 0, ratedSpeed: 1770, speed: 1700 }) > 100);
});

test('adjusted pressure is zero for a zero speed and rounds to two decimals', () => {
  assert.equal(adjustedPressure({ discharge: 100, suction: 0, ratedSpeed: 1770, speed: 0 }), 0);
  const value = adjustedPressure({ discharge: 124, suction: 8, ratedSpeed: 1770, speed: 1768 });
  assert.equal(value, Math.round(value * 100) / 100);
});

test('without speeds the adjusted pressure is the net pressure', () => {
  assert.equal(adjustedPressure({ discharge: 130, suction: 10 }), 120);
});

test('churn and 150% pressures use the plate or fall back to 120% and 65%', () => {
  assert.equal(churnPressure(120, 150), 150);
  assert.equal(pressureAt150(120, 80), 80);
  close(churnPressure(120, undefined), 144);
  close(pressureAt150(120, 0), 78);
});

test('expected factory pressure follows the three plate points', () => {
  const expected = (flow: number) => expectedFactoryPressure(flow, 1500, 120, 144, 78);
  assert.equal(expected(0), 144);
  close(expected(1500), 120);
  close(expected(2250), 78);
  close(expected(750), 132);
  close(expected(1875), 99);
  close(expected(2625), 57);
  assert.equal(expectedFactoryPressure(500, 0, 120, 144, 78), 120);
});

const plate = { rated_flow: 3000, rated_pressure: 150, max_pressure: 190, pressure_150: 115 };

test('factory data come from the plate and acceptance is 95% of it', () => {
  const data = pumpChartData(plate);
  assert.deepEqual(data?.factory, [
    { x: 0, y: 190 },
    { x: 3000, y: 150 },
    { x: 4500, y: 115 },
  ]);
  assert.deepEqual(
    data?.acceptance.map((point) => point.y),
    [180.5, 142.5, 109.25],
  );
});

test('runs are evaluated against 95% of the factory pressure at their flow', () => {
  const data = pumpChartData({
    ...plate,
    rated_speed: 1770,
    performance_runs: {
      run_2: { flow_gpm: 3000, speed: 1770, discharge_pressure: 158.5, suction_pressure: 10 },
      run_1: { flow_gpm: 0, speed: 1780, discharge_pressure: 183, suction_pressure: 10 },
      run_3: { flow_gpm: 4500, speed: 1770 },
    },
  });
  assert.deepEqual(
    data?.runs.map((run) => [run.label, run.net, run.adjusted, run.passed]),
    [
      ['Desempeño 1', 173, 171.06, false],
      ['Desempeño 2', 148.5, 148.5, true],
    ],
  );
  assert.equal(data?.verdict, 'not_acceptable');
  close(data?.runs[1].minimum, 142.5);
});

test('every passing run gives an acceptable verdict', () => {
  const data = pumpChartData({
    ...plate,
    performance_runs: {
      run_1: { flow_gpm: 3000, discharge_pressure: 160, suction_pressure: 10 },
      run_2: { flow_gpm: 4500, discharge_pressure: 125, suction_pressure: 10 },
    },
  });
  assert.equal(data?.verdict, 'acceptable');
});

test('no runs means no verdict yet', () => {
  assert.equal(pumpChartData(plate)?.verdict, undefined);
});

test('axes cover every series with round steps', () => {
  const data = pumpChartData({
    ...plate,
    performance_runs: {
      run_1: { flow_gpm: 0, discharge_pressure: 183, suction_pressure: 10 },
      run_2: { flow_gpm: 3000, discharge_pressure: 158.5, suction_pressure: 10 },
    },
  });
  assert.equal(data?.axes.xStep, 1500);
  assert.equal(data?.axes.maxX, 4500);
  assert.equal(data?.axes.yStep, 50);
  assert.ok((data?.axes.maxY ?? 0) >= 190);
});

test('without plate data only the measured runs are drawn, with no verdict', () => {
  const data = pumpChartData({
    performance_runs: { run_1: { flow_gpm: 1000, discharge_pressure: 120, suction_pressure: 20 } },
  });
  assert.deepEqual(data?.factory, []);
  assert.deepEqual(data?.acceptance, []);
  assert.equal(data?.runs[0].passed, undefined);
  assert.equal(data?.verdict, undefined);
});

test('with no plate data and no runs there is nothing to draw', () => {
  assert.equal(pumpChartData({}), undefined);
});

test('flow is adjusted to rated speed too, and the run is judged at the adjusted flow', () => {
  const data = pumpChartData({
    ...plate,
    rated_speed: 1770,
    performance_runs: {
      run_1: { flow_gpm: 3540, speed: 1780, discharge_pressure: 150, suction_pressure: 10 },
    },
  });
  const [run] = data?.runs ?? [];
  const ratio = 1770 / 1780;
  close(run.adjustedFlow, 3540 * ratio, 0.01);
  close(run.adjusted, 140 * ratio ** 2, 0.01);
  close(run.expected, expectedFactoryPressure(3540 * ratio, 3000, 150, 190, 115), 0.01);
  assert.deepEqual(data?.test, [{ x: 3540, y: 140 }]);
  close(data?.adjusted[0].x, run.adjustedFlow, 1e-9);
});

test('without speeds the adjusted flow is the measured flow', () => {
  const data = pumpChartData({
    ...plate,
    performance_runs: { run_1: { flow_gpm: 3000, discharge_pressure: 160, suction_pressure: 10 } },
  });
  assert.equal(data?.runs[0].adjustedFlow, 3000);
});
