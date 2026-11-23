import assert from 'node:assert/strict';
import { test } from 'node:test';

import { pumpChartData } from '../src/forms/pump-chart.ts';

const rated = {
  rated_flow: 1000,
  rated_pressure: 100,
  max_pressure: 130,
  pressure_150: 70,
};

test('the nameplate curve uses churn, rated and 150% points, and the minimum is 95% of it', () => {
  const data = pumpChartData(rated);
  assert.ok(data);
  assert.deepEqual(data.nameplate, [
    { x: 0, y: 130 },
    { x: 100, y: 100 },
    { x: 150, y: 70 },
  ]);
  assert.deepEqual(
    data.minimum.map((point) => [point.x, Math.round(point.y * 100) / 100]),
    [
      [0, 123.5],
      [100, 95],
      [150, 66.5],
    ],
  );
  assert.deepEqual(data.test, []);
});

test('test runs are plotted as percent of rated flow and net pressure, sorted by flow', () => {
  const data = pumpChartData({
    ...rated,
    performance_runs: {
      run_2: { flow_gpm: 1500, discharge_pressure: '90', suction_pressure: '20' },
      run_1: { flow_gpm: 0, discharge_pressure: 150, suction_pressure: 20 },
      run_3: { flow_gpm: 1000 },
    },
  });
  assert.deepEqual(data?.test, [
    { x: 0, y: 130 },
    { x: 150, y: 70 },
  ]);
  assert.equal(data?.adjusted, false);
});

test('runs are adjusted to rated speed with the affinity laws', () => {
  const data = pumpChartData({
    ...rated,
    rated_speed: 1800,
    performance_runs: {
      run_1: { flow_gpm: 900, speed: 1620, discharge_pressure: 101, suction_pressure: 20 },
    },
  });
  const [point] = data?.test ?? [];
  assert.equal(Math.round(point.x), 100);
  assert.equal(Math.round(point.y), 100);
  assert.equal(data?.adjusted, true);
});

test('without rated flow and pressure there is no chart', () => {
  assert.equal(pumpChartData({ rated_pressure: 100 }), undefined);
  assert.equal(pumpChartData({ rated_flow: 1000 }), undefined);
});

test('the axes leave room for every point with round limits', () => {
  const data = pumpChartData({
    ...rated,
    performance_runs: { run_1: { flow_gpm: 1600, discharge_pressure: 80, suction_pressure: 20 } },
  });
  assert.equal(data?.xMax, 175);
  assert.equal(data?.yMax, 150);
});
