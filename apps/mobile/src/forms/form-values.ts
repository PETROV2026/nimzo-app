import type { FormDefinition, FormField, FormNode } from '@nimzo/shared';

export type FormValues = Record<string, unknown>;

export type Condition = { field: string; equals: string | boolean | number };

const fieldTypes = new Set<string>([
  'text',
  'date',
  'time',
  'select',
  'choice',
  'yes_no',
  'check',
  'checkbox',
  'photos',
  'calc',
]);

export function isField(node: FormNode): node is FormField {
  return fieldTypes.has(node.type);
}

export function isEmptyValue(value: unknown) {
  if (value === undefined || value === null || value === false) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function isVisible(condition: Condition | undefined, values: FormValues) {
  return !condition || values[condition.field] === condition.equals;
}

function conditionOf(node: FormNode) {
  return 'visibleWhen' in node ? node.visibleWhen : undefined;
}

function hideAll(nodes: FormNode[], hidden: Set<string>) {
  for (const node of nodes) {
    if ('id' in node) hidden.add(node.id);
    if (node.type === 'group' || node.type === 'list') hideAll(node.children, hidden);
  }
}

function walk(nodes: FormNode[], values: FormValues, shown: FormField[], hidden: Set<string>) {
  for (const node of nodes) {
    const condition = conditionOf(node);
    const blocked = condition ? hidden.has(condition.field) : false;
    if (blocked || !isVisible(condition, values)) {
      hideAll([node], hidden);
      continue;
    }
    if (node.type === 'group') walk(node.children, values, shown, hidden);
    else if (isField(node)) shown.push(node);
  }
}

function rootNodes(definition: FormDefinition): FormNode[] {
  return [
    ...definition.report,
    ...(definition.header ?? []),
    ...definition.sections.flatMap((section) => section.children),
  ];
}

function visibility(definition: FormDefinition, values: FormValues) {
  const shown: FormField[] = [];
  const hidden = new Set<string>();
  walk(rootNodes(definition), values, shown, hidden);
  return { shown, hidden };
}

function collectConditions(nodes: FormNode[], fields: Set<string>) {
  for (const node of nodes) {
    const condition = conditionOf(node);
    if (condition) fields.add(condition.field);
    if (node.type === 'group' || node.type === 'list') collectConditions(node.children, fields);
  }
}

export function conditionFields(definition: FormDefinition) {
  const fields = new Set<string>();
  collectConditions(rootNodes(definition), fields);
  return [...fields];
}

export function hiddenIds(definition: FormDefinition, values: FormValues) {
  return visibility(definition, values).hidden;
}

export function missingRequired(definition: FormDefinition, values: FormValues) {
  return visibility(definition, values)
    .shown.filter((field) => field.required && field.type !== 'calc')
    .filter((field) => isEmptyValue(values[field.id]))
    .map((field) => field.id);
}

export function visibleValues(definition: FormDefinition, values: FormValues): FormValues {
  const { hidden } = visibility(definition, values);
  return Object.fromEntries(Object.entries(values).filter(([id]) => !hidden.has(id)));
}

export type ChunkKind = 'rows' | 'chips' | 'grid' | 'block';

export type Chunk = { kind: ChunkKind; nodes: FormNode[] };

export type Progress = { answered: number; total: number };

export type SectionProgress = Progress & { id: string; title: string };

export type FormProgress = Progress & { report: Progress; sections: SectionProgress[] };

const numberedTypes = new Set<string>(['check', 'yes_no']);

function kindOf(node: FormNode): ChunkKind {
  switch (node.type) {
    case 'check':
    case 'yes_no':
      return 'rows';
    case 'checkbox':
      return 'chips';
    case 'text':
      return node.multiline ? 'block' : 'grid';
    case 'date':
    case 'time':
    case 'select':
    case 'choice':
      return 'grid';
    default:
      return 'block';
  }
}

export function chunkNodes(nodes: FormNode[]): Chunk[] {
  const chunks: Chunk[] = [];
  for (const node of nodes) {
    const kind = kindOf(node);
    const last = chunks.at(-1);
    if (last && last.kind === kind && kind !== 'block') last.nodes.push(node);
    else chunks.push({ kind, nodes: [node] });
  }
  return chunks;
}

function fieldsOf(nodes: FormNode[]): FormField[] {
  return nodes.flatMap((node) => {
    if (node.type === 'group') return fieldsOf(node.children);
    return isField(node) ? [node] : [];
  });
}

export function fieldNumbers(definition: FormDefinition) {
  const numbers = new Map<string, string>();
  definition.sections.forEach((section, index) => {
    let count = 0;
    for (const field of fieldsOf(section.children)) {
      if (!numberedTypes.has(field.type)) continue;
      count += 1;
      numbers.set(field.id, `${index + 1}.${count}`);
    }
  });
  return numbers;
}

function countable(field: FormField) {
  return field.type !== 'checkbox' && field.type !== 'calc';
}

function progressOf(fields: FormField[], hidden: Set<string>, values: FormValues): Progress {
  const shown = fields.filter((field) => countable(field) && !hidden.has(field.id));
  return {
    answered: shown.filter((field) => !isEmptyValue(values[field.id])).length,
    total: shown.length,
  };
}

export function formProgress(definition: FormDefinition, values: FormValues): FormProgress {
  const hidden = hiddenIds(definition, values);
  const report = progressOf(definition.report, hidden, values);
  const sections = definition.sections.map((section) => ({
    id: section.id,
    title: section.title,
    ...progressOf(fieldsOf(section.children), hidden, values),
  }));
  const all = [report, ...sections];
  return {
    report,
    sections,
    answered: all.reduce((sum, item) => sum + item.answered, 0),
    total: all.reduce((sum, item) => sum + item.total, 0),
  };
}
