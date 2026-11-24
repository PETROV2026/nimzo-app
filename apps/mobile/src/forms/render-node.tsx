import { memo, type ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useController, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type {
  FormField,
  FormGroup,
  FormList,
  FormNode,
  FormNote,
  FormObservations,
  FormTable,
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
import { FormScopeContext, useFormLayout, useFormScope } from '@/forms/form-context';
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

type InputProps = {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  number?: string;
  bare?: boolean;
};

function FieldInput({ field, value, onChange, error, number, bare }: InputProps) {
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
        <ChoiceField field={field} value={value as OptionValue} onChange={onChange} error={error} />
      );
    case 'yes_no':
      return (
        <YesNoField
          field={field}
          value={value as YesNoValue}
          onChange={onChange}
          error={error}
          number={number}
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

function FieldNode({ field, name, bare }: { field: FormField; name: string; bare?: boolean }) {
  const { control, clearErrors } = useFormContext<FormValues>();
  const { registerField, numbers } = useFormLayout();
  const { field: input, fieldState } = useController({ control, name });
  const ref = useMemo(() => registerField(name), [registerField, name]);

  function change(value: unknown) {
    input.onChange(value);
    if (fieldState.error && !isEmptyValue(value)) clearErrors(name);
  }

  return (
    <View ref={ref} collapsable={false}>
      <FieldInput
        field={field}
        value={input.value}
        onChange={change}
        error={fieldState.error?.message}
        number={bare ? undefined : numbers.get(field.id)}
        bare={bare}
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
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-surface pl-5 pr-2">
        <Text className="flex-1 font-sans-semibold text-lg text-foreground">{title}</Text>
        <RemoveEntryButton label={title.toLowerCase()} onConfirm={onRemove} />
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
          {emptyText}
        </Text>
      ) : null}
      {fields.map((entry, index) => (
        <EntryCard key={entry.id} title={`${singular} ${index + 1}`} onRemove={() => remove(index)}>
          <ScopeProvider prefix={`${name}.${index}.`} nodes={nodes}>
            <Nodes nodes={nodes} />
          </ScopeProvider>
        </EntryCard>
      ))}
      <TextAction icon="add-circle-outline" label={addLabel} onPress={() => append({})} />
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

const observationNodes: FormNode[] = [
  { id: 'system', type: 'text', label: 'Sistema' },
  {
    id: 'status',
    type: 'choice',
    label: 'Estado',
    options: [
      { value: 'open', label: 'Abierta' },
      { value: 'closed', label: 'Cerrada' },
    ],
  },
  { id: 'observation', type: 'text', label: 'Observación', multiline: true },
];

function ObservationsNode({ node }: { node: FormObservations }) {
  const { prefix } = useFormScope();
  return (
    <Collection
      name={`${prefix}${node.id}`}
      label="Observaciones"
      addLabel="Agregar observación"
      emptyText="Aún no hay observaciones. Agrega una por cada hallazgo que quieras reportar."
      nodes={observationNodes}
    />
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
