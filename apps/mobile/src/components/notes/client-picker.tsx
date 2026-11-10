import { matchesSearch } from '@nimzo/shared';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { HighlightedText } from '@/components/highlighted-text';
import { SearchField } from '@/components/search-field';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useClients } from '@/clients/use-clients';
import { colors } from '@/theme';

type ClientOption = { id: string; name: string };

type ClientPickerProps = {
  technicianId: string;
  selectedId: string | null;
  onSelect: (client: ClientOption) => void;
  onClose: () => void;
};

export function ClientPicker({ technicianId, selectedId, onSelect, onClose }: ClientPickerProps) {
  const [search, setSearch] = useState('');
  const clients = useClients(technicianId).filter((client) => client.isActive);
  const visible = clients.filter((client) => matchesSearch(client.name, search));

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center p-8">
        <Pressable
          className="absolute inset-0 bg-foreground/40"
          onPress={onClose}
          accessibilityLabel="Cerrar"
        />
        <View className="max-h-[560px] w-full max-w-[480px] overflow-hidden rounded-2xl bg-background">
          <View className="flex-row items-center justify-between pl-6 pr-2 pt-2">
            <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
              Ligar a un cliente
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="min-h-14 min-w-14 items-center justify-center"
            >
              <Icon name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
          {clients.length > 0 ? (
            <View className="mx-6 mb-3 mt-1">
              <SearchField value={search} onChangeText={setSearch} placeholder="Buscar cliente" />
            </View>
          ) : null}
          <FlatList
            data={visible}
            keyExtractor={(client) => client.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="px-6 py-8 text-center font-sans text-base text-muted">
                {clients.length === 0
                  ? 'Aún no tienes clientes. Agrégalos en la pestaña Clientes.'
                  : 'Ningún cliente coincide con tu búsqueda.'}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: item.id === selectedId }}
                className={`min-h-14 flex-row items-center gap-3 px-6 active:bg-border ${item.id === selectedId ? 'bg-canvas' : ''}`}
              >
                <Icon name="briefcase-outline" size={22} color={colors.muted} />
                <HighlightedText
                  text={item.name}
                  term={search}
                  className="flex-1 font-sans text-lg text-foreground"
                />
                {item.id === selectedId ? (
                  <Icon name="checkmark" size={22} color={colors['primary-strong']} />
                ) : null}
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
