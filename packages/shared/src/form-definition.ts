import { z } from 'zod';

const fieldId = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, 'Use snake_case ids that start with a letter');

const label = z.string().trim().min(1);

const option = z.object({ value: fieldId, label });

const inputMode = z.enum(['text', 'numeric', 'decimal']);

const condition = z.object({
  field: fieldId,
  equals: z.union([z.string(), z.boolean(), z.number()]),
});

const fieldBase = {
  id: fieldId,
  label,
  help: z.string().optional(),
  required: z.boolean().optional(),
  highlight: z.boolean().optional(),
  visibleWhen: condition.optional(),
};

const measurement = z.object({
  label: label.default('Valor'),
  unit: z.string().optional(),
  inputMode: inputMode.default('decimal'),
});

export const textFieldSchema = z.object({
  ...fieldBase,
  type: z.literal('text'),
  multiline: z.boolean().optional(),
  inputMode: inputMode.optional(),
  unit: z.string().optional(),
});

export const dateFieldSchema = z.object({ ...fieldBase, type: z.literal('date') });

export const timeFieldSchema = z.object({ ...fieldBase, type: z.literal('time') });

export const selectFieldSchema = z.object({
  ...fieldBase,
  type: z.literal('select'),
  options: z.array(option).min(1),
});

export const choiceFieldSchema = z.object({
  ...fieldBase,
  type: z.literal('choice'),
  options: z.array(option).min(2),
});

export const yesNoFieldSchema = z.object({ ...fieldBase, type: z.literal('yes_no') });

export const checkFieldSchema = z.object({
  ...fieldBase,
  type: z.literal('check'),
  measurement: measurement.optional(),
});

export const checkboxFieldSchema = z.object({ ...fieldBase, type: z.literal('checkbox') });

export const photosFieldSchema = z.object({
  ...fieldBase,
  type: z.literal('photos'),
  count: z.number().int().min(1).max(12),
});

export const calcFieldSchema = z.object({
  ...fieldBase,
  type: z.literal('calc'),
  expression: z
    .string()
    .regex(/^[a-z0-9_+\-*/().^ ]+$/, 'Use field ids, numbers and + - * / ^ ( )'),
  unit: z.string().optional(),
});

export const fieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  dateFieldSchema,
  timeFieldSchema,
  selectFieldSchema,
  choiceFieldSchema,
  yesNoFieldSchema,
  checkFieldSchema,
  checkboxFieldSchema,
  photosFieldSchema,
  calcFieldSchema,
]);

export type FormField = z.infer<typeof fieldSchema>;
export type FormFieldType = FormField['type'];

export const noteSchema = z.object({
  type: z.literal('note'),
  text: label,
  tone: z.enum(['info', 'warning']).default('info'),
});

export const chartSchema = z.object({
  type: z.literal('chart'),
  id: fieldId,
  label,
  chart: z.literal('pump_performance'),
});

export const tableSchema = z.object({
  type: z.literal('table'),
  id: fieldId,
  label: label.optional(),
  rows: z.array(z.object({ id: fieldId, label })).min(1),
  columns: z.array(fieldSchema).min(1),
});

export const observationsSchema = z.object({
  type: z.literal('observations'),
  id: fieldId,
});

export type FormNote = z.infer<typeof noteSchema>;
export type FormChart = z.infer<typeof chartSchema>;
export type FormTable = z.infer<typeof tableSchema>;
export type FormObservations = z.infer<typeof observationsSchema>;

export type FormGroup = {
  type: 'group';
  id: string;
  label?: string;
  style: 'item' | 'band';
  columns: 1 | 2;
  visibleWhen?: z.infer<typeof condition>;
  children: FormNode[];
};

export type FormList = {
  type: 'list';
  id: string;
  label: string;
  addLabel: string;
  children: FormNode[];
};

export type FormNode =
  FormField | FormNote | FormChart | FormTable | FormObservations | FormGroup | FormList;

export const groupSchema: z.ZodType<FormGroup, unknown> = z.lazy(() =>
  z.object({
    type: z.literal('group'),
    id: fieldId,
    label: label.optional(),
    style: z.enum(['item', 'band']).default('item'),
    columns: z.union([z.literal(1), z.literal(2)]).default(1),
    visibleWhen: condition.optional(),
    children: z.array(nodeSchema).min(1),
  }),
);

export const listSchema: z.ZodType<FormList, unknown> = z.lazy(() =>
  z.object({
    type: z.literal('list'),
    id: fieldId,
    label,
    addLabel: label,
    children: z.array(nodeSchema).min(1),
  }),
);

export const nodeSchema: z.ZodType<FormNode, unknown> = z.lazy(() =>
  z.union([
    fieldSchema,
    noteSchema,
    chartSchema,
    tableSchema,
    observationsSchema,
    groupSchema,
    listSchema,
  ]),
);

export const sectionSchema = z.object({
  id: fieldId,
  title: label,
  note: z.string().optional(),
  children: z.array(nodeSchema).min(1),
});

export type FormSection = z.infer<typeof sectionSchema>;

