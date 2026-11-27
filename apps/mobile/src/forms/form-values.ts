import type {
  FormDefinition,
  FormField,
  FormList,
  FormNode,
  FormObservations,
  FormSection,
  FormServiceType,
} from '@nimzo/shared';

export type FormValues = Record<string, unknown>;

export type Condition = { field: string; equals: string | boolean | number };

export const serviceTypeKey = 'service_type';
export const customSectionsKey = 'custom_sections';
export const customServiceType = 'custom';

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

function isCollection(node: FormNode): node is FormList | FormObservations {
  return node.type === 'list' || node.type === 'observations';
}

export function isEmptyValue(value: unknown) {
  if (value === undefined || value === null || value === false) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function hasAnswer(value: unknown): boolean {
  if (isEmptyValue(value)) return false;
  if (Array.isArray(value)) return value.some(hasAnswer);
  if (typeof value === 'object') return Object.values(value as object).some(hasAnswer);
  return true;
}

export function sameAnswers(a: unknown, b: unknown): boolean {
  if (isEmptyValue(a) && isEmptyValue(b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => sameAnswers(item, b[index]));
  }
  if (Array.isArray(a) || Array.isArray(b)) return false;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const left = a as FormValues;
    const right = b as FormValues;
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    return [...keys].every((key) => sameAnswers(left[key], right[key]));
  }
  return a === b;
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
    if (node.type === 'group' || isCollection(node)) hideAll(node.children, hidden);
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

export function enabledSections(
  sections: FormSection[],
  serviceType: FormServiceType | undefined,
  values: FormValues,
) {
  if (!serviceType) return sections;
  const chosen = values[serviceTypeKey];
  if (chosen === customServiceType && serviceType.allowCustom) {
    const custom = values[customSectionsKey];
    const ids = new Set(Array.isArray(custom) ? custom : []);
    return sections.filter((section) => ids.has(section.id));
  }
  const option = serviceType.options.find((item) => item.value === chosen);
  if (!option) return [];
  return sections.filter((section) => option.sections.includes(section.id));
}

export function formSections(definition: FormDefinition, values: FormValues) {
  if (definition.items) return [];
  return enabledSections(definition.sections, definition.serviceType, values);
}

export function itemSections(definition: FormDefinition, values: FormValues, entry: FormValues) {
  if (!definition.items) return [];
  const shared = enabledSections(definition.items.sections, definition.serviceType, values);
  return enabledSections(shared, definition.items.serviceType, entry);
}

function headNodes(definition: FormDefinition): FormNode[] {
  return [...definition.report, ...(definition.header ?? [])];
}

function visibility(definition: FormDefinition, values: FormValues) {
  const shown: FormField[] = [];
  const hidden = new Set<string>();
  const enabled = formSections(definition, values);
  const disabled = definition.sections.filter((section) => !enabled.includes(section));
  hideAll(
    disabled.flatMap((section) => section.children),
    hidden,
  );
  walk(
    [...headNodes(definition), ...enabled.flatMap((section) => section.children)],
    values,
    shown,
    hidden,
  );
  return { shown, hidden };
}

export function hiddenInNodes(nodes: FormNode[], values: FormValues) {
  const hidden = new Set<string>();
  walk(nodes, values, [], hidden);
  return hidden;
}

function collectConditions(nodes: FormNode[], fields: Set<string>) {
  for (const node of nodes) {
    const condition = conditionOf(node);
    if (condition) fields.add(condition.field);
    if (node.type === 'group' || isCollection(node)) collectConditions(node.children, fields);
  }
}

export function conditionFieldsOf(nodes: FormNode[]) {
  const fields = new Set<string>();
  collectConditions(nodes, fields);
  return [...fields];
}

export function conditionFields(definition: FormDefinition) {
  return conditionFieldsOf([
    ...headNodes(definition),
    ...definition.sections.flatMap((section) => section.children),
  ]);
}

export function hiddenIds(definition: FormDefinition, values: FormValues) {
  return visibility(definition, values).hidden;
}

function rowsOf(value: unknown): FormValues[] {
  return Array.isArray(value) ? (value as FormValues[]) : [];
}

function collectMissing(
  nodes: FormNode[],
  scope: FormValues,
  hidden: ReadonlySet<string>,
  prefix: string,
  missing: string[],
) {
  for (const node of nodes) {
    if ('id' in node && hidden.has(node.id)) continue;
    if (node.type === 'group') {
      collectMissing(node.children, scope, hidden, prefix, missing);
    } else if (isCollection(node)) {
      rowsOf(scope[node.id]).forEach((row, index) => {
        const rowHidden = hiddenInNodes(node.children, row);
        collectMissing(node.children, row, rowHidden, `${prefix}${node.id}.${index}.`, missing);
      });
    } else if (isField(node) && node.required && node.type !== 'calc') {
      if (isEmptyValue(scope[node.id])) missing.push(`${prefix}${node.id}`);
    }
  }
}

function serviceTypeChosen(serviceType: FormServiceType | undefined, chosen: unknown) {
  if (!serviceType) return true;
  if (chosen === customServiceType) return serviceType.allowCustom;
  return serviceType.options.some((option) => option.value === chosen);
}

export function missingRequired(definition: FormDefinition, values: FormValues) {
  const missing: string[] = [];
  const { hidden } = visibility(definition, values);
  collectMissing(headNodes(definition), values, hidden, '', missing);
  if (!serviceTypeChosen(definition.serviceType, values[serviceTypeKey])) {
    missing.push(serviceTypeKey);
    return missing;
  }
  const sections = formSections(definition, values);
  collectMissing(
    sections.flatMap((section) => section.children),
    values,
    hidden,
    '',
    missing,
  );
  const items = definition.items;
  if (!items) return missing;
  const entries = rowsOf(values[items.id]);
  if (entries.length === 0) missing.push(items.id);
  entries.forEach((entry, index) => {
    const prefix = `${items.id}.${index}.`;
    if (!serviceTypeChosen(items.serviceType, entry[serviceTypeKey])) {
      missing.push(`${prefix}${serviceTypeKey}`);
      return;
    }
    const nodes = itemSections(definition, values, entry).flatMap((section) => section.children);
    collectMissing(nodes, entry, hiddenInNodes(nodes, entry), prefix, missing);
  });
  return missing;
}

export function pathAndParents(path: string) {
  const parts = path.split('.');
  return parts.map((_, index) => parts.slice(0, parts.length - index).join('.'));
}

function keepRow(nodes: FormNode[], row: FormValues): FormValues {
  const hidden = hiddenInNodes(nodes, row);
  return withVisibleRows(
    nodes,
    Object.fromEntries(Object.entries(row).filter(([id]) => !hidden.has(id))),
  );
}

function withVisibleRows(nodes: FormNode[], values: FormValues): FormValues {
  const result = { ...values };
  const visit = (list: FormNode[]) => {
    for (const node of list) {
      if (node.type === 'group') visit(node.children);
      else if (isCollection(node) && Array.isArray(result[node.id])) {
        result[node.id] = rowsOf(result[node.id]).map((row) =>
          row && typeof row === 'object' ? keepRow(node.children, row) : row,
        );
      }
    }
  };
  visit(nodes);
  return result;
}

function keepEntry(definition: FormDefinition, values: FormValues, entry: FormValues) {
  const sections = itemSections(definition, values, entry);
  const nodes = sections.flatMap((section) => section.children);
  const allowed = new Set<string>(['key', serviceTypeKey]);
  if (entry[serviceTypeKey] === customServiceType) allowed.add(customSectionsKey);
  const hidden = hiddenInNodes(nodes, entry);
  const collect = (list: FormNode[]) => {
    for (const node of list) {
      if (!('id' in node) || hidden.has(node.id)) continue;
      allowed.add(node.id);
      if (node.type === 'group') collect(node.children);
    }
  };
  collect(nodes);
  return withVisibleRows(
    nodes,
    Object.fromEntries(Object.entries(entry).filter(([id]) => allowed.has(id))),
  );
}

export function visibleValues(definition: FormDefinition, values: FormValues): FormValues {
  const { hidden } = visibility(definition, values);
  const kept: FormValues = withVisibleRows(
    [
      ...headNodes(definition),
      ...formSections(definition, values).flatMap((section) => section.children),
    ],
    Object.fromEntries(Object.entries(values).filter(([id]) => !hidden.has(id))),
  );
  if (kept[serviceTypeKey] !== customServiceType) delete kept[customSectionsKey];
  const items = definition.items;
  if (items && Array.isArray(kept[items.id])) {
    kept[items.id] = (kept[items.id] as FormValues[]).map((entry) =>
      keepEntry(definition, values, entry),
    );
  }
  return kept;
}

export type ChunkKind = 'rows' | 'chips' | 'grid' | 'block';

export type Chunk = { kind: ChunkKind; nodes: FormNode[] };

export type Progress = { answered: number; total: number };

export type SectionProgress = Progress & { id: string; title: string; number: number };

export type FormProgress = Progress & {
  report: Progress;
  lead?: Progress;
  closing?: Progress;
  serviceType?: Progress;
  items?: Progress;
  sections: SectionProgress[];
};

const numberedTypes = new Set<string>(['check', 'yes_no']);

const longLabel = 80;

function kindOf(node: FormNode): ChunkKind {
  if (
    isField(node) &&
    node.type !== 'check' &&
    node.type !== 'yes_no' &&
    node.type !== 'checkbox'
  ) {
    if (node.label.length > longLabel) return 'block';
  }
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
    case 'calc':
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
  const sections = definition.items ? definition.items.sections : definition.sections;
  sections.forEach((section, index) => {
    let count = 0;
    for (const field of fieldsOf(section.children)) {
      if (!numberedTypes.has(field.type)) continue;
      count += 1;
      numbers.set(field.id, `${index + 1}.${count}`);
    }
  });
  return numbers;
}

type Unit = { id: string };

function unitsOf(nodes: FormNode[]): Unit[] {
  return nodes.flatMap((node): Unit[] => {
    if (node.type === 'group') return unitsOf(node.children);
    if (node.type === 'list' || node.type === 'table' || node.type === 'observations') {
      return [node];
    }
    if (isField(node) && node.type !== 'checkbox' && node.type !== 'calc') return [node];
    return [];
  });
}

function progressOf(nodes: FormNode[], hidden: Set<string>, values: FormValues): Progress {
  const shown = unitsOf(nodes).filter((unit) => !hidden.has(unit.id));
  return {
    answered: shown.filter((unit) => hasAnswer(values[unit.id])).length,
    total: shown.length,
  };
}

function sum(list: Progress[]): Progress {
  return {
    answered: list.reduce((total, item) => total + item.answered, 0),
    total: list.reduce((total, item) => total + item.total, 0),
  };
}

export function formProgress(definition: FormDefinition, values: FormValues): FormProgress {
  const hidden = hiddenIds(definition, values);
  const report = progressOf(headNodes(definition), hidden, values);
  const serviceType = definition.serviceType
    ? { answered: formSectionsChosen(definition, values) ? 1 : 0, total: 1 }
    : undefined;
  const sections = formSections(definition, values).map((section) => ({
    id: section.id,
    title: section.title,
    number: definition.sections.indexOf(section) + 1,
    ...progressOf(section.children, hidden, values),
  }));
  const entries = definition.items ? values[definition.items.id] : undefined;
  const items = definition.items
    ? sum(
        (Array.isArray(entries) ? (entries as FormValues[]) : []).map((entry) =>
          entryProgress(definition, values, entry),
        ),
      )
    : undefined;
  const all = [
    report,
    ...(serviceType ? [serviceType] : []),
    ...sections,
    ...(items ? [items] : []),
  ];
  return { report, serviceType, items, sections, ...sum(all) };
}

export function entryProgress(
  definition: FormDefinition,
  values: FormValues,
  entry: FormValues,
): Progress {
  const nodes = itemSections(definition, values, entry).flatMap((section) => section.children);
  return progressOf(nodes, hiddenInNodes(nodes, entry), entry);
}

function formSectionsChosen(definition: FormDefinition, values: FormValues) {
  const chosen = values[serviceTypeKey];
  if (!definition.serviceType || typeof chosen !== 'string') return false;
  if (chosen === customServiceType) return definition.serviceType.allowCustom;
  return definition.serviceType.options.some((option) => option.value === chosen);
}

export function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const text = value.trim().replace(',', '.');
    if (text === '') return undefined;
    const number = Number(text);
    return Number.isFinite(number) ? number : undefined;
  }
  if (value && typeof value === 'object' && 'value' in value) {
    return numericValue((value as { value: unknown }).value);
  }
  return undefined;
}

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'op'; value: string };

