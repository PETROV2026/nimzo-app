import { systemTypeLabels } from '@nimzo/shared';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { LocalBranch } from '@/clients/branches-db';
import type { LocalSystem } from '@/clients/systems-db';
import { branchPlace } from '@/clients/use-clients';
import { Icon, type IconName } from '@/components/icon';
import { InactiveBadge } from '@/components/inactive-badge';
import { TextAction } from '@/components/text-action';
import { colors } from '@/theme';

type BranchTab = 'pending' | 'sent' | 'systems';

type BranchDetailProps = {
  branch: LocalBranch;
  clientName: string;
  backLabel: string;
  systems: LocalSystem[];
  onBack: () => void;
  onEdit: () => void;
  onAddSystem: () => void;
  onEditSystem: (system: LocalSystem) => void;
};

function TabEmpty({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View className="items-center gap-3 px-6 py-12">
      <Icon name={icon} size={48} color={colors['border-strong']} />
      <View className="max-w-md items-center gap-1">
        <Text className="text-center font-sans-semibold text-lg text-foreground">{title}</Text>
        <Text className="text-center font-sans text-base text-muted">{description}</Text>
      </View>
    </View>
  );
}

function systemStatus(system: LocalSystem) {
  return system.isActive && !system.syncedAt ? 'Pendiente de sincronizar' : null;
}

