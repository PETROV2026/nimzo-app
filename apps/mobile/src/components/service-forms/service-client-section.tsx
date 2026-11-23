import { systemTypeLabels } from '@nimzo/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/button';
import { BranchFormDialog } from '@/components/clients/branch-form-dialog';
import { Icon, type IconName } from '@/components/icon';
import { SelectField } from '@/components/select-field';
import { TextAction } from '@/components/text-action';
import { type BranchDetails, createBranch } from '@/clients/branches-db';
import { branchPlace, useBranches, useClients, useSystems } from '@/clients/use-clients';
import { serviceChoices } from '@/service-forms/new-service';
import { colors } from '@/theme';

const searchThreshold = 7;
const noSystem = 'none';

export type ServiceTarget = { clientId: string; branchId: string; systemId: string | null };

type Selection = { clientId?: string | null; branchId?: string | null; systemId?: string | null };

function useCatalog(technicianId: string) {
  return {
    clients: useClients(technicianId),
    branches: useBranches(technicianId),
    systems: useSystems(technicianId),
  };
}

export function useServiceTargetComplete(technicianId: string, target: ServiceTarget | null) {
  const { clients, branches, systems } = useCatalog(technicianId);
  if (!target) return false;
  return serviceChoices(clients, branches, systems, target).ready;
}

export function EditServiceButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Editar cliente y sucursal"
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-2 rounded-lg border-2 border-border-strong px-4 active:bg-surface"
    >
      <Icon name="pencil-outline" size={20} color={colors.foreground} />
      <Text className="font-sans-semibold text-base text-foreground">Editar</Text>
    </Pressable>
  );
}

export function PendingServiceBadge() {
  return (
    <View className="rounded-full bg-accent/30 px-3 py-1">
      <Text className="font-sans-semibold text-sm text-foreground">Por elegir</Text>
    </View>
  );
}

function Tile({
  icon,
  label,
  title,
  lines,
}: {
  icon: IconName;
  label: string;
  title: string;
  lines: (string | null | undefined)[];
}) {
  const shown = lines.filter((line): line is string => Boolean(line && line.trim()));
  return (
    <View className="flex-1 flex-row gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="size-11 items-center justify-center rounded-full bg-background">
        <Icon name={icon} size={22} color={colors['primary-strong']} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-medium text-sm text-muted">{label}</Text>
        <Text className="font-sans-bold text-lg text-foreground">{title}</Text>
        {shown.map((line) => (
          <Text key={line} className="font-sans text-sm text-muted">
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function ServiceSummary({
  technicianId,
  target,
}: {
  technicianId: string;
  target: ServiceTarget;
}) {
  const { width } = useWindowDimensions();
  const { clients, branches, systems } = useCatalog(technicianId);
  const client = clients.find((item) => item.id === target.clientId);
  const branch = branches.find((item) => item.id === target.branchId);
  const system = systems.find((item) => item.id === target.systemId);
  if (!client || !branch) return null;

  return (
    <View className={width >= 900 ? 'flex-row gap-4' : 'gap-3'}>
      <Tile
        icon="business-outline"
        label="Cliente"
        title={client.name}
        lines={[
          client.contact_name,
          [client.contact_phone, client.contact_email].filter(Boolean).join(' · '),
        ]}
      />
      <Tile
        icon="location-outline"
        label="Sucursal"
        title={branch.name}
        lines={[branch.address, branchPlace(branch)]}
      />
      <Tile
        icon="construct-outline"
        label="Sistema"
        title={system ? system.name : 'Sin sistema'}
        lines={
          system
            ? [systemTypeLabels[system.system_type], system.location]
            : ['El formato es general para la sucursal.']
        }
      />
    </View>
  );
}

type ServicePickerProps = {
  technicianId: string;
  initial: ServiceTarget | null;
  onSave: (target: ServiceTarget) => void;
  onCancel?: () => void;
};

export function ServicePicker({ technicianId, initial, onSave, onCancel }: ServicePickerProps) {
  const { width } = useWindowDimensions();
  const { clients, branches, systems } = useCatalog(technicianId);
  const [selection, setSelection] = useState<Selection>(initial ?? {});
  const [addingBranch, setAddingBranch] = useState(false);
  const choices = serviceChoices(clients, branches, systems, selection);
  const client = choices.clients.find((item) => item.id === choices.clientId);
  const cell = width >= 1000 ? 'flex-1' : 'w-full';

  function addBranch(details: BranchDetails) {
    if (!client) return;
    createBranch(technicianId, client.id, details);
    setAddingBranch(false);
  }

  function save() {
    if (!choices.clientId || !choices.branchId) return;
    onSave({ clientId: choices.clientId, branchId: choices.branchId, systemId: choices.systemId });
  }

  if (choices.clients.length === 0) {
    return (
      <View className="flex-row flex-wrap items-center gap-4 rounded-xl bg-surface p-5">
        <Icon name="people-outline" size={32} color={colors['border-strong']} />
        <Text className="flex-1 font-sans-medium text-base text-foreground">
          Aún no tienes clientes. Agrega uno en Clientes para llenar este servicio.
        </Text>
        <Button
          variant="secondary"
          icon="people-outline"
          label="Ir a Clientes"
          onPress={() => router.navigate('/clients')}
        />
      </View>
    );
  }

  return (
    <View className="gap-5">
      <Text className="font-sans text-base text-muted">
        Elige para quién es este servicio. Sus datos aparecerán en el reporte.
      </Text>
      <View className={width >= 1000 ? 'flex-row items-start gap-4' : 'gap-4'}>
        <View className={cell}>
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
        </View>
        <View className={cell}>
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
        </View>
        <View className={cell}>
          <SelectField
            label="Sistema (opcional)"
            placeholder={choices.branchId ? 'Sin sistema' : 'Primero elige la sucursal'}
            disabled={!choices.branchId || choices.systems.length === 0}
            value={choices.branchId ? (choices.systemId ?? noSystem) : null}
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
                  [systemTypeLabels[item.system_type], item.location].filter(Boolean).join(' · ') ||
                  undefined,
              })),
            ]}
            onChange={(systemId) =>
              setSelection({ ...selection, systemId: systemId === noSystem ? null : systemId })
            }
            searchPlaceholder={
              choices.systems.length > searchThreshold ? 'Buscar sistema' : undefined
            }
          />
          {choices.branchId && choices.systems.length === 0 ? (
            <Text className="pt-2 font-sans text-sm text-muted">
              Esta sucursal no tiene sistemas registrados.
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex-row flex-wrap justify-end gap-3">
        {onCancel ? <Button variant="secondary" label="Cancelar" onPress={onCancel} /> : null}
        <Button
          icon="checkmark"
          label={initial ? 'Guardar cambios' : 'Usar estos datos'}
          disabled={!choices.ready}
          onPress={save}
        />
      </View>
      {addingBranch && client ? (
        <BranchFormDialog
          clientName={client.name}
          siblings={branches.filter((item) => item.clientId === client.id)}
          onSave={addBranch}
          onToggleActive={() => undefined}
          onClose={() => setAddingBranch(false)}
        />
      ) : null}
    </View>
  );
}
