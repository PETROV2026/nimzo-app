import { formTitle, matchesSearch, systemTypeLabels } from '@nimzo/shared';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { BranchFormDialog } from '@/components/clients/branch-form-dialog';
import { FormDialog } from '@/components/form-dialog';
import { HighlightedText } from '@/components/highlighted-text';
import { Icon } from '@/components/icon';
import { SearchField } from '@/components/search-field';
import { TextAction } from '@/components/text-action';
import { type BranchDetails, createBranch } from '@/clients/branches-db';
import { branchPlace, useBranches, useClients, useSystems } from '@/clients/use-clients';
import { type ServiceSelection, serviceChoices } from '@/service-forms/new-service';
import type { LocalServiceForm } from '@/service-forms/service-forms-db';
import { colors } from '@/theme';

const searchThreshold = 7;

type StartedService = { clientId: string; branchId: string; systemId: string | null };

type NewServiceDialogProps = {
  form: LocalServiceForm;
  technicianId: string;
  onClose: () => void;
  onStart: (service: StartedService) => void;
};

function ChoiceRow({
  title,
  subtitle,
  selected,
  search,
  onPress,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  search?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-14 flex-row items-center gap-3 rounded-xl border-2 px-4 py-2 ${selected ? 'border-primary-strong bg-primary/10' : 'border-border bg-background active:bg-surface'}`}
    >
      <Icon
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={24}
        color={selected ? colors['primary-strong'] : colors['border-strong']}
      />
      <View className="flex-1">
        <HighlightedText
          text={title}
          term={search}
          className="font-sans-semibold text-base text-foreground"
        />
        {subtitle ? (
          <HighlightedText text={subtitle} term={search} className="font-sans text-sm text-muted" />
        ) : null}
      </View>
    </Pressable>
  );
}

function Step({
  number,
  title,
  summary,
  onChange,
  children,
}: {
  number: number;
  title: string;
  summary?: string;
  onChange?: () => void;
  children?: ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View
          className={`size-8 items-center justify-center rounded-full ${summary ? 'bg-success' : 'bg-foreground'}`}
        >
          {summary ? (
            <Icon name="checkmark" size={18} color={colors['on-success']} />
          ) : (
            <Text className="font-sans-bold text-sm text-background">{number}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-lg text-foreground">{title}</Text>
          {summary ? (
            <Text className="font-sans-medium text-base text-muted">{summary}</Text>
          ) : null}
        </View>
        {summary && onChange ? <TextAction label="Cambiar" onPress={onChange} /> : null}
      </View>
      {children ? <View className="gap-2 pl-11">{children}</View> : null}
    </View>
  );
}

export function NewServiceDialog({ form, technicianId, onClose, onStart }: NewServiceDialogProps) {
  const allClients = useClients(technicianId);
  const allBranches = useBranches(technicianId);
  const allSystems = useSystems(technicianId);
  const [selection, setSelection] = useState<ServiceSelection>({});
  const [editing, setEditing] = useState<'client' | 'branch' | null>('client');
  const [search, setSearch] = useState('');
  const [addingBranch, setAddingBranch] = useState(false);
  const choices = serviceChoices(allClients, allBranches, allSystems, selection);
  const client = choices.clients.find((item) => item.id === choices.clientId);
  const branch = choices.branches.find((item) => item.id === choices.branchId);
  const pickingClient = !client || editing === 'client';
  const pickingBranch = Boolean(client) && (!branch || editing === 'branch');
  const shownClients = choices.clients.filter((item) => matchesSearch(item.name, search));

  function chooseClient(id: string) {
    setSelection({ clientId: id });
    setEditing(null);
    setSearch('');
  }

  function chooseBranch(id: string) {
    setSelection({ ...selection, branchId: id, systemId: null });
    setEditing(null);
  }

  function addBranch(details: BranchDetails) {
    if (!client) return;
    createBranch(technicianId, client.id, details);
    setAddingBranch(false);
    setEditing(null);
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
        wide
        submitLabel="Comenzar servicio"
        submitIcon="arrow-forward"
        submitDisabled={!choices.ready}
        onSubmit={start}
        onClose={onClose}
      >
        <View className="gap-6">
          <Step
            number={1}
            title="Cliente"
            summary={pickingClient ? undefined : client?.name}
            onChange={() => setEditing('client')}
          >
            {pickingClient ? (
              <>
                {choices.clients.length > searchThreshold ? (
                  <SearchField
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar cliente"
                  />
                ) : null}
                {shownClients.length === 0 ? (
                  <Text className="py-2 font-sans text-base text-muted">
                    No hay clientes que coincidan con «{search.trim()}».
                  </Text>
                ) : null}
                {shownClients.map((item) => (
                  <ChoiceRow
                    key={item.id}
                    title={item.name}
                    search={search}
                    selected={item.id === choices.clientId}
                    onPress={() => chooseClient(item.id)}
                  />
                ))}
              </>
            ) : null}
          </Step>

          {client ? (
            <Step
              number={2}
              title="Sucursal"
              summary={pickingBranch ? undefined : branch?.name}
              onChange={choices.branches.length > 1 ? () => setEditing('branch') : undefined}
            >
              {pickingBranch ? (
                choices.branches.length === 0 ? (
                  <View className="gap-1">
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
                  choices.branches.map((item) => (
                    <ChoiceRow
                      key={item.id}
                      title={item.name}
                      subtitle={branchPlace(item) || undefined}
                      selected={item.id === choices.branchId}
                      onPress={() => chooseBranch(item.id)}
                    />
                  ))
                )
              ) : null}
            </Step>
          ) : null}

          {branch && !pickingBranch && choices.systems.length > 0 ? (
            <Step number={3} title="Sistema (opcional)">
              <ChoiceRow
                title="Sin sistema"
                subtitle="El formato es general para la sucursal."
                selected={choices.systemId === null}
                onPress={() => setSelection({ ...selection, systemId: null })}
              />
              {choices.systems.map((item) => (
                <ChoiceRow
                  key={item.id}
                  title={item.name}
                  subtitle={[systemTypeLabels[item.system_type], item.location]
                    .filter(Boolean)
                    .join(' · ')}
                  selected={item.id === choices.systemId}
                  onPress={() => setSelection({ ...selection, systemId: item.id })}
                />
              ))}
            </Step>
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
