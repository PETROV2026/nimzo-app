import { memo, type ReactNode, useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useController, useFormContext } from 'react-hook-form';
import type { FormField, FormGroup, FormNode, FormNote } from '@nimzo/shared';
import { Icon } from '@/components/icon';
import { CheckField } from '@/forms/fields/check-field';
import { CheckboxField } from '@/forms/fields/checkbox-field';
import { ChoiceField } from '@/forms/fields/choice-field';
import { DateField } from '@/forms/fields/date-field';
import { PhotosField } from '@/forms/fields/photos-field';
import { SelectField } from '@/forms/fields/select-field';
import { TextFormField } from '@/forms/fields/text-field';
import { TimeField } from '@/forms/fields/time-field';
import { YesNoField } from '@/forms/fields/yes-no-field';
import { useFormLayout } from '@/forms/form-context';
import {
  type Chunk,
  chunkNodes,
  type FormValues,
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
import { colors } from '@/theme';

const pendingLabels: Partial<Record<FormNode['type'], string>> = {
  table: 'Tabla',
  list: 'Lista',
  observations: 'Observaciones',
  chart: 'Gráfica',
  calc: 'Valor calculado',
};

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

function pendingLabel(node: FormNode) {
  const kind = pendingLabels[node.type] ?? 'Elemento';
  return 'label' in node && node.label ? `${kind} · ${node.label}` : kind;
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

type InputProps = {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  number?: string;
};

function FieldInput({ field, value, onChange, error, number }: InputProps) {
  switch (field.type) {
    case 'text':
      return (
        <TextFormField field={field} value={value as TextValue} onChange={onChange} error={error} />
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
      return <PendingNode label={pendingLabel(field)} />;
  }
}

function FieldNode({ field }: { field: FormField }) {
  const { control, clearErrors } = useFormContext<FormValues>();
  const { registerField, numbers } = useFormLayout();
  const { field: input, fieldState } = useController({ control, name: field.id });
  const ref = useMemo(() => registerField(field.id), [registerField, field.id]);

  function change(value: unknown) {
    input.onChange(value);
    if (fieldState.error && !isEmptyValue(value)) clearErrors(field.id);
  }

  return (
    <View ref={ref} collapsable={false}>
      <FieldInput
        field={field}
        value={input.value}
        onChange={change}
        error={fieldState.error?.message}
        number={numbers.get(field.id)}
      />
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
  if (isField(node)) return <FieldNode field={node} />;
  if (node.type === 'group') return <GroupNode group={node} />;
  if (node.type === 'note') return <NoteNode text={node.text} tone={node.tone} />;
  return <PendingNode label={pendingLabel(node)} />;
}

function Visible({ id, children }: { id?: string; children: ReactNode }) {
  const { hidden } = useFormLayout();
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
