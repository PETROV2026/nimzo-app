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
import {
  createBranch,
  setBranchActive,
  updateBranch,
  type BranchDetails,
  type LocalBranch,
} from '@/clients/branches-db';
import { groupByClient, useBranches, useClients } from '@/clients/use-clients';
import { Button } from '@/components/button';
import { BranchFormDialog } from '@/components/clients/branch-form-dialog';
import { ClientDetail } from '@/components/clients/client-detail';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { ClientRow } from '@/components/clients/client-row';
import { ClientsSyncStatus } from '@/components/clients/clients-sync-status';
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
type BranchFormState = { mode: 'create' } | { mode: 'edit'; branch: LocalBranch } | null;

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
  const [branchForm, setBranchForm] = useState<BranchFormState>(null);
  const [deactivatingBranch, setDeactivatingBranch] = useState<LocalBranch | null>(null);
  const [toast, setToast] = useState<{ id: number; title: string; description?: string } | null>(
    null,
  );
  const hideToast = useCallback(() => setToast(null), []);
  const allClients = useClients(technicianId);
  const clients = useClients(technicianId, search);
  const branchesByClient = groupByClient(useBranches(technicianId));
  const selected = allClients.find((client) => client.id === selectedId) ?? null;
  const selectedBranches = selected ? (branchesByClient.get(selected.id) ?? []) : [];

  if (!technicianId) return null;

  const searching = search.trim() !== '';
  const activeCount = allClients.filter((client) => client.isActive).length;
  const pendingCount =
    allClients.filter((client) => !client.syncedAt).length +
    [...branchesByClient.values()].flat().filter((branch) => !branch.syncedAt).length;

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
        description: 'Guardado en la tablet; se sube a la nube en cuanto haya internet.',
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

  function handleSaveBranch(details: BranchDetails) {
    if (!selected) return;
    if (branchForm?.mode === 'edit') {
      updateBranch(branchForm.branch.id, technicianId, details);
      setToast({ id: Date.now(), title: 'Sucursal guardada', description: details.name });
    } else {
      createBranch(technicianId, selected.id, details);
      setToast({
        id: Date.now(),
        title: 'Sucursal agregada',
        description: `${details.name} de ${selected.name}`,
      });
    }
    setBranchForm(null);
  }

  function handleToggleBranch(branch: LocalBranch) {
    setBranchForm(null);
    if (branch.isActive) {
      setDeactivatingBranch(branch);
      return;
    }
    setBranchActive(branch.id, technicianId, true);
    setToast({ id: Date.now(), title: 'Sucursal reactivada', description: branch.name });
  }

  function handleDeactivateBranch() {
    if (!deactivatingBranch) return;
    setBranchActive(deactivatingBranch.id, technicianId, false);
    setToast({
      id: Date.now(),
      title: 'Sucursal desactivada',
      description: deactivatingBranch.name,
    });
    setDeactivatingBranch(null);
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
          <ClientsSyncStatus technicianId={technicianId} pendingCount={pendingCount} />
        </View>
        <FlatList
          data={buildList(clients)}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="border-t border-border pb-28"
          ListEmptyComponent={
            <Text className="px-2 py-10 text-center font-sans text-base text-muted">
              Ningún cliente coincide con “{search.trim()}”.
            </Text>
          }
          renderItem={({ item }) =>
            item.type === 'header' ? (
              <Text
                accessibilityRole="header"
                className="border-b border-border px-5 pb-2 pt-6 font-sans-semibold text-base text-muted"
              >
                {item.label}
              </Text>
            ) : (
              <ClientRow
                client={item.client}
                branches={branchesByClient.get(item.client.id) ?? []}
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
      branches={selectedBranches}
      showBack={!split}
      onBack={() => setSelectedId(null)}
      onEdit={() => setForm({ mode: 'edit', client: selected })}
      onToggleActive={handleToggleActive}
      onAddBranch={() => setBranchForm({ mode: 'create' })}
      onEditBranch={(branch) => setBranchForm({ mode: 'edit', branch })}
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
      {branchForm && selected ? (
        <BranchFormDialog
          clientName={selected.name}
          branch={branchForm.mode === 'edit' ? branchForm.branch : undefined}
          siblings={selectedBranches.filter(
            (branch) => branchForm.mode === 'create' || branch.id !== branchForm.branch.id,
          )}
          onSave={handleSaveBranch}
          onToggleActive={
            branchForm.mode === 'edit' ? () => handleToggleBranch(branchForm.branch) : undefined
          }
          onClose={() => setBranchForm(null)}
        />
      ) : null}
      {deactivatingBranch ? (
        <ConfirmDialog
          title="¿Desactivar esta sucursal?"
          message={`${deactivatingBranch.name} quedará como inactiva. Sus datos se conservan y puedes reactivarla cuando quieras.`}
          confirmLabel="Desactivar"
          tone="destructive"
          onConfirm={handleDeactivateBranch}
          onClose={() => setDeactivatingBranch(null)}
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
