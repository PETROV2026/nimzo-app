import { excerptAround, matchesSearch } from '@nimzo/shared';
import { Pressable, Text, View } from 'react-native';
import type { LocalBranch } from '@/clients/branches-db';
import type { LocalClient } from '@/clients/clients-db';
import { branchPlace, branchSearchText } from '@/clients/use-clients';
import { ClientMonogram } from '@/components/clients/client-monogram';
import { HighlightedText } from '@/components/highlighted-text';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type ClientRowProps = {
  client: LocalClient;
  branches: LocalBranch[];
  search: string;
  selected: boolean;
  showChevron: boolean;
  onPress: () => void;
};

function subtitle(client: LocalClient, branches: LocalBranch[], search: string) {
  const details = [client.tax_id, client.contact_name, client.contact_phone, client.contact_email];
  const matching = search.trim()
    ? details.find((detail) => detail && matchesSearch(detail, search))
    : undefined;
  if (matching) return excerptAround(matching, search);
  const branch = search.trim()
    ? branches.find((item) => matchesSearch(branchSearchText(item), search))
    : undefined;
  if (branch) {
    const place = branchPlace(branch);
    return `Sucursal ${branch.name}${place ? `, ${place}` : ''}`;
  }
  return client.contact_name ?? client.tax_id ?? 'Sin datos de contacto';
}

export function ClientRow({
  client,
  branches,
  search,
  selected,
  showChevron,
  onPress,
}: ClientRowProps) {
  const branchCount = branches.filter((branch) => branch.isActive).length;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={client.isActive ? client.name : `${client.name}, inactivo`}
      className={`min-h-20 flex-row items-center gap-4 rounded-2xl border-2 px-4 py-3 active:bg-surface ${selected ? 'border-primary-strong bg-background' : 'border-transparent bg-background'}`}
    >
      <ClientMonogram name={client.name} active={client.isActive} />
      <View className="flex-1 gap-0.5">
        <HighlightedText
          text={client.name}
          term={search}
          numberOfLines={1}
          className={`font-sans-semibold text-lg ${client.isActive ? 'text-foreground' : 'text-muted'}`}
        />
        <HighlightedText
          text={subtitle(client, branches, search)}
          term={search}
          numberOfLines={1}
          className="font-sans text-base text-muted"
        />
      </View>
      {client.isActive ? (
        <View className="items-end">
          <Text className="font-sans-bold text-lg text-foreground">{branchCount}</Text>
          <Text className="font-sans text-sm text-muted">
            {branchCount === 1 ? 'sucursal' : 'sucursales'}
          </Text>
        </View>
      ) : (
        <View className="rounded-full bg-border px-3 py-1">
          <Text className="font-sans-medium text-sm text-muted">Inactivo</Text>
        </View>
      )}
      {showChevron ? (
        <Icon name="chevron-forward" size={22} color={colors['border-strong']} />
      ) : null}
    </Pressable>
  );
}
