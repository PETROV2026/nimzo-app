import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import type { LocalBranch } from '@/clients/branches-db';
import type { LocalClient } from '@/clients/clients-db';
import { Button } from '@/components/button';
import { ClientBranches } from '@/components/clients/client-branches';
import { Icon } from '@/components/icon';
import { colors } from '@/theme';

type ClientDetailProps = {
  client: LocalClient;
  branches: LocalBranch[];
  showBack: boolean;
  onBack: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onAddBranch: () => void;
  onEditBranch: (branch: LocalBranch) => void;
};

const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' });

function Field({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <View
      className={`min-h-14 flex-row flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3 ${last ? '' : 'border-b border-border'}`}
    >
      <Text className="w-48 font-sans text-base text-muted">{label}</Text>
      <View className="min-w-[200px] flex-1">{children}</View>
    </View>
  );
}

function Value({ value }: { value: string | null }) {
  return value ? (
    <Text selectable className="font-sans-medium text-lg text-foreground">
      {value}
    </Text>
  ) : (
    <Text className="font-sans text-lg text-muted">—</Text>
  );
}

function LinkValue({ value, url, label }: { value: string | null; url: string; label: string }) {
  if (!value) return <Value value={null} />;
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={`${label} ${value}`}
      className="-my-3 min-h-14 justify-center self-start"
    >
      <Text className="font-sans-medium text-lg text-primary-strong underline">{value}</Text>
    </Pressable>
  );
}

export function ClientDetail({
  client,
  branches,
  showBack,
  onBack,
  onEdit,
  onToggleActive,
  onAddBranch,
  onEditBranch,
}: ClientDetailProps) {
  const phone = client.contact_phone?.replace(/[^\d+]/g, '') ?? '';
  const status = [
    client.isActive ? null : 'Inactivo',
    client.syncedAt ? null : 'Sin subir a la nube',
  ].filter(Boolean);

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="gap-8 p-6 pb-10">
      {showBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver a tus clientes"
          className="-mb-4 -ml-2 min-h-14 flex-row items-center gap-2 self-start rounded-lg px-2 active:bg-border"
        >
          <Icon name="arrow-back" size={24} color={colors.foreground} />
          <Text className="font-sans-medium text-lg text-foreground">Clientes</Text>
        </Pressable>
      ) : null}

      <View className="flex-row flex-wrap items-start justify-between gap-4">
        <View className="min-w-[260px] flex-1 gap-1">
          <Text
            accessibilityRole="header"
            selectable
            className={`font-sans-bold text-3xl ${client.isActive ? 'text-foreground' : 'text-muted'}`}
          >
            {client.name}
          </Text>
          <Text className="font-sans text-lg text-muted">
            {[client.tax_id ? `RFC ${client.tax_id}` : 'Sin RFC', ...status].join('. ')}
          </Text>
        </View>
        <View className="min-w-[160px]">
          <Button label="Editar" variant="secondary" onPress={onEdit} />
        </View>
      </View>

      {client.isActive ? null : (
        <Text className="-mt-4 font-sans text-base text-foreground">
          Este cliente está inactivo y ya no aparece al ligar notas. Sus datos se conservan.
        </Text>
      )}

      <ClientBranches
        branches={branches}
        canAdd={client.isActive}
        onAdd={onAddBranch}
        onEdit={onEditBranch}
      />

      <View className="gap-3">
        <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
          Datos de la empresa
        </Text>
        <View className="overflow-hidden rounded-xl border border-border bg-background">
          <Field label="Razón social">
            <Value value={client.name} />
          </Field>
          <Field label="RFC">
            <Value value={client.tax_id} />
          </Field>
          <Field label="Persona de contacto">
            <Value value={client.contact_name} />
          </Field>
          <Field label="Teléfono">
            <LinkValue value={client.contact_phone} url={`tel:${phone}`} label="Llamar a" />
          </Field>
          <Field label="Correo">
            <LinkValue
              value={client.contact_email}
              url={`mailto:${client.contact_email ?? ''}`}
              label="Escribir a"
            />
          </Field>
          <Field label="Notas" last>
            <Value value={client.notes} />
          </Field>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-4">
        <Text className="font-sans text-base text-muted">
          Agregado el {dateFormat.format(new Date(client.createdAt))}
        </Text>
        <Pressable
          onPress={onToggleActive}
          accessibilityRole="button"
          className="min-h-14 justify-center rounded-lg px-3 active:bg-border"
        >
          <Text
            className={`font-sans-semibold text-base ${client.isActive ? 'text-destructive' : 'text-primary-strong'}`}
          >
            {client.isActive ? 'Desactivar cliente' : 'Reactivar cliente'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
