import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  Text,
  useWindowDimensions,
  View,
  type ViewInstance,
} from 'react-native';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import type { FormDefinition, FormNode } from '@nimzo/shared';
import { Icon } from '@/components/icon';
import { FormLayoutContext, FormProgressContext, requiredMessage } from '@/forms/form-context';
import { BottomBar, type NavTarget, ProgressPill, SectionNav } from '@/forms/form-navigation';
import {
  conditionFields,
  fieldNumbers,
  type FormValues,
  formProgress,
  hiddenIds,
  missingRequired,
  visibleValues,
} from '@/forms/form-values';
import { Nodes, PendingNode, RenderNode } from '@/forms/render-node';
import { useKeyboardVisible } from '@/lib/use-keyboard-visible';
import { colors } from '@/theme';

type FormRendererProps = {
  definition: FormDefinition;
  defaultValues?: FormValues;
  onValuesChange?: (values: FormValues) => void;
  header?: ReactNode;
  footer?: ReactNode;
};

type OnSectionLayout = (id: string, y: number) => void;

const legend = [
  { label: 'OK', meaning: 'Correcto', box: 'bg-primary-strong', text: 'text-on-primary' },
  { label: 'X', meaning: 'Incorrecto', box: 'bg-danger-strong', text: 'text-on-danger' },
  { label: 'N/A', meaning: 'No aplica', box: 'bg-muted', text: 'text-background' },
];

