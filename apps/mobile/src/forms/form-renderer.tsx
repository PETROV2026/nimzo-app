import {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { Icon, type IconName } from '@/components/icon';
import {
  FormLayoutContext,
  FormProgressContext,
  FormScopeContext,
  requiredMessage,
} from '@/forms/form-context';
import { ItemsNode, ServiceTypePicker } from '@/forms/form-items';
import {
  BottomBar,
  itemsTitle,
  type LeadTarget,
  leadSectionId,
  ProgressPill,
  SectionNav,
} from '@/forms/form-navigation';
import {
  conditionFields,
  customSectionsKey,
  fieldNumbers,
  type FormValues,
  formProgress,
  formSections,
  hiddenIds,
  missingRequired,
  serviceTypeKey,
  visibleValues,
} from '@/forms/form-values';
import { NoteNode, Nodes, RenderNode } from '@/forms/render-node';
import { useKeyboardVisible } from '@/lib/use-keyboard-visible';
import { colors } from '@/theme';

type FormRendererProps = {
  definition: FormDefinition;
  defaultValues?: FormValues;
  onValuesChange?: (values: FormValues) => void;
  header?: ReactNode;
  footer?: ReactNode;
  lead?: LeadSection;
};

export type LeadSection = LeadTarget & {
  complete: boolean;
  action?: ReactNode;
  children: ReactNode;
};

type OnSectionLayout = (id: string, owner: string, y: number | undefined) => void;

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
  icon?: IconName;
  aside?: ReactNode;
  note?: string;
  onSectionLayout: OnSectionLayout;
  children: ReactNode;
};

function SectionCard({
  id,
  title,
  number,
  icon,
  aside,
  note,
  onSectionLayout,
  children,
}: SectionCardProps) {
  const owner = useId();
  useEffect(() => () => onSectionLayout(id, owner, undefined), [id, owner, onSectionLayout]);
  return (
    <View
      onLayout={(event: LayoutChangeEvent) =>
        onSectionLayout(id, owner, event.nativeEvent.layout.y)
      }
      className="overflow-hidden rounded-2xl border border-border bg-background"
    >
      <View className="flex-row items-center gap-4 border-b border-border px-6 py-5">
        {number ? (
          <View className="size-10 items-center justify-center rounded-full bg-foreground">
            <Text className="font-sans-bold text-lg text-background">{number}</Text>
          </View>
        ) : icon ? (
          <View className="size-10 items-center justify-center rounded-full bg-foreground">
            <Icon name={icon} size={20} color={colors.background} />
          </View>
        ) : null}
        <View className="flex-1 gap-1">
          <Text accessibilityRole="header" className="font-sans-bold text-xl text-foreground">
            {title}
          </Text>
          {note ? <Text className="font-sans text-base text-muted">{note}</Text> : null}
        </View>
        {aside ?? <ProgressPill id={id} />}
      </View>
      <View className="gap-5 p-6">{children}</View>
    </View>
  );
}

function EnabledSections({
  definition,
  onSectionLayout,
}: {
  definition: FormDefinition;
  onSectionLayout: OnSectionLayout;
}) {
  const [type, custom] = useWatch<FormValues>({
    name: [serviceTypeKey, customSectionsKey],
  }) as unknown[];
  const sections = formSections(definition, {
    [serviceTypeKey]: type,
    [customSectionsKey]: custom,
  });

  if (definition.serviceType && !definition.items && sections.length === 0) {
    return (
      <NoteNode
        tone="info"
        text="Elige el tipo de servicio para ver las secciones que debes llenar."
      />
    );
  }

  return sections.map((section) => (
    <SectionCard
      key={section.id}
      id={section.id}
      number={definition.sections.indexOf(section) + 1}
      title={section.title}
      note={section.note}
      onSectionLayout={onSectionLayout}
    >
      <Nodes nodes={section.children} />
    </SectionCard>
  ));
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

  return (
    <>
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
      {definition.serviceType ? (
        <SectionCard
          id="service_type"
          title={definition.serviceType.label}
          onSectionLayout={onSectionLayout}
        >
          <ServiceTypePicker
            serviceType={definition.serviceType}
            sections={definition.items?.sections ?? definition.sections}
          />
        </SectionCard>
      ) : null}
      <EnabledSections definition={definition} onSectionLayout={onSectionLayout} />
      {definition.items ? (
        <SectionCard id="items" title={itemsTitle(definition)} onSectionLayout={onSectionLayout}>
          <ItemsNode definition={definition} />
        </SectionCard>
      ) : null}
      <SectionCard id="comments" title={definition.commentsLabel} onSectionLayout={onSectionLayout}>
        <RenderNode node={comments} />
      </SectionCard>
    </>
  );
});

