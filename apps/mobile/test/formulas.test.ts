import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  type FormDefinition,
  type FormNode,
  formDefinitionSchema,
} from '../../../packages/shared/src/form-definition.ts';
import { calcValue, expressionNames } from '../src/forms/form-values.ts';
import { pumpChartData } from '../src/forms/pump-chart.ts';

const formatos = path.resolve(import.meta.dirname, '../../../packages/shared/formatos');
const definitions = readdirSync(formatos)
  .filter((file) => file.endsWith('.json'))
  .map((file) =>
    formDefinitionSchema.parse(JSON.parse(readFileSync(path.join(formatos, file), 'utf8'))),
  );

function load(code: string) {
  const definition = definitions.find((item) => item.code === code);
  assert.ok(definition, code);
  return definition;
}

function allNodes(definition: FormDefinition): FormNode[] {
  const walk = (nodes: FormNode[]): FormNode[] =>
    nodes.flatMap((node) =>
      node.type === 'group' || node.type === 'list' ? [node, ...walk(node.children)] : [node],
    );
  return walk([
    ...definition.report,
    ...(definition.header ?? []),
    ...definition.sections.flatMap((section) => section.children),
    ...(definition.items?.sections.flatMap((section) => section.children) ?? []),
  ]);
}

function findCalc(definition: FormDefinition, id: string) {
  for (const node of allNodes(definition)) {
    if (node.type === 'calc' && node.id === id) return node.expression;
    if (node.type === 'table') {
      const column = node.columns.find((item) => item.id === id);
      if (column?.type === 'calc') return column.expression;
    }
  }
  assert.fail(`no calc ${id} in ${definition.code}`);
}

test('net pressure is discharge minus suction', () => {
  for (const code of ['diesel_pump_annual', 'pump_performance_test']) {
    const expression = findCalc(load(code), 'net_pressure');
    assert.equal(calcValue(expression, { discharge_pressure: 120, suction_pressure: 20 }, {}), 100);
  }
});

test('a negative suction pressure (suction lift) adds to the net pressure', () => {
  const expression = findCalc(load('diesel_pump_annual'), 'net_pressure');
  assert.equal(calcValue(expression, { discharge_pressure: 100, suction_pressure: -5 }, {}), 105);
});

test('net pressure has no result while a pressure is missing', () => {
  const expression = findCalc(load('pump_performance_test'), 'net_pressure');
  assert.equal(calcValue(expression, { discharge_pressure: 120 }, {}), undefined);
  assert.equal(
    calcValue(expression, { discharge_pressure: 120, suction_pressure: '' }, {}),
    undefined,
  );
});

test('flow percent uses the row flow and the rated flow of the equipment', () => {
  const expression = findCalc(load('pump_performance_test'), 'flow_percent');
  assert.equal(calcValue(expression, { flow_gpm: 1500 }, { rated_flow: 1000 }), 150);
  assert.equal(calcValue(expression, { flow_gpm: 0 }, { rated_flow: 1000 }), 0);
  assert.equal(calcValue(expression, { flow_gpm: 1500 }, {}), undefined);
  assert.equal(calcValue(expression, { flow_gpm: 1500 }, { rated_flow: 0 }), undefined);
});

test('the water column in PSI divides feet by 2.31', () => {
  const expression = findCalc(load('pump_performance_test'), 'water_column_psi');
  assert.equal(calcValue(expression, {}, { water_column_ft: 23.1 }), 10);
  assert.equal(Math.round((calcValue(expression, {}, { water_column_ft: 30 }) ?? 0) * 100), 1299);
});

test('typed text with a decimal comma counts as a number', () => {
  const expression = findCalc(load('pump_performance_test'), 'water_column_psi');
  assert.equal(calcValue(expression, {}, { water_column_ft: '23,1' }), 10);
});

test('a row column wins over an equipment field with the same name', () => {
  assert.equal(calcValue('a - b', { a: 10, b: 1 }, { a: 99, b: 50 }), 9);
});

test('every formula in every form uses existing numeric fields that are not formulas', () => {
  for (const definition of definitions) {
    const nodes = allNodes(definition);
    const rootFields = new Map(
      nodes.filter((node) => 'id' in node).map((node) => [(node as { id: string }).id, node]),
    );
    const formulas: { id: string; expression: string; row: Map<string, FormNode> }[] = [];
    for (const node of nodes) {
      if (node.type === 'calc')
        formulas.push({ id: node.id, expression: node.expression, row: new Map() });
      if (node.type === 'table') {
        const row = new Map<string, FormNode>(node.columns.map((column) => [column.id, column]));
        for (const column of node.columns) {
          if (column.type === 'calc')
            formulas.push({ id: column.id, expression: column.expression, row });
        }
      }
    }
    for (const formula of formulas) {
      const where = `${definition.code}.${formula.id}`;
      const row: Record<string, number> = {};
      const root: Record<string, number> = {};
      for (const name of expressionNames(formula.expression)) {
        const field = formula.row.get(name) ?? rootFields.get(name);
        assert.ok(field, `${where} uses a missing field ${name}`);
        assert.equal(field.type, 'text', `${where} uses ${name}, which is not a number field`);
        assert.ok(
          'inputMode' in field && (field.inputMode === 'decimal' || field.inputMode === 'numeric'),
          `${where} uses ${name}, which does not ask for a number`,
        );
        if (formula.row.has(name)) row[name] = 3;
        else root[name] = 3;
      }
      const result = calcValue(formula.expression, row, root);
      assert.ok(result !== undefined && Number.isFinite(result), `${where} has no result`);
    }
  }
});

test('the chart skips a run whose suction pressure is missing, like the table', () => {
  const data = pumpChartData({
    rated_flow: 1000,
    rated_pressure: 100,
    performance_runs: {
      run_1: { flow_gpm: 1000, discharge_pressure: 120 },
      run_2: { flow_gpm: 1500, discharge_pressure: 90, suction_pressure: 20 },
    },
  });
  assert.deepEqual(data?.test, [{ x: 1500, y: 70 }]);
});

test('the chart uses the same net pressure as the table', () => {
  const definition = load('pump_performance_test');
  const run = { flow_gpm: 1250, discharge_pressure: 118.5, suction_pressure: 21.3 };
  const data = pumpChartData({
    rated_flow: 1000,
    rated_pressure: 100,
    performance_runs: { run_1: run },
  });
  assert.deepEqual(data?.test, [
    { x: 1250, y: calcValue(findCalc(definition, 'net_pressure'), run, {}) },
  ]);
});
