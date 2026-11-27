import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { definitionProblems, formDefinitionSchema } from '../src/form-definition.ts';

const root = path.resolve(import.meta.dirname, '../../..');
const folder = path.join(root, 'packages/shared/formatos');
const files = readdirSync(folder).filter((file) => file.endsWith('.json'));

const seededCodes = [
  ...readFileSync(
    path.join(root, 'supabase/migrations/20261027151738_own_service_form_keys.sql'),
    'utf8',
  ).matchAll(/\('F-SER-\d{3}', '([a-z0-9_]+)'\)/g),
].map((match) => match[1]);

for (const file of files) {
  test(`${file} is a valid form definition`, () => {
    const result = formDefinitionSchema.safeParse(
      JSON.parse(readFileSync(path.join(folder, file), 'utf8')),
    );
    assert.ok(result.success, result.success ? '' : JSON.stringify(result.error.issues, null, 2));
    assert.equal(`${result.data.code}.json`, file);
  });
}

test('every service form has a service observations section and administrative forms do not', () => {
  for (const file of files) {
    const form = formDefinitionSchema.parse(
      JSON.parse(readFileSync(path.join(folder, file), 'utf8')),
    );
    assert.equal(
      form.serviceObservations !== undefined,
      !administrativeForms.has(form.code),
      form.code,
    );
  }
});

test('every seeded service form has exactly one definition', () => {
  const codes = files.map((file) => file.replace('.json', '')).sort();
  assert.deepEqual(codes, [...seededCodes].sort());
});

test('duplicate ids, missing sections and missing fields are reported', () => {
  const problems = definitionProblems({
    report: [{ id: 'vta', type: 'text', label: 'VTA' }],
    serviceType: {
      label: 'Tipo de servicio',
      allowCustom: false,
      options: [{ value: 'annual', label: 'Anual', sections: ['section_2'] }],
    },
    sections: [
      {
        id: 'section_1',
        title: 'Sección 1',
        children: [
          { id: 'vta', type: 'check', label: 'Repetido' },
          { id: 'other', type: 'checkbox', label: 'Otros' },
          {
            id: 'other_detail',
            type: 'text',
            label: 'Especificar',
            visibleWhen: { field: 'others', equals: true },
          },
          { id: 'net', type: 'calc', label: 'Neta', expression: 'discharge - suction' },
        ],
      },
    ],
  });
  assert.deepEqual(problems, [
    'Duplicate id "vta"',
    '"other_detail" depends on a missing field "others"',
    '"net" uses a missing field "discharge"',
    '"net" uses a missing field "suction"',
    'form: service type "annual" points to a missing section "section_2"',
  ]);
});

test('a form service type can enable the sections of each item', () => {
  const sections = [
    {
      id: 'section_1',
      title: 'Sección 1',
      children: [{ id: 'a', type: 'check' as const, label: 'A' }],
    },
  ];
  const serviceType = {
    label: 'Tipo de servicio',
    allowCustom: false,
    options: [{ value: 'annual', label: 'Anual', sections: ['section_1'] }],
  };
  const items = { id: 'hydrants', addLabel: 'Agregar hidrante', title: 'Hidrante', sections };
  assert.deepEqual(definitionProblems({ report: [], serviceType, items, sections: [] }), []);
  assert.deepEqual(
    definitionProblems({ report: [], serviceType, items: { ...items, serviceType }, sections: [] }),
    ['Use either a form service type or a per-item service type, not both'],
  );
});

test('table calculations can use the columns of the same row', () => {
  const problems = definitionProblems({
    report: [],
    sections: [
      {
        id: 'performance',
        title: 'Desempeño',
        children: [
          {
            type: 'table',
            id: 'runs',
            rows: [{ id: 'run_1', label: 'Desempeño 1' }],
            columns: [
              { id: 'discharge', type: 'text', label: 'Descarga' },
              { id: 'suction', type: 'text', label: 'Succión' },
              { id: 'net', type: 'calc', label: 'Neta', expression: 'discharge - suction' },
            ],
          },
        ],
      },
    ],
  });
  assert.deepEqual(problems, []);
});

const administrativeForms = new Set([
  'quote_request',
  'site_survey',
  'work_order',
  'observations_report',
]);
const answerTypes = new Set(['check', 'yes_no', 'choice']);
const requiredReportLabels = new Set([
  'Fecha de ejecución',
  'Hora de entrada',
  'Corresponde al mes de',
  'Mes correspondiente',
  'Corresponde al trimestre número',
]);

