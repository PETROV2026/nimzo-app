import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import type { LocalBranch } from '@/clients/branches-db';
import { branchPlace } from '@/clients/use-clients';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type ClientBranchesProps = {
  clientName: string;
  branches: LocalBranch[];
  canAdd: boolean;
  onAdd: () => void;
  onEdit: (branch: LocalBranch) => void;
};

function BranchCard({ branch, onPress }: { branch: LocalBranch; onPress: () => void }) {
  const place = branchPlace(branch);
  const phone = branch.contact_phone?.replace(/[^\d+]/g, '');
  const contact = [branch.contact_name, branch.contact_phone].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${branch.name}${place ? `, ${place}` : ''}${branch.isActive ? '' : ', inactiva'}`}
      accessibilityHint="Abre la sucursal para editarla"
      className="min-w-[300px] flex-1 basis-[300px] gap-3 rounded-2xl border-2 border-border bg-background p-4 active:border-border-strong"
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`h-12 w-12 items-center justify-center rounded-xl ${branch.isActive ? 'bg-primary/15' : 'bg-border'}`}
        >
          <Icon
            name="location"
            size={24}
            color={branch.isActive ? colors['primary-strong'] : colors.muted}
          />
        </View>
        <View className="flex-1 gap-0.5">
          <Text
            numberOfLines={2}
            className={`font-sans-semibold text-lg ${branch.isActive ? 'text-foreground' : 'text-muted'}`}
          >
            {branch.name}
          </Text>
          <Text numberOfLines={1} className="font-sans text-base text-muted">
            {place || 'Sin ciudad registrada'}
          </Text>
        </View>
        <Icon name="create-outline" size={22} color={colors['border-strong']} />
      </View>

      {branch.address ? (
        <Text numberOfLines={2} className="font-sans text-base text-foreground">
          {branch.address}
        </Text>
      ) : null}

      {contact || !branch.isActive || !branch.syncedAt ? (
        <View className="flex-row flex-wrap items-center gap-2 border-t border-border pt-3">
          {contact ? (
            <View className="min-w-0 flex-1 flex-row items-center gap-2">
              <Icon name="person-outline" size={18} color={colors.muted} />
              <Text numberOfLines={1} className="flex-1 font-sans text-base text-muted">
                {contact}
              </Text>
            </View>
          ) : (
            <View className="flex-1" />
          )}
          {!branch.isActive ? (
            <View className="rounded-full bg-border px-3 py-1">
              <Text className="font-sans-semibold text-sm text-muted">Inactiva</Text>
            </View>
          ) : null}
          {!branch.syncedAt ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-accent/30 px-3 py-1">
              <Icon name="cloud-upload-outline" size={16} color={colors.foreground} />
              <Text className="font-sans-semibold text-sm text-foreground">Por subir</Text>
            </View>
          ) : null}
          {phone && branch.isActive ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${phone}`)}
              accessibilityRole="link"
              accessibilityLabel={`Llamar a ${branch.name}`}
              className="min-h-14 min-w-14 flex-row items-center justify-center gap-1.5 rounded-lg px-3 active:bg-primary/10"
            >
              <Icon name="call-outline" size={20} color={colors['primary-strong']} />
              <Text className="font-sans-semibold text-base text-primary-strong">Llamar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export function ClientBranches({
  clientName,
  branches,
  canAdd,
  onAdd,
  onEdit,
}: ClientBranchesProps) {
  const [showInactive, setShowInactive] = useState(false);
  const active = branches.filter((branch) => branch.isActive);
  const inactive = branches.filter((branch) => !branch.isActive);

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-row items-center gap-3">
          <Text accessibilityRole="header" className="font-sans-bold text-xl text-foreground">
            Sucursales
          </Text>
          {active.length > 0 ? (
            <View className="min-w-8 items-center rounded-full bg-primary/15 px-2.5 py-0.5">
              <Text className="font-sans-bold text-base text-primary-strong">{active.length}</Text>
            </View>
          ) : null}
        </View>
        {canAdd && branches.length > 0 ? (
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            className="min-h-14 flex-row items-center gap-2 rounded-lg px-4 active:bg-primary/10"
          >
            <Icon name="add-circle-outline" size={24} color={colors['primary-strong']} />
            <Text className="font-sans-semibold text-lg text-primary-strong">Agregar sucursal</Text>
          </Pressable>
        ) : null}
      </View>

      {branches.length === 0 ? (
        <View className="items-center gap-4 rounded-2xl border-2 border-dashed border-border-strong px-6 py-8">
          <Icon name="business-outline" size={44} color={colors['border-strong']} />
          <View className="max-w-md items-center gap-1">
            <Text className="text-center font-sans-semibold text-lg text-foreground">
              {clientName} aún no tiene sucursales
            </Text>
            <Text className="text-center font-sans text-base text-muted">
              Agrega cada planta, tienda u oficina donde le das servicio. Ahí registrarás sus
              sistemas y los reportes.
            </Text>
          </View>
          {canAdd ? (
            <View className="min-w-[260px]">
              <Button label="Agregar sucursal" icon="add" onPress={onAdd} />
            </View>
          ) : null}
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {active.map((branch) => (
            <BranchCard key={branch.id} branch={branch} onPress={() => onEdit(branch)} />
          ))}
          {active.length === 0 ? (
            <Text className="w-full font-sans text-base text-muted">
              Todas las sucursales de este cliente están inactivas.
            </Text>
          ) : null}
        </View>
      )}

      {inactive.length > 0 ? (
        <View className="gap-3">
          <Pressable
            onPress={() => setShowInactive(!showInactive)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showInactive }}
            className="min-h-14 flex-row items-center gap-2 self-start rounded-lg px-2 active:bg-border"
          >
            <Icon
              name={showInactive ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={colors.muted}
            />
            <Text className="font-sans-semibold text-base text-muted">
              {showInactive
                ? 'Ocultar sucursales inactivas'
                : `Ver ${inactive.length === 1 ? '1 sucursal inactiva' : `${inactive.length} sucursales inactivas`}`}
            </Text>
          </Pressable>
          {showInactive ? (
            <View className="flex-row flex-wrap gap-3">
              {inactive.map((branch) => (
                <BranchCard key={branch.id} branch={branch} onPress={() => onEdit(branch)} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
