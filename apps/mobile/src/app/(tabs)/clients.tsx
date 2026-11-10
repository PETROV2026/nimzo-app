import { useState } from 'react';
import { FlatList, Modal, Text, View } from 'react-native';
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
import { AddButton } from '@/components/add-button';
import { Button } from '@/components/button';
import { BranchFormDialog } from '@/components/clients/branch-form-dialog';
import { ClientDetail } from '@/components/clients/client-detail';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { ClientRow } from '@/components/clients/client-row';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { SearchField } from '@/components/search-field';
import { useToast } from '@/components/toast';

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
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const [branchForm, setBranchForm] = useState<BranchFormState>(null);
  const [deactivatingBranch, setDeactivatingBranch] = useState<LocalBranch | null>(null);
  const { toast, showToast } = useToast();
  const allClients = useClients(technicianId);
  const clients = useClients(technicianId, search);
  const branchesByClient = groupByClient(useBranches(technicianId));
  const selected = allClients.find((client) => client.id === selectedId) ?? null;
  const selectedBranches = selected ? (branchesByClient.get(selected.id) ?? []) : [];

  if (!technicianId) return null;

  const searching = search.trim() !== '';
  const activeCount = allClients.filter((client) => client.isActive).length;

  function handleSave(details: ClientDetails) {
    if (form?.mode === 'edit') {
      updateClient(form.client.id, technicianId, details);
      showToast('Cambios guardados', details.name);
    } else {
      const client = createClient(technicianId, details);
      setSearch('');
      setSelectedId(client.id);
      showToast(
        'Cliente agregado',
        'Guardado en la tablet; se sube a la nube en cuanto haya internet.',
      );
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
    showToast('Cliente reactivado', selected.name);
  }

  function handleDeactivate() {
    if (!selected) return;
    setClientActive(selected.id, technicianId, false);
    setConfirmingDeactivate(false);
    showToast('Cliente desactivado', selected.name);
  }

  function handleSaveBranch(details: BranchDetails) {
    if (!selected) return;
    if (branchForm?.mode === 'edit') {
      updateBranch(branchForm.branch.id, technicianId, details);
      showToast('Sucursal guardada', details.name);
    } else {
      createBranch(technicianId, selected.id, details);
      showToast('Sucursal agregada', `${details.name} de ${selected.name}`);
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
    showToast('Sucursal reactivada', branch.name);
  }

  function handleDeactivateBranch() {
    if (!deactivatingBranch) return;
    setBranchActive(deactivatingBranch.id, technicianId, false);
    showToast('Sucursal desactivada', deactivatingBranch.name);
    setDeactivatingBranch(null);
  }

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
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre, RFC o contacto"
            accessibilityLabel="Buscar clientes"
          />
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
          onToggleActive={handleToggleBranch}
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
      {toast}
    </>
  );

  return (
    <View className="flex-1 bg-canvas">
      {list}
      {allClients.length > 0 ? (
        <AddButton label="Agregar cliente" onPress={() => setForm({ mode: 'create' })} />
      ) : null}
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
