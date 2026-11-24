import type { FormDefinition } from '@nimzo/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  Text,
  View,
} from 'react-native';
import Animated, {
  cubicBezier,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { useFormProgress } from '@/forms/form-context';
import type { Progress } from '@/forms/form-values';
import { colors } from '@/theme';

export type NavTarget = { id: string; title: string; number?: number; icon?: IconName };

export function useTargetProgress(id: string): Progress | undefined {
  const progress = useFormProgress();
  if (id === leadSectionId) return progress.lead;
  if (id === closingSectionId) return progress.closing;
  if (id === 'report') return progress.report;
  if (id === 'service_type') return progress.serviceType;
  if (id === 'items') return progress.items;
  return progress.sections.find((section) => section.id === id);
}

export const leadSectionId = 'service';

export const closingSectionId = 'signatures';

export type LeadTarget = { title: string; icon: IconName };

export function useNavTargets(
  definition: FormDefinition,
  lead?: LeadTarget,
  closing?: LeadTarget,
): NavTarget[] {
  const progress = useFormProgress();
  return [
    ...(lead ? [{ id: leadSectionId, title: lead.title, icon: lead.icon }] : []),
    ...(definition.report.length > 0
      ? [{ id: 'report', title: 'Datos del reporte', icon: 'document-text-outline' as const }]
      : []),
    ...(definition.header?.length
      ? [{ id: 'header', title: 'Encabezado', icon: 'reader-outline' as const }]
      : []),
    ...(definition.serviceType
      ? [
          {
            id: 'service_type',
            title: definition.serviceType.label,
            icon: 'options-outline' as const,
          },
        ]
      : []),
    ...progress.sections.map((section) => ({
      id: section.id,
      title: section.title,
      number: section.number,
    })),
    ...(definition.items
      ? [{ id: 'items', title: itemsTitle(definition), icon: 'layers-outline' as const }]
      : []),
    { id: 'comments', title: definition.commentsLabel, icon: 'chatbox-outline' as const },
    ...(closing ? [{ id: closingSectionId, title: closing.title, icon: closing.icon }] : []),
  ];
}

export function itemsTitle(definition: FormDefinition) {
  return definition.items?.keyLabel ? 'Llenado por equipo' : (definition.items?.title ?? '');
}

export function answersLabel({ answered, total }: Progress) {
  return `${answered} de ${total} ${total === 1 ? 'respuesta' : 'respuestas'}`;
}

function isComplete(progress?: Progress) {
  return Boolean(progress && progress.total > 0 && progress.answered === progress.total);
}

export function ProgressPill({ id }: { id: string }) {
  const progress = useTargetProgress(id);
  if (!progress || progress.total === 0) return null;
  if (isComplete(progress)) {
    return (
      <View className="flex-row items-center gap-1.5 rounded-full bg-success px-3 py-1">
        <Icon name="checkmark" size={16} color={colors['on-success']} />
        <Text className="font-sans-semibold text-sm text-on-success">Completa</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-surface px-3 py-1">
      <Text className="font-sans-semibold text-sm text-muted">
        {progress.answered} de {progress.total}
      </Text>
    </View>
  );
}

function Badge({ target, active }: { target: NavTarget; active: boolean }) {
  const progress = useTargetProgress(target.id);
  if (isComplete(progress)) {
    return (
      <View className="size-9 items-center justify-center rounded-full bg-success">
        <Icon name="checkmark" size={20} color={colors['on-success']} />
      </View>
    );
  }
  return (
    <View
      className={`size-9 items-center justify-center rounded-full ${active ? 'bg-primary-strong' : 'bg-surface'}`}
    >
      {target.number ? (
        <Text
          className={`font-sans-bold text-base ${active ? 'text-on-primary' : 'text-foreground'}`}
        >
          {target.number}
        </Text>
      ) : (
        <Icon
          name={target.icon ?? 'document-text-outline'}
          size={18}
          color={active ? colors['on-primary'] : colors.foreground}
        />
      )}
    </View>
  );
}

function NavCount({ id }: { id: string }) {
  const progress = useTargetProgress(id);
  if (!progress || progress.total === 0) return null;
  if (id === leadSectionId || id === closingSectionId) {
    const pending = id === leadSectionId ? 'Por elegir' : 'Por firmar';
    return (
      <Text className="font-sans text-sm text-muted">
        {progress.answered === progress.total ? 'Listo' : pending}
      </Text>
    );
  }
  return <Text className="font-sans text-sm text-muted">{answersLabel(progress)}</Text>;
}

type SectionNavProps = {
  definition: FormDefinition;
  lead?: LeadTarget;
  closing?: LeadTarget;
  active: string;
  onSelect: (id: string) => void;
  layout: 'side' | 'top';
};

type Box = { x: number; y: number; width: number; height: number };

const moveEasing = Easing.bezier(0.77, 0, 0.175, 1);
const pressEasing = cubicBezier(0.23, 1, 0.32, 1);

function sameBox(a: Box | undefined, b: Box) {
  return a?.x === b.x && a?.y === b.y && a?.width === b.width && a?.height === b.height;
}

function useBoxes() {
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const measure = useCallback(
    (id: string) => (event: LayoutChangeEvent) => {
      const box = event.nativeEvent.layout;
      setBoxes((current) => (sameBox(current[id], box) ? current : { ...current, [id]: box }));
    },
    [],
  );
  return { boxes, measure };
}

function Indicator({ box, className }: { box?: Box; className: string }) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!box) return;
    if (opacity.get() === 0 || reduced) {
      x.set(box.x);
      y.set(box.y);
      width.set(box.width);
      height.set(box.height);
      opacity.set(withTiming(1, { duration: reduced ? 0 : 150 }));
      return;
    }
    const config = { duration: 280, easing: moveEasing };
    x.set(withTiming(box.x, config));
    y.set(withTiming(box.y, config));
    width.set(withTiming(box.width, config));
    height.set(withTiming(box.height, config));
  }, [box, height, opacity, reduced, width, x, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    width: width.get(),
    height: height.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }],
  }));

  return <Animated.View pointerEvents="none" className={className} style={style} />;
}

