import { memo, type ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useController, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import {
  type FormField,
  type FormGroup,
  type FormList,
  type FormNode,
  type FormNote,
  type FormObservations,
  type FormTable,
} from '@nimzo/shared';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { TextAction } from '@/components/text-action';
import { CheckField } from '@/forms/fields/check-field';
import { CheckboxField } from '@/forms/fields/checkbox-field';
import { ChoiceField } from '@/forms/fields/choice-field';
import { DateField } from '@/forms/fields/date-field';
import { PhotosField } from '@/forms/fields/photos-field';
import { SelectField } from '@/forms/fields/select-field';
import { TextFormField } from '@/forms/fields/text-field';
import { TimeField } from '@/forms/fields/time-field';
import { YesNoField } from '@/forms/fields/yes-no-field';
import {
  FormScopeContext,
  useFormLayout,
  useFormReadOnly,
  useFormScope,
} from '@/forms/form-context';
import {
  type Chunk,
  chunkNodes,
  calcValue,
  conditionFieldsOf,
  expressionNames,
  type FormValues,
  hiddenInNodes,
  isEmptyValue,
  isField,
} from '@/forms/form-values';
import type {
  CheckboxValue,
  CheckValue,
  DateValue,
  OptionValue,
  PhotosValue,
  TextValue,
  TimeValue,
  YesNoValue,
} from '@/forms/types';
import type { OptionTone } from '@/forms/fields/option-buttons';
import { arrangeObservation, observationSummary } from '@/forms/observation-layout';
import { PumpPerformanceChart } from '@/forms/pump-chart-view';
import { colors } from '@/theme';

type EntryValues = Record<string, Record<string, unknown>[]>;

type CalcField = Extract<FormField, { type: 'calc' }>;

export function PendingNode({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border-2 border-dashed border-border-strong px-4 py-3">
      <Icon name="construct-outline" size={22} color={colors.muted} />
      <Text className="flex-1 font-sans text-base text-muted">
        {label}: esta parte del formato todavía no se puede llenar en la app.
      </Text>
    </View>
  );
}

export function NoteNode({ text, tone }: Pick<FormNote, 'text' | 'tone'>) {
  const warning = tone === 'warning';
  return (
    <View
      className={`flex-row items-start gap-3 rounded-lg px-4 py-3 ${warning ? 'bg-accent/30' : 'bg-primary/10'}`}
    >
      <Icon
        name={warning ? 'warning-outline' : 'information-circle-outline'}
        size={22}
        color={colors.foreground}
      />
      <Text className="flex-1 font-sans text-base text-foreground">{text}</Text>
    </View>
  );
}

export function singularOf(addLabel: string) {
  const name = addLabel.replace(/^(agregar|añadir)\s+/i, '');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatNumber(value: number) {
  return value.toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

export function ScopeProvider({
  prefix,
  nodes,
  children,
}: {
  prefix: string;
  nodes: FormNode[];
  children: ReactNode;
}) {
  const fields = useMemo(() => conditionFieldsOf(nodes), [nodes]);
  const names = useMemo(() => fields.map((field) => `${prefix}${field}`), [fields, prefix]);
  const watched: readonly unknown[] = useWatch<FormValues>({ name: names });
  const scope = useMemo(() => {
    const values = Object.fromEntries(fields.map((field, index) => [field, watched[index]]));
    return { prefix, hidden: hiddenInNodes(nodes, values) };
  }, [fields, nodes, prefix, watched]);
  return <FormScopeContext.Provider value={scope}>{children}</FormScopeContext.Provider>;
}

function useCalc(expression: string, rowPrefix: string) {
  const names = useMemo(() => expressionNames(expression), [expression]);
  const paths = useMemo(
    () => names.flatMap((name) => [`${rowPrefix}${name}`, name]),
    [names, rowPrefix],
  );
  const watched: readonly unknown[] = useWatch<FormValues>({ name: paths });
  const row = Object.fromEntries(names.map((name, index) => [name, watched[index * 2]]));
  const root = Object.fromEntries(names.map((name, index) => [name, watched[index * 2 + 1]]));
  return calcValue(expression, row, root);
}

function CalcValue({ field, rowPrefix }: { field: CalcField; rowPrefix: string }) {
  const result = useCalc(field.expression, rowPrefix);
  return (
    <View className="min-h-14 flex-row items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4">
      <Text
        accessibilityLabel={`${field.label}: ${result === undefined ? 'sin datos' : formatNumber(result)}`}
        className="font-sans-semibold text-lg text-foreground"
      >
        {result === undefined ? '—' : formatNumber(result)}
      </Text>
      {field.unit ? <Text className="font-sans text-base text-muted">{field.unit}</Text> : null}
    </View>
  );
}

function CalcNode({ field }: { field: CalcField }) {
  const { prefix } = useFormScope();
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Text className="font-sans-medium text-lg text-foreground">{field.label}</Text>
        <Icon name="calculator-outline" size={18} color={colors.muted} />
      </View>
      <CalcValue field={field} rowPrefix={prefix} />
      <Text className="font-sans text-sm text-muted">
        Se calcula solo con los datos que escribes.
      </Text>
    </View>
  );
}

type FieldLook = { compact?: boolean; tones?: Partial<Record<string, OptionTone>> };

type InputProps = {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  number?: string;
  bare?: boolean;
  look?: FieldLook;
};

function FieldInput({ field, value, onChange, error, number, bare, look }: InputProps) {
  switch (field.type) {
    case 'text':
      return (
        <TextFormField
          field={field}
          value={value as TextValue}
          onChange={onChange}
          error={error}
          bare={bare}
        />
      );
    case 'date':
      return (
        <DateField field={field} value={value as DateValue} onChange={onChange} error={error} />
      );
    case 'time':
      return (
        <TimeField field={field} value={value as TimeValue} onChange={onChange} error={error} />
      );
    case 'select':
      return (
        <SelectField field={field} value={value as OptionValue} onChange={onChange} error={error} />
      );
    case 'choice':
      return (
        <ChoiceField
          field={field}
          value={value as OptionValue}
          onChange={onChange}
          error={error}
          tones={look?.tones}
          segmented={look?.compact && field.options.length <= 2}
        />
      );
    case 'yes_no':
      return (
        <YesNoField
          field={field}
          value={value as YesNoValue}
          onChange={onChange}
          error={error}
          number={number}
          stacked={look?.compact}
          tones={look?.tones}
        />
      );
    case 'check':
      return (
        <CheckField
          field={field}
          value={value as CheckValue}
          onChange={onChange}
          error={error}
          number={number}
        />
      );
    case 'checkbox':
      return (
        <CheckboxField
          field={field}
          value={value as CheckboxValue}
          onChange={onChange}
          error={error}
        />
      );
    case 'photos':
      return (
        <PhotosField field={field} value={value as PhotosValue} onChange={onChange} error={error} />
      );
    case 'calc':
      return null;
  }
}

function FieldNode({
  field,
  name,
  bare,
  look,
}: {
  field: FormField;
  name: string;
  bare?: boolean;
  look?: FieldLook;
}) {
  const { control, clearErrors } = useFormContext<FormValues>();
  const { registerField, numbers } = useFormLayout();
  const { field: input, fieldState } = useController({ control, name });
  const ref = useMemo(() => registerField(name), [registerField, name]);
  const readOnly = useFormReadOnly();

  function change(value: unknown) {
    input.onChange(value);
    if (fieldState.error && !isEmptyValue(value)) clearErrors(name);
  }

  return (
    <View ref={ref} collapsable={false} className={readOnly ? 'pointer-events-none' : undefined}>
      <FieldInput
        field={field}
        value={input.value}
        onChange={change}
        error={fieldState.error?.message}
        number={bare || look ? undefined : numbers.get(field.id)}
        bare={bare}
        look={look}
      />
    </View>
  );
}

function RemoveEntryButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${label}`}
        onPress={() => setConfirming(true)}
        className="size-14 items-center justify-center rounded-lg active:bg-destructive/10"
      >
        <Icon name="trash-outline" size={22} color={colors.destructive} />
      </Pressable>
      {confirming ? (
        <ConfirmDialog
          title={`¿Quitar ${label}?`}
          message="Se borran los datos que escribiste en él."
          confirmLabel="Quitar"
          tone="destructive"
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onConfirm();
          }}
        />
      ) : null}
    </>
  );
}

function EntryCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove?: () => void;
  children: ReactNode;
}) {
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-surface pl-5 pr-2">
        <Text className="flex-1 font-sans-semibold text-lg text-foreground">{title}</Text>
        {onRemove ? <RemoveEntryButton label={title.toLowerCase()} onConfirm={onRemove} /> : null}
      </View>
      <View className="gap-5 p-5">{children}</View>
    </View>
  );
}

function Collection({
  name,
  label,
  addLabel,
  emptyText,
  nodes,
}: {
  name: string;
  label: string;
  addLabel: string;
  emptyText: string;
  nodes: FormNode[];
}) {
  const { fields, append, remove } = useFieldArray<EntryValues>({ name });
  const singular = singularOf(addLabel);
  const readOnly = useFormReadOnly();

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <Text
          accessibilityRole="header"
          className="flex-1 font-sans-semibold text-lg text-foreground"
        >
          {label}
        </Text>
        <View className="rounded-full bg-surface px-3 py-1">
          <Text className="font-sans-semibold text-sm text-muted">{fields.length}</Text>
        </View>
      </View>
      {fields.length === 0 ? (
        <Text className="rounded-lg border border-dashed border-border-strong px-4 py-4 font-sans text-base text-muted">
          {readOnly ? 'Sin registros.' : emptyText}
        </Text>
      ) : null}
      {fields.map((entry, index) => (
        <EntryCard
          key={entry.id}
          title={`${singular} ${index + 1}`}
          onRemove={readOnly ? undefined : () => remove(index)}
        >
          <ScopeProvider prefix={`${name}.${index}.`} nodes={nodes}>
            <Nodes nodes={nodes} />
          </ScopeProvider>
        </EntryCard>
      ))}
      {readOnly ? null : (
        <TextAction icon="add-circle-outline" label={addLabel} onPress={() => append({})} />
      )}
    </View>
  );
}

function ListNode({ list }: { list: FormList }) {
  const { prefix } = useFormScope();
  return (
    <Collection
      name={`${prefix}${list.id}`}
      label={list.label}
      addLabel={list.addLabel}
      emptyText={`Aún no hay registros. Toca «${list.addLabel}» para empezar.`}
      nodes={list.children}
    />
  );
}

const observationTones: Record<string, Partial<Record<string, OptionTone>>> = {
  classification: {
    noncritical_deficiency: 'neutral',
    critical_deficiency: 'danger',
    impairment: 'destructive',
  },
  status: { open: 'neutral', closed: 'primary' },
  quote_required: { no: 'neutral' },
};

const badgeStyles: Record<OptionTone, { box: string; text: string }> = {
  primary: { box: 'bg-primary/15', text: 'text-primary-strong' },
  danger: { box: 'bg-danger/15', text: 'text-danger-strong' },
  neutral: { box: 'bg-border', text: 'text-foreground' },
  destructive: { box: 'bg-destructive', text: 'text-on-destructive' },
};

function Badge({ label, tone }: { label: string; tone: OptionTone }) {
  const style = badgeStyles[tone];
  return (
    <View className={`rounded-full px-3 py-1 ${style.box}`}>
      <Text className={`font-sans-semibold text-sm ${style.text}`}>{label}</Text>
    </View>
  );
}

function OptionBadge({ fields, id, value }: { fields: FormNode[]; id: string; value: unknown }) {
  const field = fields.find((item) => 'id' in item && item.id === id);
  if (field?.type !== 'choice' || typeof value !== 'string') return null;
  const option = field.options.find((item) => item.value === value);
  if (!option) return null;
  return <Badge label={option.label} tone={observationTones[id]?.[value] ?? 'neutral'} />;
}

function ObservationBody({ fields, name }: { fields: FormField[]; name: string }) {
  const blocks = useMemo(() => arrangeObservation(fields), [fields]);
  return (
    <ScopeProvider prefix={name} nodes={fields}>
      <View className="gap-8">
        {blocks.map((block) => (
          <View key={block.title} className="gap-4">
            <View className="flex-row items-center gap-2">
              <Icon name={block.icon} size={20} color={colors['primary-strong']} />
              <Text
                accessibilityRole="header"
                className="font-sans-semibold text-base text-primary-strong"
              >
                {block.title}
              </Text>
              <View className="ml-2 h-px flex-1 bg-border" />
            </View>
            {block.rows.map((row) => (
              <View key={row.map((field) => field.id).join()} className="flex-row flex-wrap gap-4">
                {row.map((field) => (
                  <Visible key={field.id} id={field.id}>
                    <View
                      style={{
                        flexGrow: 1,
                        flexBasis: field.type === 'text' && field.multiline ? 320 : 220,
                      }}
                    >
                      <FieldNode
                        field={field}
                        name={`${name}${field.id}`}
                        look={{ compact: true, tones: observationTones[field.id] }}
                      />
                    </View>
                  </Visible>
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScopeProvider>
  );
}

function ObservationCard({
  fields,
  name,
  number,
  open,
  onToggle,
  onRemove,
}: {
  fields: FormField[];
  name: string;
  number: number;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const row = (useWatch<FormValues>({ name }) ?? {}) as FormValues;
  const summary = observationSummary(row);
  const title = `Observación ${number}`;

  return (
    <View
      className={`overflow-hidden rounded-2xl border bg-background ${open ? 'border-primary-strong' : 'border-border'}`}
    >
      <View className="flex-row items-center gap-2 bg-surface pr-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={summary ? `${title}: ${summary}` : title}
          accessibilityState={{ expanded: open }}
          onPress={onToggle}
          className="min-h-20 flex-1 flex-row items-center gap-4 py-3 pl-4 active:bg-border/60"
        >
          <View className="size-10 items-center justify-center rounded-full bg-foreground">
            <Text className="font-sans-bold text-base text-background">{number}</Text>
          </View>
          <View className="flex-1 gap-1.5">
            <Text numberOfLines={1} className="font-sans-semibold text-lg text-foreground">
              {title}
              {summary ? <Text className="font-sans text-lg text-muted"> · {summary}</Text> : null}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <OptionBadge fields={fields} id="classification" value={row.classification} />
              <OptionBadge fields={fields} id="status" value={row.status} />
              {row.quote_required === 'yes' ? (
                <Badge label="Requiere cotización" tone="primary" />
              ) : null}
            </View>
          </View>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={24} color={colors.foreground} />
        </Pressable>
        <RemoveEntryButton label={title.toLowerCase()} onConfirm={onRemove} />
      </View>
      {open ? (
        <View className="border-t border-border p-5">
          <ObservationBody fields={fields} name={`${name}.`} />
        </View>
      ) : null}
    </View>
  );
}

function ObservationsNode({ node }: { node: FormObservations }) {
  const { prefix } = useFormScope();
  const name = `${prefix}${node.id}`;
  const { fields, append, remove } = useFieldArray<EntryValues>({ name });
  const [collapsed, setCollapsed] = useState(
    () => new Set(fields.length > 1 ? fields.map((entry) => entry.id) : []),
  );

  function toggle(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <View className="gap-4">
      {fields.length === 0 ? (
        <View className="items-center gap-2 rounded-2xl border border-dashed border-border-strong px-6 py-8">
          <Icon name="clipboard-outline" size={36} color={colors.muted} />
          <Text className="text-center font-sans-semibold text-lg text-foreground">
            Aún no hay observaciones
          </Text>
          <Text className="max-w-[480px] text-center font-sans text-base text-muted">
            Agrega una por cada hallazgo: dónde está, qué tan grave es y cómo se corrige.
          </Text>
        </View>
      ) : (
        <Text className="font-sans-medium text-base text-muted">
          {fields.length === 1 ? '1 observación' : `${fields.length} observaciones`}
        </Text>
      )}
      {fields.map((entry, index) => (
        <ObservationCard
          key={entry.id}
          fields={node.children}
          name={`${name}.${index}`}
          number={index + 1}
          open={!collapsed.has(entry.id)}
          onToggle={() => toggle(entry.id)}
          onRemove={() => remove(index)}
        />
      ))}
      <TextAction
        icon="add-circle-outline"
        label="Agregar observación"
        onPress={() => append({})}
      />
    </View>
  );
}

const labelWidth = 200;
const cellWidth = 160;

function TableCell({ column, rowPrefix }: { column: FormField; rowPrefix: string }) {
  if (column.type === 'calc') return <CalcValue field={column} rowPrefix={rowPrefix} />;
  return <FieldNode field={column} name={`${rowPrefix}${column.id}`} bare />;
}

function TableNode({ table }: { table: FormTable }) {
  const { prefix } = useFormScope();
  const base = `${prefix}${table.id}`;

  return (
    <View className="gap-3">
      {table.label ? (
        <Text accessibilityRole="header" className="font-sans-semibold text-lg text-foreground">
          {table.label}
        </Text>
      ) : null}
      <ScrollView
        horizontal
        className="rounded-xl border border-border"
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <View className="flex-row border-b border-border bg-surface">
            <View style={{ width: labelWidth }} className="justify-end px-4 py-3" />
            {table.columns.map((column) => (
              <View key={column.id} style={{ width: cellWidth }} className="justify-end px-2 py-3">
                <Text className="font-sans-semibold text-sm text-foreground">{column.label}</Text>
                {'unit' in column && column.unit ? (
                  <Text className="font-sans text-sm text-muted">{column.unit}</Text>
                ) : null}
              </View>
            ))}
          </View>
          {table.rows.map((row, index) => (
            <View
              key={row.id}
              className={`flex-row items-center ${index > 0 ? 'border-t border-border' : ''}`}
            >
              <View style={{ width: labelWidth }} className="px-4 py-2">
                <Text className="font-sans-medium text-base text-foreground">{row.label}</Text>
              </View>
              {table.columns.map((column) => (
                <View key={column.id} style={{ width: cellWidth }} className="px-2 py-2">
                  <TableCell column={column} rowPrefix={`${base}.${row.id}.`} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function GroupNode({ group }: { group: FormGroup }) {
  if (group.style === 'band') {
    return (
      <View className="gap-4">
        {group.label ? (
          <View className="flex-row items-center gap-3 rounded-lg border-l-4 border-primary-strong bg-surface px-4 py-3">
            <Text
              accessibilityRole="header"
              className="flex-1 font-sans-semibold text-lg text-foreground"
            >
              {group.label}
            </Text>
          </View>
        ) : null}
        <Nodes nodes={group.children} />
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-xl border border-border p-5">
      {group.label ? (
        <Text accessibilityRole="header" className="font-sans-semibold text-lg text-foreground">
          {group.label}
        </Text>
      ) : null}
      <Nodes nodes={group.children} />
    </View>
  );
}

function NodeContent({ node }: { node: FormNode }) {
  const { prefix } = useFormScope();
  if (node.type === 'calc') return <CalcNode field={node} />;
  if (isField(node)) return <FieldNode field={node} name={`${prefix}${node.id}`} />;
  switch (node.type) {
    case 'group':
      return <GroupNode group={node} />;
    case 'note':
      return <NoteNode text={node.text} tone={node.tone} />;
    case 'list':
      return <ListNode list={node} />;
    case 'table':
      return <TableNode table={node} />;
    case 'observations':
      return <ObservationsNode node={node} />;
    default:
      return <PumpPerformanceChart title={node.label} />;
  }
}

function Visible({ id, children }: { id?: string; children: ReactNode }) {
  const { hidden } = useFormScope();
  return id && hidden.has(id) ? null : children;
}

const keyOf = (node: FormNode, index: number) => ('id' in node ? node.id : `note-${index}`);

export const RenderNode = memo(function RenderNode({
  node,
  className,
}: {
  node: FormNode;
  className?: string;
}) {
  const content = <NodeContent node={node} />;
  return (
    <Visible id={'id' in node ? node.id : undefined}>
      {className ? <View className={className}>{content}</View> : content}
    </Visible>
  );
});

function ChunkView({ chunk }: { chunk: Chunk }) {
  const { width } = useWindowDimensions();

  if (chunk.kind === 'rows') {
    return (
      <View className="overflow-hidden rounded-xl border border-border bg-background">
        {chunk.nodes.map((node, index) => (
          <RenderNode
            key={keyOf(node, index)}
            node={node}
            className={index > 0 ? 'border-t border-border' : undefined}
          />
        ))}
      </View>
    );
  }

  if (chunk.kind === 'chips') {
    return (
      <View className="flex-row flex-wrap gap-3">
        {chunk.nodes.map((node, index) => (
          <RenderNode key={keyOf(node, index)} node={node} />
        ))}
      </View>
    );
  }

  if (chunk.kind === 'grid') {
    const cell = width >= 640 ? 'w-1/2 px-3' : 'w-full px-3';
    return (
      <View className="-mx-3 flex-row flex-wrap gap-y-5">
        {chunk.nodes.map((node, index) => (
          <RenderNode key={keyOf(node, index)} node={node} className={cell} />
        ))}
      </View>
    );
  }

  return <RenderNode node={chunk.nodes[0]} />;
}

export function Nodes({ nodes }: { nodes: FormNode[] }) {
  const chunks = useMemo(() => chunkNodes(nodes), [nodes]);
  return (
    <View className="gap-5">
      {chunks.map((chunk, index) => (
        <ChunkView key={index} chunk={chunk} />
      ))}
    </View>
  );
}
