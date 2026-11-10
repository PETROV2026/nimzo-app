import { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
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
import { ClientCard } from '@/components/clients/client-card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { SearchField } from '@/components/search-field';
import { useToast } from '@/components/toast';

const gap = 16;

function columnsFor(width: number) {
  return width >= 1000 ? 3 : width >= 640 ? 2 : 1;
}

type FormState = { mode: 'create' } | { mode: 'edit'; client: LocalClient } | null;
type BranchFormState = { client: LocalClient; branch?: LocalBranch } | null;

export default function ClientsScreen() {
  const session = useSession();
  const technicianId = session.status === 'signed-in' ? session.session.user.id : '';
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [gridWidth, setGridWidth] = useState(0);
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
  const formBranches = branchForm ? (branchesByClient.get(branchForm.client.id) ?? []) : [];

  if (!technicianId) return null;

  const searching = search.trim() !== '';
  const columns = columnsFor(gridWidth);
  const cardWidth = Math.floor((gridWidth - gap * (columns - 1)) / columns);
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
    if (!branchForm) return;
    if (branchForm.branch) {
      updateBranch(branchForm.branch.id, technicianId, details);
      showToast('Sucursal guardada', details.name);
    } else {
      createBranch(technicianId, branchForm.client.id, details);
      showToast('Sucursal agregada', `${details.name} de ${branchForm.client.name}`);
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
            placeholder="Buscar cliente o sucursal"
            accessibilityLabel="Buscar clientes"
          />
          <Text accessibilityLiveRegion="polite" className="px-1 font-sans text-base text-muted">
            {searching
              ? `${clients.length} de ${allClients.length} clientes`
              : `${activeCount} ${activeCount === 1 ? 'cliente activo' : 'clientes activos'}`}
          </Text>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-6 px-4 pb-32 pt-1"
          onLayout={(event) => setGridWidth(event.nativeEvent.layout.width - 32)}
        >
          {clients.length === 0 ? (
            <Text className="px-2 py-10 text-center font-sans text-base text-muted">
              Ningún cliente coincide con “{search.trim()}”.
            </Text>
          ) : null}
          {gridWidth > 0
            ? [
                { key: 'active', label: null, list: clients.filter((client) => client.isActive) },
                {
                  key: 'inactive',
                  label: 'Inactivos',
                  list: clients.filter((client) => !client.isActive),
                },
              ].map((section) =>
                section.list.length === 0 ? null : (
                  <View key={section.key} className="gap-3">
                    {section.label ? (
                      <Text
                        accessibilityRole="header"
                        className="px-1 font-sans-semibold text-base text-muted"
                      >
                        {section.label}
                      </Text>
                    ) : null}
                    <View className="flex-row flex-wrap" style={{ gap }}>
                      {section.list.map((client) => (
                        <ClientCard
                          key={client.id}
                          client={client}
                          branches={branchesByClient.get(client.id) ?? []}
                          search={search}
                          width={cardWidth}
                          onOpenClient={() => setSelectedId(client.id)}
                          onOpenBranch={(branch) => setBranchForm({ client, branch })}
                          onAddBranch={() => setBranchForm({ client })}
                        />
                      ))}
                    </View>
                  </View>
                ),
              )
            : null}
        </ScrollView>
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
      onAddBranch={() => setBranchForm({ client: selected })}
      onEditBranch={(branch) => setBranchForm({ client: selected, branch })}
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
      {branchForm ? (
        <BranchFormDialog
          clientName={branchForm.client.name}
          branch={branchForm.branch}
          siblings={formBranches.filter((branch) => branch.id !== branchForm.branch?.id)}
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
        <View className="absolute bottom-6 right-6 min-w-[240px]" style={{ elevation: 6 }}>
          <Button
            label="Agregar cliente"
            icon="add"
            variant="danger"
            onPress={() => setForm({ mode: 'create' })}
          />
        </View>
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
