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
