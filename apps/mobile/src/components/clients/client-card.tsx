import { Pressable, Text, View } from 'react-native';
import type { LocalBranch } from '@/clients/branches-db';
import type { LocalClient } from '@/clients/clients-db';
import { branchPlace } from '@/clients/use-clients';
import { HighlightedText } from '@/components/highlighted-text';
import { Icon } from '@/components/icon';
import { TextAction } from '@/components/text-action';
import { colors } from '@/theme';

type ClientCardProps = {
  client: LocalClient;
  branches: LocalBranch[];
  search: string;
  width: number;
  onOpenClient: () => void;
  onOpenBranch: (branch: LocalBranch) => void;
  onAddBranch: () => void;
};

export function ClientCard({
  client,
  branches,
  search,
  width,
  onOpenClient,
  onOpenBranch,
  onAddBranch,
}: ClientCardProps) {
  const active = branches.filter((branch) => branch.isActive);
  const pending = !client.syncedAt || branches.some((branch) => !branch.syncedAt);

  return (
    <View
      style={{ width, elevation: 2 }}
      className="overflow-hidden rounded-2xl bg-background px-5 pb-3 pt-2"
    >
      <Pressable
        onPress={onOpenClient}
        accessibilityRole="button"
        accessibilityLabel={`${client.name}${client.isActive ? '' : ', inactivo'}${pending ? ', pendiente de sincronizar' : ''}`}
        accessibilityHint="Abre los datos del cliente"
        className="-mx-2 min-h-14 flex-row items-center gap-2 rounded-lg px-2 active:bg-surface"
      >
        <HighlightedText
          text={client.name.toUpperCase()}
          term={search}
          numberOfLines={1}
          className={`flex-1 font-sans-semibold text-base ${client.isActive ? 'text-primary-strong' : 'text-muted'}`}
        />
        {pending ? <Icon name="cloud-upload-outline" size={18} color={colors.muted} /> : null}
        {client.isActive ? null : (
          <Text className="font-sans-medium text-sm text-muted">Inactivo</Text>
        )}
        <Icon name="information-circle-outline" size={20} color={colors['border-strong']} />
      </Pressable>

      {active.length === 0 ? (
        <View className="items-start gap-1 border-t border-border pt-3">
          <Text className="font-sans text-base text-muted">Sin sucursales registradas.</Text>
          {client.isActive ? (
            <TextAction label="Agregar sucursal" icon="add" onPress={onAddBranch} />
          ) : null}
        </View>
      ) : (
        active.map((branch) => (
          <Pressable
            key={branch.id}
            onPress={() => onOpenBranch(branch)}
            accessibilityRole="button"
            accessibilityLabel={`Sucursal ${branch.name}`}
            className="-mx-2 min-h-16 flex-row items-center gap-3 border-t border-border px-2 py-2.5 active:bg-surface"
          >
            <View className="flex-1 gap-0.5">
              <HighlightedText
                text={branch.name.toUpperCase()}
                term={search}
                numberOfLines={1}
                className="font-sans-bold text-base text-foreground"
              />
              <HighlightedText
                text={branch.address ?? (branchPlace(branch) || 'Sin dirección')}
                term={search}
                numberOfLines={1}
                className="font-sans text-sm text-muted"
              />
            </View>
            <Icon name="arrow-forward" size={20} color={colors.foreground} />
          </Pressable>
        ))
      )}
    </View>
  );
}
