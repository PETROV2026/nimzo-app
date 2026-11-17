import { matchesSearch } from '@nimzo/shared';
import { Pressable, Text, View } from 'react-native';
import type { LocalBranch } from '@/clients/branches-db';
import type { LocalClient } from '@/clients/clients-db';
import { branchPlace } from '@/clients/use-clients';
import { HighlightedText } from '@/components/highlighted-text';
import { Icon } from '@/components/icon';
import { InactiveBadge } from '@/components/inactive-badge';
import { TextAction } from '@/components/text-action';
import { colors } from '@/theme';

function branchLine(branch: LocalBranch) {
  return branch.address ?? (branchPlace(branch) || 'Sin dirección');
}

function hiddenMatch(client: LocalClient, branches: LocalBranch[], search: string) {
  if (!search.trim()) return null;
  const active = branches.filter((branch) => branch.isActive);
  const shown = [client.name, ...active.flatMap((branch) => [branch.name, branchLine(branch)])];
  if (shown.some((text) => matchesSearch(text, search))) return null;
  const candidates: [string, string | null][] = [
    ['RFC', client.tax_id],
    ['Contacto', client.contact_name],
    ['Teléfono', client.contact_phone],
    ['Correo', client.contact_email],
    ...active.map((branch): [string, string] => [branch.name, branchPlace(branch)]),
    ...branches
      .filter((branch) => !branch.isActive)
      .map((branch): [string, string] => [
        'Sucursal inactiva',
        [branch.name, branch.address, branchPlace(branch)].filter(Boolean).join(', '),
      ]),
  ];
  const found = candidates.find(([, value]) => value && matchesSearch(value, search));
  return found?.[1] ? { label: found[0], value: found[1] } : null;
}

type ClientCardProps = {
  client: LocalClient;
  branches: LocalBranch[];
  search: string;
  width: number;
  pendingSystems: boolean;
  onOpenClient: () => void;
  onOpenBranch: (branch: LocalBranch) => void;
  onAddBranch: () => void;
};

export function ClientCard({
  client,
  branches,
  search,
  width,
  pendingSystems,
  onOpenClient,
  onOpenBranch,
  onAddBranch,
}: ClientCardProps) {
  const active = branches.filter((branch) => branch.isActive);
  const pending = !client.syncedAt || pendingSystems || branches.some((branch) => !branch.syncedAt);
  const match = hiddenMatch(client, branches, search);

  return (
    <View
      style={{ width, elevation: client.isActive ? 2 : 0 }}
      className={`overflow-hidden rounded-2xl px-5 pb-3 pt-2 ${client.isActive ? 'bg-background' : 'border border-border bg-surface'}`}
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
        {client.isActive ? null : <InactiveBadge />}
        <Icon name="information-circle-outline" size={20} color={colors['border-strong']} />
      </Pressable>

      {match ? (
        <View className="-mt-1 flex-row gap-2 pb-2">
          <Text className="font-sans-medium text-sm text-muted">{match.label}:</Text>
          <HighlightedText
            text={match.value}
            term={search}
            numberOfLines={1}
            className="flex-1 font-sans text-sm text-foreground"
          />
        </View>
      ) : null}

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
            accessibilityHint="Abre la sucursal con sus reportes y sistemas"
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
                text={branchLine(branch)}
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