export const serviceTypeSchema = z.object({
  label: label.default('Tipo de servicio'),
  help: z.string().optional(),
  options: z.array(z.object({ value: fieldId, label, sections: z.array(fieldId).min(1) })).min(1),
  allowCustom: z.boolean().default(false),
});

export type FormServiceType = z.infer<typeof serviceTypeSchema>;

export const formBodySchema = z.object({
  serviceType: serviceTypeSchema.optional(),
  sections: z.array(sectionSchema).min(1),
});

export const formItemsSchema = formBodySchema.extend({
  id: fieldId,
  addLabel: label,
  title: label,
  keyLabel: label.optional(),
});

export type FormItems = z.infer<typeof formItemsSchema>;

export const formDefinitionSchema = z
  .object({
    code: z.string().regex(/^F-SER-\d{3}$/),
    version: z.number().int().min(1),
    report: z.array(fieldSchema),
    instructions: z.string().optional(),
    header: z.array(nodeSchema).optional(),
    serviceType: serviceTypeSchema.optional(),
    items: formItemsSchema.optional(),
    sections: z.array(sectionSchema),
    commentsLabel: label.default('Comentarios'),
  })
  .superRefine((form, ctx) => {
    for (const problem of definitionProblems(form)) {
      ctx.addIssue({ code: 'custom', message: problem });
    }
  });

export type FormDefinition = z.output<typeof formDefinitionSchema>;
export type FormDefinitionInput = z.input<typeof formDefinitionSchema>;

type DefinitionShape = {
  report: FormField[];
  header?: FormNode[];
  serviceType?: FormServiceType;
  items?: FormItems;
  sections: FormSection[];
};

function childrenOf(node: FormNode): FormNode[] {
  return node.type === 'group' || node.type === 'list' ? node.children : [];
}

function expressionNames(expression: string): string[] {
  return expression.match(/[a-z_][a-z0-9_]*/g) ?? [];
}

function collectIds(nodes: FormNode[], ids: string[], fields: Map<string, FormNode>) {
  for (const node of nodes) {
    if ('id' in node) {
      ids.push(node.id);
      fields.set(node.id, node);
    }
    if (node.type === 'table') {
      for (const row of node.rows) {
        for (const column of node.columns) ids.push(`${node.id}.${row.id}.${column.id}`);
      }
      continue;
    }
    collectIds(childrenOf(node), ids, fields);
  }
}

function eachNode(nodes: FormNode[], visit: (node: FormNode) => void) {
  for (const node of nodes) {
    visit(node);
    eachNode(childrenOf(node), visit);
  }
}

function serviceTypeProblems(
  serviceType: FormServiceType | undefined,
  sections: FormSection[],
  where: string,
) {
  if (!serviceType) return [];
  const sectionIds = new Set(sections.map((section) => section.id));
  return serviceType.options.flatMap((item) =>
    item.sections
      .filter((id) => !sectionIds.has(id))
      .map((id) => `${where}: service type "${item.value}" points to a missing section "${id}"`),
  );
}

export function definitionProblems(form: DefinitionShape): string[] {
  const problems: string[] = [];
  if (form.items && form.sections.length > 0) {
    problems.push('Use either top-level sections or items, not both');
  }
  if (!form.items && form.sections.length === 0) problems.push('The form needs sections or items');
  if (form.items?.serviceType && form.serviceType)
    problems.push('Use either a form service type or a per-item service type, not both');

  const allSections = [...form.sections, ...(form.items?.sections ?? [])];
  const nodes = [
    ...form.report,
    ...(form.header ?? []),
    ...allSections.flatMap((section) => section.children),
  ];
  const ids: string[] = [...allSections.map((section) => section.id)];
  if (form.items) ids.push(form.items.id);
  const fields = new Map<string, FormNode>();
  collectIds(nodes, ids, fields);

  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) problems.push(`Duplicate id "${id}"`);
    seen.add(id);
  }

  eachNode(nodes, (node) => {
    if ('visibleWhen' in node && node.visibleWhen && !fields.has(node.visibleWhen.field)) {
      problems.push(`"${node.id}" depends on a missing field "${node.visibleWhen.field}"`);
    }
    if (node.type === 'calc') {
      for (const name of expressionNames(node.expression)) {
        if (!fields.has(name)) problems.push(`"${node.id}" uses a missing field "${name}"`);
      }
    }
    if (node.type === 'table') {
      const columns = new Set(node.columns.map((column) => column.id));
      if (columns.size !== node.columns.length) problems.push(`"${node.id}" repeats a column id`);
      for (const column of node.columns) {
        if (column.type !== 'calc') continue;
        for (const name of expressionNames(column.expression)) {
          if (!columns.has(name) && !fields.has(name)) {
            problems.push(`"${node.id}.${column.id}" uses a missing field "${name}"`);
          }
        }
      }
    }
  });

  problems.push(
    ...serviceTypeProblems(form.serviceType, form.items?.sections ?? form.sections, 'form'),
  );
  problems.push(
    ...serviceTypeProblems(form.items?.serviceType, form.items?.sections ?? [], 'items'),
  );
  return problems;
}
