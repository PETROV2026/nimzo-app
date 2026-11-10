import { excerptAround, matchesSearch } from '@nimzo/shared';
import { Pressable, Text, View } from 'react-native';
import type { LocalBranch } from '@/clients/branches-db';
import type { LocalClient } from '@/clients/clients-db';
import { branchPlace, branchSearchText } from '@/clients/use-clients';
import { HighlightedText } from '@/components/highlighted-text';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type ClientRowProps = {
  client: LocalClient;
  branches: LocalBranch[];
  search: string;
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
  return client.tax_id ?? client.contact_name ?? 'Sin RFC';
}

export function ClientRow({ client, branches, search, onPress }: ClientRowProps) {
  const branchCount = branches.filter((branch) => branch.isActive).length;
  const pending = !client.syncedAt || branches.some((branch) => !branch.syncedAt);
  const meta = client.isActive
    ? `${branchCount} ${branchCount === 1 ? 'sucursal' : 'sucursales'}`
    : 'Inactivo';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${client.name}, ${meta}${pending ? ', sin subir a la nube' : ''}`}
      className={`min-h-[72px] flex-row items-center gap-4 border-b border-border py-3 pl-5 pr-4 bg-background active:bg-surface`}
    >
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
      {pending ? <Icon name="cloud-upload-outline" size={20} color={colors.muted} /> : null}
      <Text className="font-sans text-base text-muted">{meta}</Text>
      <Icon name="chevron-forward" size={20} color={colors['border-strong']} />
    </Pressable>
  );
}
