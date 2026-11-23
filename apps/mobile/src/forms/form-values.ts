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
