import { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session-provider';
import {
  createClient,
  setClientActive,
  updateClient,
  type ClientDetails,
  type LocalClient,
} from '@/clients/clients-db';
import { useClients } from '@/clients/use-clients';
import { Button } from '@/components/button';
import { ClientDetail } from '@/components/clients/client-detail';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { ClientRow } from '@/components/clients/client-row';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { Toast } from '@/components/toast';
import { colors } from '@/theme';

const splitMinWidth = 900;

type ListItem =
  | { type: 'header'; key: string; label: string }
  | { type: 'client'; key: string; client: LocalClient };

function buildList(clients: LocalClient[]): ListItem[] {
  const active = clients.filter((client) => client.isActive);
  const inactive = clients.filter((client) => !client.isActive);
  const toItems = (list: LocalClient[]) =>
    list.map((client): ListItem => ({ type: 'client', key: client.id, client }));
  return [
    ...toItems(active),
    ...(inactive.length > 0
      ? [{ type: 'header' as const, key: 'inactive', label: 'Inactivos' }, ...toItems(inactive)]
      : []),
  ];
}

type FormState = { mode: 'create' } | { mode: 'edit'; client: LocalClient } | null;

export default function ClientsScreen() {
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const split = width > height && width >= splitMinWidth;
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const [toast, setToast] = useState<{ id: number; title: string; description?: string } | null>(
    null,
  );
  const hideToast = useCallback(() => setToast(null), []);
  const allClients = useClients(technicianId);
  const clients = useClients(technicianId, search);
  const selected = allClients.find((client) => client.id === selectedId) ?? null;

  if (!technicianId) return null;

  const searching = search.trim() !== '';
  const activeCount = allClients.filter((client) => client.isActive).length;

  function handleSave(details: ClientDetails) {
    if (form?.mode === 'edit') {
      updateClient(form.client.id, technicianId, details);
      setToast({ id: Date.now(), title: 'Cambios guardados', description: details.name });
    } else {
      const client = createClient(technicianId, details);
      setSearch('');
      setSelectedId(client.id);
      setToast({
        id: Date.now(),
        title: 'Cliente agregado',
        description: 'Se sincroniza con tu cuenta cuando tengas internet.',
      });
    }
    setForm(null);
  }

  function handleToggleActive() {
    if (!selected) return;
    if (selected.isActive) {
      setConfirmingDeactivate(true);
      return;
    }
    setClientActive(selected.id, technicianId, true);
    setToast({ id: Date.now(), title: 'Cliente reactivado', description: selected.name });
  }

  function handleDeactivate() {
    if (!selected) return;
    setClientActive(selected.id, technicianId, false);
    setConfirmingDeactivate(false);
    setToast({ id: Date.now(), title: 'Cliente desactivado', description: selected.name });
  }

  const addButton = (
    <Pressable
      onPress={() => setForm({ mode: 'create' })}
      accessibilityRole="button"
      accessibilityLabel="Agregar cliente"
      className={`absolute items-center justify-center rounded-full bg-primary-strong active:opacity-80 ${split ? 'bottom-5 right-5 h-14 w-14' : 'bottom-6 right-6 h-[72px] w-[72px]'}`}
      style={{ elevation: 6 }}
    >
      <Icon name="add" size={split ? 28 : 36} color={colors['on-primary']} />
    </Pressable>
  );

  const list =
    allClients.length === 0 ? (
      <EmptyState
        icon="people-outline"
        title="Aún no tienes clientes"
        description="Agrega las empresas a las que das servicio. Se guardan en esta tablet, aun sin internet, y después podrás sumar sus sucursales y sistemas."
        action={
          <View className="min-w-[260px]">
            <Button
              label="Agregar cliente"
              icon="add"
              onPress={() => setForm({ mode: 'create' })}
            />
          </View>
        }
      />
    ) : (
      <View className="flex-1">
        <View className="gap-3 px-4 pb-3 pt-4">
          <View className="min-h-14 flex-row items-center gap-2 rounded-xl border-2 border-border bg-background px-3">
            <Icon name="search" size={24} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre, RFC o contacto"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Buscar clientes"
              returnKeyType="search"
              className="min-h-14 flex-1 font-sans text-lg text-foreground"
            />
            {searching ? (
              <Pressable
                onPress={() => setSearch('')}
                accessibilityRole="button"
                accessibilityLabel="Borrar búsqueda"
                className="-mr-2 min-h-14 min-w-14 items-center justify-center"
              >
                <Icon name="close-circle" size={24} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <Text accessibilityLiveRegion="polite" className="px-1 font-sans text-base text-muted">
            {searching
              ? `${clients.length} de ${allClients.length} clientes`
              : `${activeCount} ${activeCount === 1 ? 'cliente activo' : 'clientes activos'}`}
          </Text>
        </View>
        <FlatList
          data={buildList(clients)}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-2 px-4 pb-28"
          ListEmptyComponent={
            <Text className="px-2 py-10 text-center font-sans text-base text-muted">
              Ningún cliente coincide con “{search.trim()}”.
            </Text>
          }
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <Text
                accessibilityRole="header"
                className="px-1 pb-1 pt-4 font-sans-semibold text-base text-muted"
              >
                {item.label}
              </Text>
            ) : (
              <ClientRow
                client={item.client}
                search={search}
                selected={split && item.client.id === selectedId}
                showChevron={!split}
                onPress={() => setSelectedId(item.client.id)}
              />
            )
          }
        />
      </View>
    );

  const detail = selected ? (
    <ClientDetail
      key={selected.id}
      client={selected}
      showBack={!split}
      onBack={() => setSelectedId(null)}
      onEdit={() => setForm({ mode: 'edit', client: selected })}
      onToggleActive={handleToggleActive}
    />
  ) : null;

  const overlays = (
    <>
      {form ? (
        <ClientFormDialog
          client={form.mode === 'edit' ? form.client : undefined}
          otherClients={allClients.filter(
            (client) => form.mode === 'create' || client.id !== form.client.id,
          )}
          onSave={handleSave}
          onClose={() => setForm(null)}
        />
      ) : null}
      {confirmingDeactivate && selected ? (
        <ConfirmDialog
          title="¿Desactivar este cliente?"
          message={`${selected.name} dejará de aparecer al ligar notas. Sus datos se conservan y puedes reactivarlo cuando quieras.`}
          confirmLabel="Desactivar"
          tone="destructive"
          onConfirm={handleDeactivate}
          onClose={() => setConfirmingDeactivate(false)}
        />
      ) : null}
      {toast ? (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          onHide={hideToast}
        />
      ) : null}
    </>
  );

  if (split) {
    return (
      <View className="flex-1 flex-row bg-canvas">
        <View className="w-[420px] border-r border-border">
          {list}
          {allClients.length > 0 ? addButton : null}
        </View>
        <View className="flex-1">
          {detail ?? (
            <View className="flex-1 items-center justify-center gap-3 p-8">
              <Icon name="business-outline" size={56} color={colors['border-strong']} />
              <Text className="text-center font-sans text-lg text-muted">
                {allClients.length === 0
                  ? 'Aquí verás los datos del cliente que elijas.'
                  : 'Elige un cliente de la lista para ver sus datos.'}
              </Text>
            </View>
          )}
        </View>
        {overlays}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      {list}
      {allClients.length > 0 ? addButton : null}
      {detail ? (
        <Modal
          animationType="slide"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setSelectedId(null)}
        >
          <View
            className="flex-1 bg-canvas"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
          >
            {detail}
            {overlays}
          </View>
        </Modal>
      ) : (
        overlays
      )}
    </View>
  );
}
