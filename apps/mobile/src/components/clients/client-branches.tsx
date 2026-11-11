import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { LocalBranch } from '@/clients/branches-db';
import { branchPlace } from '@/clients/use-clients';
import { Icon } from '@/components/icon';
import { TextAction } from '@/components/text-action';
import { colors } from '@/theme';

type ClientBranchesProps = {
  branches: LocalBranch[];
  canAdd: boolean;
  onAdd: () => void;
  onEdit: (branch: LocalBranch) => void;
};

function statusText(branch: LocalBranch) {
  if (!branch.isActive) return 'Inactiva';
  if (!branch.syncedAt) return 'Pendiente de sincronizar';
  return null;
}

function BranchRow({
  branch,
  wide,
  last,
  onPress,
}: {
  branch: LocalBranch;
  wide: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const place = branchPlace(branch);
  const contact = [branch.contact_name, branch.contact_phone].filter(Boolean).join(', ');
  const status = statusText(branch);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[branch.name, place, status].filter(Boolean).join(', ')}
      accessibilityHint="Abre la sucursal para editarla"
      className={`min-h-[72px] flex-row items-center gap-4 px-5 py-3 active:bg-surface ${last ? '' : 'border-b border-border'}`}
    >
      <View className={`gap-0.5 ${wide ? 'w-[38%]' : 'flex-1'}`}>
        <Text
          numberOfLines={1}
          className={`font-sans-semibold text-lg ${branch.isActive ? 'text-foreground' : 'text-muted'}`}
        >
          {branch.name}
        </Text>
        <Text numberOfLines={1} className="font-sans text-base text-muted">
          {[place || 'Sin ciudad', status].filter(Boolean).join('. ')}
        </Text>
      </View>
      {wide ? (
        <>
          <Text numberOfLines={2} className="flex-1 font-sans text-base text-foreground">
            {branch.address ?? '—'}
          </Text>
          <Text numberOfLines={2} className="w-[24%] font-sans text-base text-foreground">
            {contact || '—'}
          </Text>
        </>
      ) : null}
      <Icon name="chevron-forward" size={20} color={colors['border-strong']} />
    </Pressable>
  );
}

export function ClientBranches({ branches, canAdd, onAdd, onEdit }: ClientBranchesProps) {
  const [panelWidth, setPanelWidth] = useState(0);
  const wide = panelWidth >= 760;
  const [showInactive, setShowInactive] = useState(false);
  const active = branches.filter((branch) => branch.isActive);
  const inactive = branches.filter((branch) => !branch.isActive);
  const visible = showInactive ? [...active, ...inactive] : active;

  return (
    <View className="gap-3">
      <View className="min-h-14 flex-row items-center justify-between gap-3">
        <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
          Sucursales
        </Text>
        {canAdd ? <TextAction label="Agregar sucursal" icon="add" onPress={onAdd} /> : null}
      </View>

      <View
        onLayout={(event) => setPanelWidth(event.nativeEvent.layout.width)}
        className="overflow-hidden rounded-xl border border-border bg-background"
      >
        {wide && visible.length > 0 ? (
          <View className="flex-row gap-4 border-b border-border bg-surface px-5 py-2.5">
            <Text className="w-[38%] font-sans-medium text-sm text-muted">Sucursal</Text>
            <Text className="flex-1 font-sans-medium text-sm text-muted">Dirección</Text>
            <Text className="w-[24%] font-sans-medium text-sm text-muted">Contacto</Text>
            <View className="w-5" />
          </View>
        ) : null}
        {visible.length === 0 ? (
          <View className="gap-1 px-5 py-5">
            <Text className="font-sans-medium text-lg text-foreground">
              {branches.length === 0
                ? 'Este cliente aún no tiene sucursales.'
                : 'Todas sus sucursales están inactivas.'}
            </Text>
            {branches.length === 0 ? (
              <Text className="font-sans text-base text-muted">
                Registra cada planta, tienda u oficina donde das servicio a este cliente.
              </Text>
            ) : null}
          </View>
        ) : (
          visible.map((branch, index) => (
            <BranchRow
              key={branch.id}
              branch={branch}
              wide={wide}
              last={index === visible.length - 1}
              onPress={() => onEdit(branch)}
            />
          ))
        )}
      </View>

      {inactive.length > 0 ? (
        <TextAction
          label={
            showInactive
              ? 'Ocultar inactivas'
              : `Mostrar ${inactive.length === 1 ? '1 inactiva' : `${inactive.length} inactivas`}`
          }
          expanded={showInactive}
          onPress={() => setShowInactive(!showInactive)}
        />
      ) : null}
    </View>
  );
}