function NavItem({
  target,
  selected,
  layout,
  onPress,
  onLayout,
}: {
  target: NavTarget;
  selected: boolean;
  layout: 'side' | 'top';
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const side = layout === 'side';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
      onLayout={onLayout}
    >
      <Animated.View
        style={{
          transform: [{ scale: pressed ? 0.97 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: '120ms',
          transitionTimingFunction: pressEasing,
        }}
        className={
          side
            ? `min-h-16 flex-row items-center gap-3 rounded-lg px-3 py-2 ${pressed && !selected ? 'bg-surface' : ''}`
            : `min-h-14 max-w-72 flex-row items-center gap-2 rounded-full pl-2 pr-4 ${pressed && !selected ? 'bg-surface' : ''}`
        }
      >
        <Badge target={target} active={selected} />
        {side ? (
          <View className="flex-1 gap-0.5">
            <Text
              numberOfLines={2}
              className={`text-base text-foreground ${selected ? 'font-sans-semibold' : 'font-sans-medium'}`}
            >
              {target.title}
            </Text>
            <NavCount id={target.id} />
          </View>
        ) : (
          <Text
            numberOfLines={1}
            className={`shrink text-base ${selected ? 'font-sans-semibold text-foreground' : 'font-sans-medium text-muted'}`}
          >
            {target.title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function SectionNav({
  definition,
  lead,
  closing,
  active,
  onSelect,
  layout,
}: SectionNavProps) {
  const targets = useNavTargets(definition, lead, closing);
  const { boxes, measure } = useBoxes();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [viewport, setViewport] = useState(0);
  const activeBox = boxes[active];
  const top = layout === 'top';

  useEffect(() => {
    if (!activeBox || viewport === 0) return;
    if (top) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, activeBox.x - (viewport - activeBox.width) / 2),
        animated: true,
      });
    } else {
      scrollRef.current?.scrollTo({
        y: Math.max(0, activeBox.y - (viewport - activeBox.height) / 2),
        animated: true,
      });
    }
  }, [activeBox, top, viewport]);

  const items = (
    <View>
      <Indicator
        box={activeBox}
        className={`absolute left-0 top-0 bg-primary/10 ${top ? 'rounded-full' : 'rounded-lg'}`}
      />
      <View className={top ? 'flex-row gap-2' : 'gap-1'}>
        {targets.map((target) => (
          <NavItem
            key={target.id}
            target={target}
            selected={target.id === active}
            layout={layout}
            onPress={() => onSelect(target.id)}
            onLayout={measure(target.id)}
          />
        ))}
      </View>
    </View>
  );

  if (top) {
    return (
      <View
        className="border-b border-border bg-background"
        onLayout={(event) => setViewport(event.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 py-2"
        >
          {items}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      className="w-80 border-r border-border bg-background"
      onLayout={(event) => setViewport(event.nativeEvent.layout.height)}
    >
      <ScrollView ref={scrollRef} contentContainerClassName="gap-1 p-3">
        <Text className="px-3 pb-2 pt-3 font-sans-semibold text-sm text-muted">Secciones</Text>
        {items}
      </ScrollView>
    </View>
  );
}

type BottomBarProps = { missing: number | null; onReview: () => void; onFinish?: () => void };

export function BottomBar({ missing, onReview, onFinish }: BottomBarProps) {
  const { answered, total } = useFormProgress();
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
  const message =
    missing === null
      ? null
      : missing === 0
        ? 'No falta ningún campo obligatorio.'
        : missing === 1
          ? 'Falta 1 campo obligatorio, marcado en rojo.'
          : `Faltan ${missing} campos obligatorios, marcados en rojo.`;

  return (
    <View className="flex-row items-center gap-6 border-t border-border bg-background px-6 py-3">
      <View className="flex-1 gap-2">
        <View className="flex-row items-baseline gap-2">
          <Text className="font-sans-bold text-lg text-foreground">{percent}%</Text>
          <Text className="font-sans text-base text-muted">
            {answersLabel({ answered, total })}
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-border">
          <View className="h-2 rounded-full bg-primary-strong" style={{ width: `${percent}%` }} />
        </View>
        {message ? (
          <Text
            accessibilityLiveRegion="polite"
            className={`font-sans-medium text-sm ${missing ? 'text-danger-strong' : 'text-foreground'}`}
          >
            {message}
          </Text>
        ) : null}
      </View>
      {onFinish ? (
        <Button label="Enviar" icon="send-outline" onPress={onFinish} />
      ) : (
        <Button label="Revisar" icon="checkmark-done-outline" onPress={onReview} />
      )}
    </View>
  );
}
