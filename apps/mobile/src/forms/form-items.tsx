import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import {
  useController,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import type { FormDefinition, FormSection, FormServiceType } from '@nimzo/shared';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { TextField } from '@/components/text-field';
import { requiredMessage, useFormLayout } from '@/forms/form-context';
import {
  customSectionsKey,
  customServiceType,
  entryProgress,
  enabledSections,
  type FormValues,
  itemKeyProblem,
  serviceTypeKey,
} from '@/forms/form-values';
import { NoteNode, Nodes, ScopeProvider, singularOf } from '@/forms/render-node';
import { colors } from '@/theme';

type EntryValues = Record<string, Record<string, unknown>[]>;

type ServiceTypePickerProps = {
  serviceType: FormServiceType;
  sections: FormSection[];
  prefix?: string;
};

function RadioCard({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-16 flex-row items-center gap-3 rounded-xl border-2 px-4 py-3 ${selected ? 'border-primary-strong bg-primary/10' : 'border-border bg-background active:bg-surface'}`}
    >
      <Icon
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={24}
        color={selected ? colors['primary-strong'] : colors['border-strong']}
      />
      <Text className="flex-1 font-sans-medium text-base text-foreground">{label}</Text>
    </Pressable>
  );
}

export function ServiceTypePicker({ serviceType, sections, prefix = '' }: ServiceTypePickerProps) {
  const { width } = useWindowDimensions();
  const { registerField } = useFormLayout();
  const { clearErrors } = useFormContext<FormValues>();
  const typeName = `${prefix}${serviceTypeKey}`;
  const ref = useMemo(() => registerField(typeName), [registerField, typeName]);
  const type = useController<FormValues>({ name: typeName });
  const custom = useController<FormValues>({ name: `${prefix}${customSectionsKey}` });
  const chosen = type.field.value;
  const picked = Array.isArray(custom.field.value) ? (custom.field.value as string[]) : [];
  const options = [
    ...serviceType.options.map((option) => ({ value: option.value, label: option.label })),
    ...(serviceType.allowCustom
      ? [{ value: customServiceType, label: 'Otro: elegir las secciones' }]
      : []),
  ];
  const cell = width >= 640 ? 'w-1/2 p-1.5' : 'w-full p-1.5';

  function toggle(id: string) {
    custom.field.onChange(
      picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id],
    );
  }

  return (
    <View ref={ref} collapsable={false} className="gap-4">
      {serviceType.help ? (
        <Text className="font-sans text-base text-muted">{serviceType.help}</Text>
      ) : null}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={serviceType.label}
        className="-m-1.5 flex-row flex-wrap"
      >
        {options.map((option) => (
          <View key={option.value} className={cell}>
            <RadioCard
              label={option.label}
              selected={chosen === option.value}
              onPress={() => {
                type.field.onChange(option.value);
                clearErrors(typeName);
              }}
            />
          </View>
        ))}
      </View>
      {type.fieldState.error ? (
        <Text className="font-sans-semibold text-base text-danger-strong">
          Elige el tipo de servicio
        </Text>
      ) : null}
      {chosen === customServiceType ? (
        <View className="gap-3">
          <Text className="font-sans-medium text-base text-foreground">
            Marca las secciones que aplican
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {sections.map((section, index) => {
              const checked = picked.includes(section.id);
              return (
                <Pressable
                  key={section.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  onPress={() => toggle(section.id)}
                  className={`min-h-14 flex-row items-center gap-3 rounded-lg border-2 py-2 pl-3 pr-5 ${checked ? 'border-primary-strong bg-primary/10' : 'border-border bg-background active:bg-surface'}`}
                >
                  <Icon
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={26}
                    color={checked ? colors['primary-strong'] : colors['border-strong']}
                  />
                  <Text className="font-sans-medium text-base text-foreground">
                    {index + 1}. {section.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function SectionBlock({
  number,
  section,
  children,
}: {
  number: number;
  section: FormSection;
  children: ReactNode;
}) {
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3 rounded-lg bg-surface px-4 py-3">
        <View className="size-8 items-center justify-center rounded-full bg-foreground">
          <Text className="font-sans-bold text-sm text-background">{number}</Text>
        </View>
        <View className="flex-1">
          <Text accessibilityRole="header" className="font-sans-semibold text-lg text-foreground">
            {section.title}
          </Text>
          {section.note ? (
            <Text className="font-sans text-base text-muted">{section.note}</Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function ItemBody({ definition, name }: { definition: FormDefinition; name: string }) {
  const items = definition.items!;
  const [rootType, rootCustom, entryType, entryCustom] = useWatch<FormValues>({
    name: [
      serviceTypeKey,
      customSectionsKey,
      `${name}.${serviceTypeKey}`,
      `${name}.${customSectionsKey}`,
    ],
  }) as unknown[];
  const shared = enabledSections(items.sections, definition.serviceType, {
    [serviceTypeKey]: rootType,
    [customSectionsKey]: rootCustom,
  });
  const sections = enabledSections(shared, items.serviceType, {
    [serviceTypeKey]: entryType,
    [customSectionsKey]: entryCustom,
  });
  const nodes = items.sections.flatMap((section) => section.children);

  return (
    <ScopeProvider prefix={`${name}.`} nodes={nodes}>
      <View className="gap-6">
        {items.serviceType ? (
          <ServiceTypePicker
            serviceType={items.serviceType}
            sections={shared}
            prefix={`${name}.`}
          />
        ) : null}
        {sections.length === 0 ? (
          <NoteNode
            tone="info"
            text="Elige el tipo de servicio para ver las secciones que debes llenar."
          />
        ) : null}
        {sections.map((section) => (
          <SectionBlock
            key={section.id}
            number={items.sections.indexOf(section) + 1}
            section={section}
          >
            <Nodes nodes={section.children} />
          </SectionBlock>
        ))}
      </View>
    </ScopeProvider>
  );
}

function ItemProgress({ definition, name }: { definition: FormDefinition; name: string }) {
  const [entry, rootType, rootCustom] = useWatch<FormValues>({
    name: [name, serviceTypeKey, customSectionsKey],
  }) as unknown[];
  const progress = entryProgress(
    definition,
    { [serviceTypeKey]: rootType, [customSectionsKey]: rootCustom },
    (entry ?? {}) as FormValues,
  );
  if (progress.total === 0) return null;
  const complete = progress.answered === progress.total;
  return (
    <View className={`rounded-full px-3 py-1 ${complete ? 'bg-success' : 'bg-background'}`}>
      <Text className={`font-sans-semibold text-sm ${complete ? 'text-on-success' : 'text-muted'}`}>
        {complete ? 'Completo' : `${progress.answered} de ${progress.total}`}
      </Text>
    </View>
  );
}

function ItemCard({
  definition,
  index,
  open,
  onToggle,
  onRemove,
}: {
  definition: FormDefinition;
  index: number;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const items = definition.items!;
  const name = `${items.id}.${index}`;
  const key = useWatch<FormValues>({ name: `${name}.key` });
  const title = `${singularOf(items.addLabel)} ${typeof key === 'string' ? key : index + 1}`;
  const [confirming, setConfirming] = useState(false);
  const { registerField } = useFormLayout();
  const ref = useMemo(() => registerField(name), [registerField, name]);
  const { getFieldState } = useFormContext<FormValues>();
  const formState = useFormState<FormValues>({ name });
  const incomplete = getFieldState(name, formState).invalid;
  const border = incomplete
    ? 'border-danger-strong'
    : open
      ? 'border-primary-strong'
      : 'border-border';

  return (
    <View
      ref={ref}
      collapsable={false}
      className={`overflow-hidden rounded-xl border bg-background ${border}`}
    >
      <View className="flex-row items-center gap-2 bg-surface pr-2">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={onToggle}
          className="min-h-16 flex-1 flex-row items-center gap-3 pl-5"
        >
          <Icon
            name={open ? 'chevron-down' : 'chevron-forward'}
            size={22}
            color={colors.foreground}
          />
          <View className="flex-1 gap-0.5 py-2">
            <Text className="font-sans-semibold text-lg text-foreground">{title}</Text>
            {incomplete ? (
              <Text className="font-sans-semibold text-sm text-danger-strong">
                Faltan campos obligatorios
              </Text>
            ) : null}
          </View>
          <ItemProgress definition={definition} name={name} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${title}`}
          onPress={() => setConfirming(true)}
          className="size-14 items-center justify-center rounded-lg active:bg-destructive/10"
        >
          <Icon name="trash-outline" size={22} color={colors.destructive} />
        </Pressable>
      </View>
      {open ? (
        <View className="border-t border-border p-5">
          <ItemBody definition={definition} name={name} />
        </View>
      ) : null}
      {confirming ? (
        <ConfirmDialog
          title={`¿Quitar ${title}?`}
          message="Se borran las respuestas que llenaste para este registro."
          confirmLabel="Quitar"
          tone="destructive"
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onRemove();
          }}
        />
      ) : null}
    </View>
  );
}