function Intro({ instructions, showLegend }: { instructions?: string; showLegend: boolean }) {
  if (!instructions && !showLegend) return null;
  return (
    <View className="gap-4 rounded-xl border border-border bg-background p-5">
      {instructions ? (
        <View className="flex-row items-start gap-3">
          <Icon name="information-circle-outline" size={22} color={colors.muted} />
          <Text className="flex-1 font-sans text-base text-muted">{instructions}</Text>
        </View>
      ) : null}
      {showLegend ? (
        <View className="flex-row flex-wrap gap-x-6 gap-y-2">
          {legend.map((item) => (
            <View key={item.label} className="flex-row items-center gap-2">
              <View className={`min-w-12 items-center rounded-md px-2 py-1 ${item.box}`}>
                <Text className={`font-sans-bold text-sm ${item.text}`}>{item.label}</Text>
              </View>
              <Text className="font-sans-medium text-base text-foreground">{item.meaning}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

type SectionCardProps = {
  id: string;
  title: string;
  number?: number;
  note?: string;
  onSectionLayout: OnSectionLayout;
  children: ReactNode;
};

function SectionCard({ id, title, number, note, onSectionLayout, children }: SectionCardProps) {
  return (
    <View
      onLayout={(event: LayoutChangeEvent) => onSectionLayout(id, event.nativeEvent.layout.y)}
      className="overflow-hidden rounded-2xl border border-border bg-background"
    >
      <View className="flex-row items-center gap-4 border-b border-border px-6 py-5">
        {number ? (
          <View className="size-10 items-center justify-center rounded-full bg-foreground">
            <Text className="font-sans-bold text-lg text-background">{number}</Text>
          </View>
        ) : null}
        <View className="flex-1 gap-1">
          <Text accessibilityRole="header" className="font-sans-bold text-xl text-foreground">
            {title}
          </Text>
          {note ? <Text className="font-sans text-base text-muted">{note}</Text> : null}
        </View>
        <ProgressPill id={id} />
      </View>
      <View className="gap-5 p-6">{children}</View>
    </View>
  );
}

const FormBody = memo(function FormBody({
  definition,
  onSectionLayout,
}: {
  definition: FormDefinition;
  onSectionLayout: OnSectionLayout;
}) {
  const comments = useMemo<FormNode>(
    () => ({ id: 'comments', type: 'text', label: definition.commentsLabel, multiline: true }),
    [definition.commentsLabel],
  );
  const pendingServiceType = definition.serviceType ?? definition.items?.serviceType;

  return (
    <>
      {pendingServiceType ? (
        <PendingNode label="Tipo de servicio (por ahora se muestran todas las secciones)" />
      ) : null}
      {definition.report.length > 0 ? (
        <SectionCard id="report" title="Datos del reporte" onSectionLayout={onSectionLayout}>
          <Nodes nodes={definition.report} />
        </SectionCard>
      ) : null}
      {definition.header?.length ? (
        <SectionCard id="header" title="Encabezado" onSectionLayout={onSectionLayout}>
          <Nodes nodes={definition.header} />
        </SectionCard>
      ) : null}
      {definition.sections.map((section, index) => (
        <SectionCard
          key={section.id}
          id={section.id}
          number={index + 1}
          title={section.title}
          note={section.note}
          onSectionLayout={onSectionLayout}
        >
          <Nodes nodes={section.children} />
        </SectionCard>
      ))}
      {definition.items ? (
        <SectionCard id="items" title={definition.items.title} onSectionLayout={onSectionLayout}>
          <PendingNode label={`Llenado por equipo · ${definition.items.addLabel}`} />
        </SectionCard>
      ) : null}
      <SectionCard id="comments" title={definition.commentsLabel} onSectionLayout={onSectionLayout}>
        <RenderNode node={comments} />
      </SectionCard>
    </>
  );
});

function useHidden(definition: FormDefinition) {
  const fields = useMemo(() => conditionFields(definition), [definition]);
  const watched: readonly unknown[] = useWatch<FormValues>({ name: fields });
  return useMemo(() => {
    const values = Object.fromEntries(fields.map((field, index) => [field, watched[index]]));
    return hiddenIds(definition, values);
  }, [definition, fields, watched]);
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
  const numbers = useMemo(() => fieldNumbers(definition), [definition]);
  const layout = useMemo(
    () => ({ hidden, numbers, registerField }),
    [hidden, numbers, registerField],
  );
  return <FormLayoutContext.Provider value={layout}>{children}</FormLayoutContext.Provider>;
}

function ProgressProvider({
  definition,
  children,
}: {
  definition: FormDefinition;
  children: ReactNode;
}) {
  const values = useWatch<FormValues>();
  const progress = useMemo(() => formProgress(definition, values), [definition, values]);
  return <FormProgressContext.Provider value={progress}>{children}</FormProgressContext.Provider>;
}

function navTargets(definition: FormDefinition): NavTarget[] {
  return [
    ...(definition.report.length > 0
      ? [{ id: 'report', title: 'Datos del reporte', icon: 'document-text-outline' as const }]
      : []),
    ...(definition.header?.length
      ? [{ id: 'header', title: 'Encabezado', icon: 'reader-outline' as const }]
      : []),
    ...definition.sections.map((section, index) => ({
      id: section.id,
      title: section.title,
      number: index + 1,
    })),
    ...(definition.items
      ? [{ id: 'items', title: definition.items.title, icon: 'layers-outline' as const }]
      : []),
    { id: 'comments', title: definition.commentsLabel, icon: 'chatbox-outline' as const },
  ];
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
  const { width, height } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const contentRef = useRef<ViewInstance>(null);
  const fieldViews = useRef(new Map<string, ViewInstance>());
  const sectionOffsets = useRef(new Map<string, number>());
  const targets = useMemo(() => navTargets(definition), [definition]);
  const [active, setActive] = useState(targets[0]?.id ?? '');
  const [missing, setMissing] = useState<number | null>(null);
  const landscape = width > height;
  const hasChecks = useMemo(() => fieldNumbers(definition).size > 0, [definition]);

  const registerField = useCallback(
    (id: string) => (view: ViewInstance | null) => {
      if (view) fieldViews.current.set(id, view);
      else fieldViews.current.delete(id);
    },
    [],
  );

  const onSectionLayout = useCallback((id: string, y: number) => {
    sectionOffsets.current.set(id, y);
  }, []);

  useEffect(() => {
    if (!onValuesChange) return;
    onValuesChange(visibleValues(definition, getValues()));
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => onValuesChange(visibleValues(definition, values)),
    });
  }, [definition, getValues, onValuesChange, subscribe]);

  function scrollToY(y: number) {
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }

  function selectTarget(id: string) {
    const y = sectionOffsets.current.get(id);
    if (y === undefined) return;
    setActive(id);
    scrollToY(y);
  }

  function trackActive(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const top = event.nativeEvent.contentOffset.y + 120;
    let current = targets[0]?.id ?? '';
    for (const target of targets) {
      const y = sectionOffsets.current.get(target.id);
      if (y !== undefined && y <= top) current = target.id;
    }
    if (current !== active) setActive(current);
  }

  function review() {
    const ids = missingRequired(definition, getValues());
    clearErrors();
    for (const id of ids) setError(id, { type: 'required', message: requiredMessage });
    setMissing(ids.length);
    const first = ids[0] ? fieldViews.current.get(ids[0]) : undefined;
    const content = contentRef.current;
    if (first && content) first.measureLayout(content, (_x, y) => scrollToY(y));
  }

  const scroll = (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      onScroll={trackActive}
      scrollEventThrottle={100}
    >
      <View ref={contentRef} collapsable={false} className="gap-6 p-6 pb-10">
        {header}
        <Intro instructions={definition.instructions} showLegend={hasChecks} />
        <FormBody definition={definition} onSectionLayout={onSectionLayout} />
        {footer}
      </View>
    </ScrollView>
  );

  return (
    <FormProvider {...form}>
      <LayoutProvider definition={definition} registerField={registerField}>
        <ProgressProvider definition={definition}>
          <View className="flex-1 bg-canvas">
            {landscape ? (
              <View className="flex-1 flex-row">
                <SectionNav
                  targets={targets}
                  active={active}
                  onSelect={selectTarget}
                  layout="side"
                />
                {scroll}
              </View>
            ) : (
              <>
                <SectionNav
                  targets={targets}
                  active={active}
                  onSelect={selectTarget}
                  layout="top"
                />
                {scroll}
              </>
            )}
            {keyboardVisible ? null : <BottomBar missing={missing} onReview={review} />}
          </View>
        </ProgressProvider>
      </LayoutProvider>
    </FormProvider>
  );
}
