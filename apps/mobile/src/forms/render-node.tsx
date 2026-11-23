import { memo, type ReactNode, useMemo } from 'react';
import { Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
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
import { type FormValues, isEmptyValue, isField } from '@/forms/form-values';
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
        size={24}
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
};

function FieldInput({ field, value, onChange, error }: InputProps) {
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
        <YesNoField field={field} value={value as YesNoValue} onChange={onChange} error={error} />
      );
    case 'check':
      return (
        <CheckField field={field} value={value as CheckValue} onChange={onChange} error={error} />
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
  const { registerField } = useFormLayout();
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
      />
    </View>
  );
}

function GroupNode({ group }: { group: FormGroup }) {
  const { width, height } = useWindowDimensions();
  const twoColumns = group.columns === 2 && width > height;
  const cell: ViewStyle | undefined = twoColumns ? { flexBasis: '40%', flexGrow: 1 } : undefined;
  const body = (
    <View className={twoColumns ? 'flex-row flex-wrap gap-x-8 gap-y-6' : 'gap-6'}>
      {group.children.map((child, index) => (
        <RenderNode key={'id' in child ? child.id : index} node={child} style={cell} />
      ))}
    </View>
  );

  if (group.style === 'band') {
    return (
      <View className="gap-5">
        {group.label ? (
          <View className="rounded-lg bg-muted px-4 py-3">
            <Text accessibilityRole="header" className="font-sans-semibold text-lg text-background">
              {group.label}
            </Text>
          </View>
        ) : null}
        {body}
      </View>
    );
  }

  return (
    <View className="gap-5 rounded-lg border-2 border-border p-5">
      {group.label ? (
        <Text accessibilityRole="header" className="font-sans-semibold text-lg text-foreground">
          {group.label}
        </Text>
      ) : null}
      {body}
    </View>
  );
}

function NodeContent({ node }: { node: FormNode }) {
  if (isField(node)) return <FieldNode field={node} />;
  if (node.type === 'group') return <GroupNode group={node} />;
  if (node.type === 'note') return <NoteNode text={node.text} tone={node.tone} />;
  return <PendingNode label={pendingLabel(node)} />;
}

type RenderNodeProps = { node: FormNode; style?: ViewStyle };

function Visible({ id, children }: { id?: string; children: ReactNode }) {
  const { hidden } = useFormLayout();
  return id && hidden.has(id) ? null : children;
}

export const RenderNode = memo(function RenderNode({ node, style }: RenderNodeProps) {
  const content = <NodeContent node={node} />;
  return (
    <Visible id={'id' in node ? node.id : undefined}>
      {style ? <View style={style}>{content}</View> : content}
    </Visible>
  );
});