function SystemRow({ system, onPress }: { system: LocalSystem; onPress: () => void }) {
  const detail = [systemTypeLabels[system.system_type], system.location, systemStatus(system)]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${system.name}${system.isActive ? '' : ', inactivo'}, ${detail}`}
      accessibilityHint="Abre el sistema para editarlo"
      className={`min-h-[72px] flex-row items-center gap-4 border-t border-border px-6 py-3 ${system.isActive ? 'active:bg-surface' : 'bg-surface active:bg-border'}`}
    >
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-3">
          <Text
            numberOfLines={1}
            className={`shrink font-sans-semibold text-lg ${system.isActive ? 'text-foreground' : 'text-muted'}`}
          >
            {system.name}
          </Text>
          {system.isActive ? null : <InactiveBadge />}
        </View>
        <Text
          numberOfLines={1}
          className={`font-sans text-base ${system.isActive ? 'text-muted' : 'text-placeholder'}`}
        >
          {detail}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors['border-strong']} />
    </Pressable>
  );
}

function BranchSystems({
  systems,
  canAdd,
  onAdd,
  onEdit,
}: {
  systems: LocalSystem[];
  canAdd: boolean;
  onAdd: () => void;
  onEdit: (system: LocalSystem) => void;
}) {
  const [showInactive, setShowInactive] = useState(false);
  const active = systems.filter((system) => system.isActive);
  const inactive = systems.filter((system) => !system.isActive);
  const visible = showInactive ? [...active, ...inactive] : active;

  return (
    <View>
      <View className="min-h-[72px] flex-row items-center justify-between gap-4 py-2 pl-6 pr-3">
        <Text className="flex-1 font-sans text-base text-muted">
          Los equipos que revisas en esta sucursal. Cada reporte se vincula a uno de ellos.
        </Text>
        {canAdd ? <TextAction label="Agregar sistema" icon="add" onPress={onAdd} /> : null}
      </View>
      {visible.length === 0 ? (
        <View className="border-t border-border">
          <TabEmpty
            icon="construct-outline"
            title={
              systems.length === 0
                ? 'Esta sucursal aún no tiene sistemas.'
                : 'Todos sus sistemas están inactivos.'
            }
            description="Registra cada sistema que revisas aquí, como la bomba principal o la red de rociadores."
          />
        </View>
      ) : (
        visible.map((system) => (
          <SystemRow key={system.id} system={system} onPress={() => onEdit(system)} />
        ))
      )}
      {inactive.length > 0 ? (
        <View className="border-t border-border px-3 py-1">
          <TextAction
            label={
              showInactive
                ? 'Ocultar inactivos'
                : `Mostrar ${inactive.length === 1 ? '1 inactivo' : `${inactive.length} inactivos`}`
            }
            expanded={showInactive}
            onPress={() => setShowInactive(!showInactive)}
          />
        </View>
      ) : null}
    </View>
  );
}

export function BranchDetail({
  branch,
  clientName,
  backLabel,
  systems,
  onBack,
  onEdit,
  onAddSystem,
  onEditSystem,
}: BranchDetailProps) {
  const [tab, setTab] = useState<BranchTab>('sent');
  const activeSystems = systems.filter((system) => system.isActive).length;
  const location = [branch.address, branchPlace(branch)].filter(Boolean).join(', ');
  const status = [branch.syncedAt ? null : 'Pendiente de sincronizar'].filter(Boolean);
  const tabs: { key: BranchTab; label: string; icon: IconName; count?: number }[] = [
    { key: 'sent', label: 'Enviados', icon: 'paper-plane-outline' },
    { key: 'pending', label: 'Pendientes', icon: 'time-outline' },
    { key: 'systems', label: 'Sistemas', icon: 'construct-outline', count: activeSystems },
  ];

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="gap-6 p-6 pb-10">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={`Volver a ${backLabel}`}
        className="-mb-2 -ml-2 min-h-14 flex-row items-center gap-2 self-start rounded-lg px-2 active:bg-border"
      >
        <Icon name="arrow-back" size={24} color={colors.foreground} />
        <Text numberOfLines={1} className="font-sans-medium text-lg text-foreground">
          {backLabel}
        </Text>
      </Pressable>

      <View className="flex-row flex-wrap items-start justify-between gap-4">
        <View className="min-w-[260px] flex-1 gap-1">
          <Text className="font-sans-medium text-lg text-muted">{clientName}</Text>
          <Text
            accessibilityRole="header"
            selectable
            className={`font-sans-bold text-3xl ${branch.isActive ? 'text-foreground' : 'text-muted'}`}
          >
            {branch.name}
          </Text>
          <Text selectable className="font-sans text-lg text-muted">
            {[location || 'Sin dirección', ...status].join('. ')}
          </Text>
          {branch.isActive ? null : (
            <View className="pt-1">
              <InactiveBadge label="Inactiva" />
            </View>
          )}
        </View>
        <TextAction
          label="Editar sucursal"
          icon="create-outline"
          accessibilityLabel={`Editar los datos de ${branch.name}`}
          onPress={onEdit}
        />
      </View>

      {branch.isActive ? null : (
        <Text className="-mt-2 font-sans text-base text-foreground">
          Esta sucursal está inactiva. Su información y sus reportes se conservan.
        </Text>
      )}

      <View className="overflow-hidden rounded-2xl border border-border bg-background">
        <View accessibilityRole="tablist" className="flex-row border-b border-border">
          {tabs.map((item) => {
            const selected = item.key === tab;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                accessibilityRole="tab"
                accessibilityLabel={item.count ? `${item.label}, ${item.count}` : item.label}
                accessibilityState={{ selected }}
                className="min-h-16 flex-1 items-center justify-center active:bg-surface"
              >
                <View className="flex-row items-center gap-2.5 px-3">
                  <Icon
                    name={item.icon}
                    size={22}
                    color={selected ? colors.foreground : colors.muted}
                  />
                  <Text
                    className={`text-lg ${selected ? 'font-sans-semibold text-foreground' : 'font-sans-medium text-muted'}`}
                  >
                    {item.label}
                  </Text>
                  {item.count ? (
                    <Text className="font-sans-medium text-base text-muted">{item.count}</Text>
                  ) : null}
                </View>
                {selected ? (
                  <View className="absolute bottom-0 left-6 right-6 h-1 rounded-t-full bg-danger" />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {tab === 'sent' ? (
          <TabEmpty
            icon="paper-plane-outline"
            title="Aún no has enviado reportes de esta sucursal."
            description="Cuando envíes uno, aparecerá aquí con su folio y la fecha de envío."
          />
        ) : null}
        {tab === 'pending' ? (
          <TabEmpty
            icon="time-outline"
            title="No hay reportes pendientes en esta sucursal."
            description="Aquí aparecerán los reportes que estás llenando y los que falta firmar o enviar."
          />
        ) : null}
        {tab === 'systems' ? (
          <BranchSystems
            systems={systems}
            canAdd={branch.isActive}
            onAdd={onAddSystem}
            onEdit={onEditSystem}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