function tokenize(expression: string): Token[] | undefined {
  const tokens: Token[] = [];
  const pattern = /\s*(?:(\d+(?:\.\d+)?)|([a-z_][a-z0-9_]*)|([-+*/^()]))/y;
  let index = 0;
  while (index < expression.length) {
    if (expression.slice(index).trim() === '') break;
    pattern.lastIndex = index;
    const match = pattern.exec(expression);
    if (!match) return undefined;
    if (match[1]) tokens.push({ kind: 'number', value: Number(match[1]) });
    else if (match[2]) tokens.push({ kind: 'name', value: match[2] });
    else tokens.push({ kind: 'op', value: match[3] });
    index = pattern.lastIndex;
  }
  return tokens;
}

export function expressionNames(expression: string) {
  return (tokenize(expression) ?? [])
    .filter((token) => token.kind === 'name')
    .map((token) => token.value as string);
}

export function evaluateExpression(
  expression: string,
  resolve: (name: string) => number | undefined,
): number | undefined {
  const parsed = tokenize(expression);
  if (!parsed) return undefined;
  const tokens = parsed;
  let position = 0;
  const peek = () => tokens[position];
  const isOp = (value: string) => {
    const token = peek();
    return token?.kind === 'op' && token.value === value;
  };

  function primary(): number | undefined {
    const token = tokens[position++];
    if (!token) return undefined;
    if (token.kind === 'number') return token.value;
    if (token.kind === 'name') return resolve(token.value);
    if (token.value === '-') {
      const value = power();
      return value === undefined ? undefined : -value;
    }
    if (token.value === '(') {
      const value = additive();
      if (!isOp(')')) return undefined;
      position += 1;
      return value;
    }
    return undefined;
  }

  function power(): number | undefined {
    const base = primary();
    if (!isOp('^')) return base;
    position += 1;
    const exponent = power();
    return base === undefined || exponent === undefined ? undefined : base ** exponent;
  }

  function multiplicative(): number | undefined {
    let value = power();
    while (isOp('*') || isOp('/')) {
      const op = (tokens[position++] as { value: string }).value;
      const right = power();
      if (value === undefined || right === undefined) return undefined;
      if (op === '/' && right === 0) return undefined;
      value = op === '*' ? value * right : value / right;
    }
    return value;
  }

  function additive(): number | undefined {
    let value = multiplicative();
    while (isOp('+') || isOp('-')) {
      const op = (tokens[position++] as { value: string }).value;
      const right = multiplicative();
      if (value === undefined || right === undefined) return undefined;
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }

  const result = additive();
  if (position !== tokens.length || result === undefined || !Number.isFinite(result)) {
    return undefined;
  }
  return result;
}

export function itemKeyProblem(key: string, entries: { key?: unknown }[], label: string) {
  const clean = key.trim();
  if (!clean) return `Escribe el ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
  const taken = entries.find(
    (entry) =>
      typeof entry.key === 'string' && entry.key.trim().toLowerCase() === clean.toLowerCase(),
  );
  return taken ? `Ya agregaste ${String(taken.key)}` : undefined;
}

export function calcValue(expression: string, row: FormValues, root: FormValues) {
  return evaluateExpression(
    expression,
    (name) => numericValue(row[name]) ?? numericValue(root[name]),
  );
}
