import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formDefinitionSchema } from '../../../packages/shared/src/form-definition.ts';
import { chunkNodes, fieldNumbers, formProgress } from '../src/forms/form-values.ts';

function definition(sections: { id: string; children: unknown[] }[], report: unknown[] = []) {
  return formDefinitionSchema.parse({
    code: 'test_form',
    version: 1,
    report,
    sections: sections.map((section) => ({ ...section, title: section.id })),
  });
}

const check = (id: string, extra = {}) => ({ id, type: 'check', label: id, ...extra });
const text = (id: string, extra = {}) => ({ id, type: 'text', label: id, ...extra });
const box = (id: string) => ({ id, type: 'checkbox', label: id });

test('consecutive nodes of the same kind are chunked together', () => {
  const form = definition([
    {
      id: 'main',
      children: [
        check('a'),
        { id: 'b', type: 'yes_no', label: 'b' },
        box('c'),
        box('d'),
        text('e'),
        { id: 'f', type: 'date', label: 'f' },
        text('g', { multiline: true }),
        check('h'),
      ],
    },
  ]);
  const chunks = chunkNodes(form.sections[0].children);
  assert.deepEqual(
    chunks.map((chunk) => [chunk.kind, chunk.nodes.map((node) => ('id' in node ? node.id : ''))]),
    [
      ['rows', ['a', 'b']],
      ['chips', ['c', 'd']],
      ['grid', ['e', 'f']],
      ['block', ['g']],
      ['rows', ['h']],
    ],
  );
});

test('notes and groups are blocks of their own', () => {
  const form = definition([
    {
      id: 'main',
      children: [
        { type: 'note', text: 'Aviso' },
        { type: 'group', id: 'g1', children: [check('a')] },
        { type: 'group', id: 'g2', children: [check('b')] },
      ],
    },
  ]);
  assert.deepEqual(
    chunkNodes(form.sections[0].children).map((chunk) => [chunk.kind, chunk.nodes.length]),
    [
      ['block', 1],
      ['block', 1],
      ['block', 1],
    ],
  );
});

test('check and yes/no items are numbered per section, including inside groups', () => {
  const form = definition([
    { id: 'one', children: [check('a'), text('skip'), check('b')] },
    {
      id: 'two',
      children: [
        { type: 'group', id: 'g', children: [check('c'), { id: 'd', type: 'yes_no', label: 'd' }] },
        box('skip_box'),
        check('e'),
      ],
    },
  ]);
  assert.deepEqual(Object.fromEntries(fieldNumbers(form)), {
    a: '1.1',
    b: '1.2',
    c: '2.1',
    d: '2.2',
    e: '2.3',
  });
});

test('progress counts visible answers per section and in total, without checkboxes', () => {
  const form = definition(
    [
      {
        id: 'one',
        children: [
          check('a'),
          box('other'),
          text('other_detail', { visibleWhen: { field: 'other', equals: true } }),
        ],
      },
      { id: 'two', children: [check('b'), check('c')] },
    ],
    [{ id: 'date', type: 'date', label: 'Fecha' }],
  );

  const empty = formProgress(form, {});
  assert.deepEqual(empty.report, { answered: 0, total: 1 });
  assert.deepEqual(
    empty.sections.map((section) => [section.id, section.answered, section.total]),
    [
      ['one', 0, 1],
      ['two', 0, 2],
    ],
  );
  assert.deepEqual([empty.answered, empty.total], [0, 4]);

  const filled = formProgress(form, {
    date: '2026-11-23',
    a: { status: 'ok' },
    other: true,
    other_detail: 'Taller',
    c: { status: 'na' },
  });
  assert.deepEqual(
    filled.sections.map((section) => [section.id, section.answered, section.total]),
    [
      ['one', 2, 2],
      ['two', 1, 2],
    ],
  );
  assert.deepEqual([filled.answered, filled.total], [4, 5]);
});
