import { MaterialIcons } from '@expo/vector-icons';
import { toSearchText } from '@nimzo/shared';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useOnline } from '@/lib/use-online';
import { colors } from '@/theme';

type ClientOption = { id: string; name: string };

type ClientPickerProps = {
  selectedId: string | null;
  onSelect: (client: ClientOption) => void;
  onClose: () => void;
};

export function ClientPicker({ selectedId, onSelect, onClose }: ClientPickerProps) {
  const online = useOnline();
  const [clients, setClients] = useState<ClientOption[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    supabase
      .from('clients')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return;
        setFailed(!!error);
        setClients(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [online]);

  const term = toSearchText(search);
  const visible = (clients ?? []).filter((client) => toSearchText(client.name).includes(term));

  let content;
  if (!online) {
    content = (
      <Text className="px-6 py-8 text-center font-sans text-base text-muted">
        Necesitas conexión para elegir un cliente. Puedes ligarlo después.
      </Text>
    );
  } else if (clients === null) {
    content = (
      <View className="items-center gap-3 py-10">
        <ActivityIndicator color={colors.muted} />
        <Text className="font-sans text-base text-muted">Cargando tus clientes…</Text>
      </View>
    );
  } else if (failed) {
    content = (
      <Text className="px-6 py-8 text-center font-sans text-base text-muted">
        No se pudieron cargar tus clientes. Intenta de nuevo en un momento.
      </Text>
    );
  } else {
    content = (
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
            className={`min-h-14 flex-row items-center gap-3 px-6 active:bg-surface ${item.id === selectedId ? 'bg-canvas' : ''}`}
          >
            <MaterialIcons name="business" size={22} color={colors.muted} />
            <Text className="flex-1 font-sans text-lg text-foreground">{item.name}</Text>
            {item.id === selectedId ? (
              <MaterialIcons name="check" size={22} color={colors['primary-strong']} />
            ) : null}
          </Pressable>
        )}
      />
    );
  }

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
              <MaterialIcons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
          {online && clients && clients.length > 0 ? (
            <View className="mx-6 mb-3 mt-1 flex-row items-center gap-2 rounded-lg border-2 border-border-strong px-3">
              <MaterialIcons name="search" size={22} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar cliente"
                placeholderTextColor={colors.placeholder}
                accessibilityLabel="Buscar cliente"
                className="min-h-14 flex-1 font-sans text-lg text-foreground"
              />
            </View>
          ) : null}
          {content}
        </View>
      </View>
    </Modal>
  );
}