function nextKey(entries: FormValues[]) {
  const numbers = entries.map((entry) => Number(entry.key)).filter(Number.isFinite);
  return String((numbers.length ? Math.max(...numbers) : 0) + 1);
}

export function ItemsNode({ definition }: { definition: FormDefinition }) {
  const items = definition.items!;
  const { getValues, getFieldState, clearErrors } = useFormContext<FormValues>();
  const { registerField } = useFormLayout();
  const ref = useMemo(() => registerField(items.id), [registerField, items.id]);
  const formState = useFormState<FormValues>({ name: items.id });
  const noItems = getFieldState(items.id, formState).error?.message === requiredMessage;
  const { fields, append, remove } = useFieldArray<EntryValues>({ name: items.id });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [key, setKey] = useState('');
  const [problem, setProblem] = useState<string>();
  const singular = singularOf(items.addLabel).toLowerCase();

  function add() {
    const entries = (getValues(items.id) as FormValues[] | undefined) ?? [];
    if (items.keyLabel) {
      const issue = itemKeyProblem(key, entries, items.keyLabel);
      setProblem(issue);
      if (issue) return;
      append({ key: key.trim() });
      setKey('');
    } else {
      append({ key: nextKey(entries) });
    }
    setOpenIndex(fields.length);
    clearErrors(items.id);
  }

  return (
    <View ref={ref} collapsable={false} className="gap-4">
      {fields.length === 0 ? (
        <Text className="rounded-lg border border-dashed border-border-strong px-4 py-4 font-sans text-base text-muted">
          Agrega cada {singular} que revises. Cada uno tiene sus propias secciones.
        </Text>
      ) : null}
      {noItems ? (
        <Text className="font-sans-semibold text-base text-danger-strong">
          Agrega por lo menos un registro con «{items.addLabel}».
        </Text>
      ) : null}
      {fields.map((entry, index) => (
        <ItemCard
          key={entry.id}
          definition={definition}
          index={index}
          open={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onRemove={() => {
            remove(index);
            setOpenIndex(null);
          }}
        />
      ))}
      <View className="flex-row flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        {items.keyLabel ? (
          <View className="min-w-64 flex-1">
            <TextField
              label={items.keyLabel}
              value={key}
              error={problem}
              onChangeText={(text) => {
                setKey(text);
                if (problem) setProblem(undefined);
              }}
              onSubmitEditing={add}
              returnKeyType="done"
            />
          </View>
        ) : null}
        <Button variant="secondary" icon="add" label={items.addLabel} onPress={add} />
      </View>
    </View>
  );
}
