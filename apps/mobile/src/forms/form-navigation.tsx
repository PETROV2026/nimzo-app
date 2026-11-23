import type { FormDefinition } from '@nimzo/shared';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { useFormProgress } from '@/forms/form-context';
import type { Progress } from '@/forms/form-values';
import { colors } from '@/theme';

export type NavTarget = { id: string; title: string; number?: number; icon?: IconName };

export function useTargetProgress(id: string): Progress | undefined {
  const progress = useFormProgress();
  if (id === leadSectionId) return progress.lead;
  if (id === 'report') return progress.report;
  if (id === 'service_type') return progress.serviceType;
  if (id === 'items') return progress.items;
  return progress.sections.find((section) => section.id === id);
}

export const leadSectionId = 'service';

export type LeadTarget = { title: string; icon: IconName };

export function useNavTargets(definition: FormDefinition, lead?: LeadTarget): NavTarget[] {
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
  if (id === leadSectionId) {
    return (
      <Text className="font-sans text-sm text-muted">
        {progress.answered === progress.total ? 'Listo' : 'Por elegir'}
      </Text>
    );
  }
  return <Text className="font-sans text-sm text-muted">{answersLabel(progress)}</Text>;
}

type SectionNavProps = {
  definition: FormDefinition;
  lead?: LeadTarget;
  active: string;
  onSelect: (id: string) => void;
  layout: 'side' | 'top';
};

export function SectionNav({ definition, lead, active, onSelect, layout }: SectionNavProps) {
  const targets = useNavTargets(definition, lead);
  if (layout === 'top') {
    return (
      <View className="border-b border-border bg-background">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-4 py-2"
        >
          {targets.map((target) => {
            const selected = target.id === active;
            return (
              <Pressable
                key={target.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(target.id)}
                className={`min-h-14 max-w-72 flex-row items-center gap-2 rounded-full pl-2 pr-4 ${selected ? 'bg-primary/10' : 'active:bg-surface'}`}
              >
                <Badge target={target} active={selected} />
                <Text
                  numberOfLines={1}
                  className={`shrink font-sans-medium text-base ${selected ? 'text-foreground' : 'text-muted'}`}
                >
                  {target.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="w-80 border-r border-border bg-background">
      <ScrollView contentContainerClassName="gap-1 p-3">
        <Text className="px-3 pb-2 pt-3 font-sans-semibold text-sm text-muted">Secciones</Text>
        {targets.map((target) => {
          const selected = target.id === active;
          return (
            <Pressable
              key={target.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(target.id)}
              className={`min-h-16 flex-row items-center gap-3 rounded-lg px-3 py-2 ${selected ? 'bg-primary/10' : 'active:bg-surface'}`}
            >
              <Badge target={target} active={selected} />
              <View className="flex-1 gap-0.5">
                <Text
                  numberOfLines={2}
                  className={`text-base ${selected ? 'font-sans-semibold text-foreground' : 'font-sans-medium text-foreground'}`}
                >
                  {target.title}
                </Text>
                <NavCount id={target.id} />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type BottomBarProps = { missing: number | null; onReview: () => void };

export function BottomBar({ missing, onReview }: BottomBarProps) {
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
      <Button label="Revisar" icon="checkmark-done-outline" onPress={onReview} />
    </View>
  );
}