type JsonNode = {
  type: string;
  id?: string;
  label?: string;
  required?: boolean;
  children?: JsonNode[];
};

function nodesOf(nodes: JsonNode[] = []): JsonNode[] {
  return nodes.flatMap((node) => [node, ...nodesOf(node.children)]);
}

for (const file of files.filter((name) => !administrativeForms.has(name.replace('.json', '')))) {
  test(`${file} requires every answer and the date of the service`, () => {
    const form = JSON.parse(readFileSync(path.join(folder, file), 'utf8'));
    const body = [
      ...nodesOf(form.header),
      ...form.sections.flatMap((section: { children: JsonNode[] }) => nodesOf(section.children)),
      ...(form.items?.sections ?? []).flatMap((section: { children: JsonNode[] }) =>
        nodesOf(section.children),
      ),
    ];
    const optionalAnswers = body.filter((node) => answerTypes.has(node.type) && !node.required);
    assert.deepEqual(
      optionalAnswers.map((node) => node.id),
      [],
    );
    const report: JsonNode[] = form.report;
    const optionalReport = report.filter(
      (node) => requiredReportLabels.has(node.label ?? '') && !node.required,
    );
    assert.deepEqual(
      optionalReport.map((node) => node.id),
      [],
    );
    assert.ok(report.some((node) => node.label === 'Fecha de ejecución' && node.required));
  });
}

const administrativeRequired: Record<string, string[]> = {
  quote_request: [
    'request_date',
    'requested_by',
    'certainty',
    'area',
    'component',
    'observation',
    'corrective_action',
    'status',
  ],
  site_survey: ['survey_date'],
  work_order: ['request_date', 'requester_name', 'execution_date', 'requested_description'],
  observations_report: ['execution_date'],
};

for (const [code, expected] of Object.entries(administrativeRequired)) {
  test(`${code}.json requires only its key fields`, () => {
    const form = JSON.parse(readFileSync(path.join(folder, `${code}.json`), 'utf8'));
    const all = [
      ...nodesOf(form.report),
      ...nodesOf(form.header),
      ...form.sections.flatMap((section: { children: JsonNode[] }) => nodesOf(section.children)),
      ...(form.items?.sections ?? []).flatMap((section: { children: JsonNode[] }) =>
        nodesOf(section.children),
      ),
    ];
    assert.deepEqual(
      all.filter((node) => node.required).map((node) => node.id),
      expected,
    );
  });
}

test('a condition must use a value its field can have', () => {
  const problems = definitionProblems({
    report: [],
    sections: [
      {
        id: 'main',
        title: 'Principal',
        children: [
          { id: 'gear_head', type: 'yes_no', label: 'Cabezal de engranes' },
          { id: 'others', type: 'checkbox', label: 'Otros' },
          {
            id: 'state',
            type: 'choice',
            label: 'Estado',
            options: [{ value: 'open', label: 'Abierta' }],
          },
          { id: 'valve', type: 'check', label: 'Válvula' },
          {
            id: 'brand',
            type: 'text',
            label: 'Marca',
            visibleWhen: { field: 'gear_head', equals: true },
          },
          {
            id: 'model',
            type: 'text',
            label: 'Modelo',
            visibleWhen: { field: 'gear_head', equals: 'yes' },
          },
          {
            id: 'detail',
            type: 'text',
            label: 'Detalle',
            visibleWhen: { field: 'others', equals: 'yes' },
          },
          {
            id: 'extra',
            type: 'text',
            label: 'Extra',
            visibleWhen: { field: 'others', equals: true },
          },
          {
            id: 'date',
            type: 'date',
            label: 'Fecha',
            visibleWhen: { field: 'state', equals: 'closed' },
          },
          {
            id: 'note',
            type: 'text',
            label: 'Nota',
            visibleWhen: { field: 'state', equals: 'open' },
          },
          {
            id: 'fix',
            type: 'text',
            label: 'Arreglo',
            visibleWhen: { field: 'valve', equals: 'x' },
          },
        ],
      },
    ],
  });
  assert.deepEqual(problems, [
    '"brand" shows when "gear_head" is true, a value it can never have',
    '"detail" shows when "others" is "yes", a value it can never have',
    '"date" shows when "state" is "closed", a value it can never have',
    '"fix" shows when "valve" is "x", a value it can never have',
  ]);
});
