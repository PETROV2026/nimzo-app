import { formTitle, systemTypeLabels } from '@nimzo/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/button';
import { BranchFormDialog } from '@/components/clients/branch-form-dialog';
import { FormDialog } from '@/components/form-dialog';
import { Icon } from '@/components/icon';
import { SelectField } from '@/components/select-field';
import { TextAction } from '@/components/text-action';
import { type BranchDetails, createBranch } from '@/clients/branches-db';
import { branchPlace, useBranches, useClients, useSystems } from '@/clients/use-clients';
import { type ServiceSelection, serviceChoices } from '@/service-forms/new-service';
import type { LocalServiceForm } from '@/service-forms/service-forms-db';
import { colors } from '@/theme';

const searchThreshold = 7;
const noSystem = 'none';

type StartedService = { clientId: string; branchId: string; systemId: string | null };

type NewServiceDialogProps = {
  form: LocalServiceForm;
  technicianId: string;
  onClose: () => void;
  onStart: (service: StartedService) => void;
};

export function NewServiceDialog({ form, technicianId, onClose, onStart }: NewServiceDialogProps) {
  const allClients = useClients(technicianId);
  const allBranches = useBranches(technicianId);
  const allSystems = useSystems(technicianId);
  const [selection, setSelection] = useState<ServiceSelection>({});
  const [addingBranch, setAddingBranch] = useState(false);
  const choices = serviceChoices(allClients, allBranches, allSystems, selection);
  const client = choices.clients.find((item) => item.id === choices.clientId);

  function addBranch(details: BranchDetails) {
    if (!client) return;
    createBranch(technicianId, client.id, details);
    setAddingBranch(false);
  }

  function start() {
    if (!choices.clientId || !choices.branchId) return;
    onStart({
      clientId: choices.clientId,
      branchId: choices.branchId,
      systemId: choices.systemId,
    });
  }

  if (choices.clients.length === 0) {
    return (
      <FormDialog
        title="Nuevo servicio"
        description={formTitle(form)}
        dirty={false}
        submitLabel="Comenzar servicio"
        submitDisabled
        onSubmit={start}
        onClose={onClose}
      >
        <View className="items-center gap-4 rounded-xl bg-surface p-6">
          <Icon name="people-outline" size={40} color={colors['border-strong']} />
          <Text className="text-center font-sans-medium text-lg text-foreground">
            Aún no tienes clientes. Agrega uno en Clientes para crear un servicio.
          </Text>
          <Button
            variant="secondary"
            icon="people-outline"
            label="Ir a Clientes"
            onPress={() => {
              onClose();
              router.navigate('/clients');
            }}
          />
        </View>
      </FormDialog>
    );
  }

  return (
    <>
      <FormDialog
        title="Nuevo servicio"
        description={formTitle(form)}
        dirty={false}
        submitLabel="Comenzar servicio"
        submitIcon="arrow-forward"
        submitDisabled={!choices.ready}
        onSubmit={start}
        onClose={onClose}
      >
        <View className="gap-5">
          <SelectField
            label="Cliente"
            placeholder="Elige el cliente"
            value={choices.clientId}
            options={choices.clients.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(clientId) => setSelection({ clientId })}
            searchPlaceholder={
              choices.clients.length > searchThreshold ? 'Buscar cliente' : undefined
            }
          />

          {client && choices.branches.length === 0 ? (
            <View className="gap-1">
              <Text className="font-sans-medium text-lg text-foreground">Sucursal</Text>
              <Text className="font-sans text-base text-muted">
                Este cliente no tiene sucursales.
              </Text>
              <TextAction
                icon="add"
                label="Agregar sucursal"
                onPress={() => setAddingBranch(true)}
              />
            </View>
          ) : (
            <SelectField
              label="Sucursal"
              placeholder={client ? 'Elige la sucursal' : 'Primero elige el cliente'}
              disabled={!client}
              value={choices.branchId}
              options={choices.branches.map((item) => ({
                value: item.id,
                label: item.name,
                description: branchPlace(item) || undefined,
              }))}
              onChange={(branchId) => setSelection({ ...selection, branchId, systemId: null })}
              searchPlaceholder={
                choices.branches.length > searchThreshold ? 'Buscar sucursal' : undefined
              }
            />
          )}

          {choices.branchId && choices.systems.length > 0 ? (
            <SelectField
              label="Sistema (opcional)"
              value={choices.systemId ?? noSystem}
              options={[
                {
                  value: noSystem,
                  label: 'Sin sistema',
                  description: 'El formato es general para la sucursal.',
                },
                ...choices.systems.map((item) => ({
                  value: item.id,
                  label: item.name,
                  description:
                    [systemTypeLabels[item.system_type], item.location]
                      .filter(Boolean)
                      .join(' · ') || undefined,
                })),
              ]}
              onChange={(systemId) =>
                setSelection({ ...selection, systemId: systemId === noSystem ? null : systemId })
              }
              searchPlaceholder={
                choices.systems.length > searchThreshold ? 'Buscar sistema' : undefined
              }
            />
          ) : null}
        </View>
      </FormDialog>
      {addingBranch && client ? (
        <BranchFormDialog
          clientName={client.name}
          siblings={allBranches.filter((item) => item.clientId === client.id)}
          onSave={addBranch}
          onToggleActive={() => undefined}
          onClose={() => setAddingBranch(false)}
        />
      ) : null}
    </>
  );
}
