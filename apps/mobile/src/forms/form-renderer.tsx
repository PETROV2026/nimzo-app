import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance, Text, View, type ViewInstance } from 'react-native';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import type { FormDefinition, FormNode } from '@nimzo/shared';
import { Button } from '@/components/button';
import { FormLayoutContext, requiredMessage } from '@/forms/form-context';
import {
  conditionFields,
  type FormValues,
  hiddenIds,
  missingRequired,
  visibleValues,
} from '@/forms/form-values';
import { NoteNode, PendingNode, RenderNode } from '@/forms/render-node';

type FormRendererProps = {
  definition: FormDefinition;
  defaultValues?: FormValues;
  onValuesChange?: (values: FormValues) => void;
  header?: ReactNode;
  footer?: ReactNode;
};

type Review = { missing: number } | null;

function Card({ title, note, children }: { title?: string; note?: string; children: ReactNode }) {
  return (
    <View className="gap-6 rounded-xl bg-background p-6">
      {title ? (
        <View className="gap-1">
          <Text accessibilityRole="header" className="font-sans-bold text-xl text-foreground">
            {title}
          </Text>
          {note ? <Text className="font-sans text-base text-muted">{note}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

function Nodes({ nodes }: { nodes: FormNode[] }) {
  return (
    <View className="gap-6">
      {nodes.map((node, index) => (
        <RenderNode key={'id' in node ? node.id : index} node={node} />
      ))}
    </View>
  );
}

function useHidden(definition: FormDefinition) {
  const fields = useMemo(() => conditionFields(definition), [definition]);
  const watched: readonly unknown[] = useWatch<FormValues>({ name: fields });
  return useMemo(() => {
    const values = Object.fromEntries(fields.map((field, index) => [field, watched[index]]));
    return hiddenIds(definition, values);
  }, [definition, fields, watched]);
}

function FormBody({ definition }: { definition: FormDefinition }) {
  const reportGroup = useMemo<FormNode>(
    () => ({
      type: 'group',
      id: 'report_fields',
      style: 'band',
      columns: 2,
      children: definition.report,
    }),
    [definition.report],
  );
  const comments = useMemo<FormNode>(
    () => ({ id: 'comments', type: 'text', label: definition.commentsLabel, multiline: true }),
    [definition.commentsLabel],
  );
  const pending = definition.serviceType ?? definition.items?.serviceType;

  return (
    <View className="gap-6">
      {definition.instructions ? <NoteNode text={definition.instructions} tone="info" /> : null}
      {pending ? (
        <PendingNode label="Tipo de servicio (por ahora se muestran todas las secciones)" />
      ) : null}
      {definition.report.length > 0 ? (
        <Card title="Datos del reporte">
          <RenderNode node={reportGroup} />
        </Card>
      ) : null}
      {definition.header?.length ? (
        <Card title="Encabezado">
          <Nodes nodes={definition.header} />
        </Card>
      ) : null}
      {definition.sections.map((section, index) => (
        <Card key={section.id} title={`${index + 1}. ${section.title}`} note={section.note}>
          <Nodes nodes={section.children} />
        </Card>
      ))}
      {definition.items ? (
        <Card title={definition.items.title}>
          <PendingNode label={`Llenado por equipo · ${definition.items.addLabel}`} />
        </Card>
      ) : null}
      <Card>
        <RenderNode node={comments} />
      </Card>
    </View>
  );
}

function LayoutProvider({
  definition,
  registerField,
  children,
}: {
  definition: FormDefinition;
  registerField: (id: string) => (view: ViewInstance | null) => void;
  children: ReactNode;
}) {
  const hidden = useHidden(definition);
  const layout = useMemo(() => ({ hidden, registerField }), [hidden, registerField]);
  return <FormLayoutContext.Provider value={layout}>{children}</FormLayoutContext.Provider>;
}

export function FormRenderer({
  definition,
  defaultValues,
  onValuesChange,
  header,
  footer,
}: FormRendererProps) {
  const form = useForm<FormValues>({ defaultValues: defaultValues ?? {} });
  const { subscribe, getValues, setError, clearErrors } = form;
  const scrollRef = useRef<ScrollViewInstance>(null);
  const contentRef = useRef<ViewInstance>(null);
  const fieldViews = useRef(new Map<string, ViewInstance>());
  const [review, setReview] = useState<Review>(null);

  const registerField = useCallback(
    (id: string) => (view: ViewInstance | null) => {
      if (view) fieldViews.current.set(id, view);
      else fieldViews.current.delete(id);
    },
    [],
  );

  useEffect(() => {
    if (!onValuesChange) return;
    onValuesChange(visibleValues(definition, getValues()));
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => onValuesChange(visibleValues(definition, values)),
    });
  }, [definition, getValues, onValuesChange, subscribe]);

  function scrollTo(id: string) {
    const target = fieldViews.current.get(id);
    const content = contentRef.current;
    if (!target || !content) return;
    target.measureLayout(content, (_x, y) => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
    });
  }

  function reviewForm() {
    const missing = missingRequired(definition, getValues());
    clearErrors();
    for (const id of missing) setError(id, { type: 'required', message: requiredMessage });
    setReview({ missing: missing.length });
    if (missing.length > 0) scrollTo(missing[0]);
  }

  return (
    <FormProvider {...form}>
      <LayoutProvider definition={definition} registerField={registerField}>
        <ScrollView
          ref={scrollRef}
          className="flex-1 bg-canvas"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-6 pb-16"
        >
          <View ref={contentRef} collapsable={false} className="gap-6">
            {header}
            <FormBody definition={definition} />
            <View className="gap-3 self-start">
              <Button label="Revisar" icon="checkmark-done-outline" onPress={reviewForm} />
              {review ? (
                <Text
                  accessibilityLiveRegion="polite"
                  className={`font-sans-medium text-base ${review.missing ? 'text-danger-strong' : 'text-foreground'}`}
                >
                  {review.missing === 0
                    ? 'No falta ningún campo obligatorio.'
                    : review.missing === 1
                      ? 'Falta 1 campo obligatorio. Está marcado en rojo.'
                      : `Faltan ${review.missing} campos obligatorios. Están marcados en rojo.`}
                </Text>
              ) : null}
            </View>
            {footer}
          </View>
        </ScrollView>
      </LayoutProvider>
    </FormProvider>
  );
}