function RootScope({ definition, children }: { definition: FormDefinition; children: ReactNode }) {
  const fields = useMemo(
    () => [...conditionFields(definition), serviceTypeKey, customSectionsKey],
    [definition],
  );
  const watched: readonly unknown[] = useWatch<FormValues>({ name: fields });
  const scope = useMemo(() => {
    const values = Object.fromEntries(fields.map((field, index) => [field, watched[index]]));
    return { prefix: '', hidden: hiddenIds(definition, values) };
  }, [definition, fields, watched]);
  return <FormScopeContext.Provider value={scope}>{children}</FormScopeContext.Provider>;
}

function ProgressProvider({
  definition,
  leadComplete,
  children,
}: {
  definition: FormDefinition;
  leadComplete?: boolean;
  children: ReactNode;
}) {
  const values = useWatch<FormValues>();
  const progress = useMemo(() => {
    const base = formProgress(definition, values);
    if (leadComplete === undefined) return base;
    const done = leadComplete ? 1 : 0;
    return {
      ...base,
      lead: { answered: done, total: 1 },
      answered: base.answered + done,
      total: base.total + 1,
    };
  }, [definition, leadComplete, values]);
  return <FormProgressContext.Provider value={progress}>{children}</FormProgressContext.Provider>;
}

export function FormRenderer({
  definition,
  defaultValues,
  onValuesChange,
  header,
  footer,
  lead,
}: FormRendererProps) {
  const form = useForm<FormValues>({ defaultValues: defaultValues ?? {} });
  const { subscribe, getValues, setError, clearErrors } = form;
  const { width, height } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const contentRef = useRef<ViewInstance>(null);
  const fieldViews = useRef(new Map<string, ViewInstance>());
  const sectionOffsets = useRef(new Map<string, { owner: string; y: number }>());
  const [active, setActive] = useState(lead ? leadSectionId : 'report');
  const [missing, setMissing] = useState<number | null>(null);
  const landscape = width > height;
  const numbers = useMemo(() => fieldNumbers(definition), [definition]);

  const registerField = useCallback(
    (id: string) => (view: ViewInstance | null) => {
      if (view) fieldViews.current.set(id, view);
      else fieldViews.current.delete(id);
    },
    [],
  );

  const layout = useMemo(() => ({ numbers, registerField }), [numbers, registerField]);

  const onSectionLayout = useCallback<OnSectionLayout>((id, owner, y) => {
    const offsets = sectionOffsets.current;
    if (y !== undefined) offsets.set(id, { owner, y });
    else if (offsets.get(id)?.owner === owner) offsets.delete(id);
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
    const y = sectionOffsets.current.get(id)?.y;
    if (y === undefined) return;
    setActive(id);
    scrollToY(y);
  }

  function trackActive(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const top = event.nativeEvent.contentOffset.y + 120;
    let current = active;
    let best = -Infinity;
    for (const [id, { y }] of sectionOffsets.current) {
      if (y <= top && y > best) {
        best = y;
        current = id;
      }
    }
    if (current !== active) setActive(current);
  }

  function review() {
    const ids = missingRequired(definition, getValues());
    clearErrors();
    for (const id of ids) setError(id, { type: 'required', message: requiredMessage });
    const leadMissing = Boolean(lead && !lead.complete);
    setMissing(ids.length + (leadMissing ? 1 : 0));
    const leadY = sectionOffsets.current.get(leadSectionId)?.y;
    if (leadMissing && leadY !== undefined) {
      scrollToY(leadY);
      return;
    }
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
        {lead ? (
          <SectionCard
            id={leadSectionId}
            title={lead.title}
            icon={lead.icon}
            aside={lead.action}
            onSectionLayout={onSectionLayout}
          >
            {lead.children}
          </SectionCard>
        ) : null}
        <Intro instructions={definition.instructions} showLegend={numbers.size > 0} />
        <FormBody definition={definition} onSectionLayout={onSectionLayout} />
        {footer}
      </View>
    </ScrollView>
  );

  return (
    <FormProvider {...form}>
      <FormLayoutContext.Provider value={layout}>
        <RootScope definition={definition}>
          <ProgressProvider definition={definition} leadComplete={lead?.complete}>
            <View className="flex-1 bg-canvas">
              <View className={landscape ? 'flex-1 flex-row' : 'flex-1'}>
                <SectionNav
                  definition={definition}
                  lead={lead ? { title: lead.title, icon: lead.icon } : undefined}
                  active={active}
                  onSelect={selectTarget}
                  layout={landscape ? 'side' : 'top'}
                />
                {scroll}
              </View>
              {keyboardVisible ? null : <BottomBar missing={missing} onReview={review} />}
            </View>
          </ProgressProvider>
        </RootScope>
      </FormLayoutContext.Provider>
    </FormProvider>
  );
}
