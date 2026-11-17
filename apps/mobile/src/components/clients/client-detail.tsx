import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import type { LocalBranch } from '@/clients/branches-db';
import type { LocalClient } from '@/clients/clients-db';
import { Button } from '@/components/button';
import { ClientBranches } from '@/components/clients/client-branches';
import { Icon } from '@/components/icon';
import { InactiveBadge } from '@/components/inactive-badge';
import { TextAction } from '@/components/text-action';
import { colors } from '@/theme';

type ClientDetailProps = {
  client: LocalClient;
  branches: LocalBranch[];
  onBack: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onAddBranch: () => void;
  onOpenBranch: (branch: LocalBranch) => void;
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
  onBack,
  onEdit,
  onToggleActive,
  onAddBranch,
  onOpenBranch,
}: ClientDetailProps) {
  const phone = client.contact_phone?.replace(/[^\d+]/g, '') ?? '';
  const status = [client.syncedAt ? null : 'Pendiente de sincronizar'].filter(Boolean);

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="gap-8 p-6 pb-10">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Volver a tus clientes"
        className="-mb-4 -ml-2 min-h-14 flex-row items-center gap-2 self-start rounded-lg px-2 active:bg-border"
      >
        <Icon name="arrow-back" size={24} color={colors.foreground} />
        <Text className="font-sans-medium text-lg text-foreground">Clientes</Text>
      </Pressable>

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
            {[client.tax_id, ...status].filter(Boolean).join('. ')}
          </Text>
          {client.isActive ? null : (
            <View className="pt-1">
              <InactiveBadge />
            </View>
          )}
        </View>
        <View importantForAccessibility="no-hide-descendants" className="pt-1">
          <Icon name="business-outline" size={48} color={colors['border-strong']} />
        </View>
      </View>

      {client.isActive ? null : (
        <Text className="-mt-4 font-sans text-base text-foreground">
          Este cliente está inactivo y no aparece al vincular notas. Su información se conserva.
        </Text>
      )}

      <View className="gap-3">
        <View className="min-h-14 flex-row items-center justify-between gap-3">
          <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
            Datos de la empresa
          </Text>
          <TextAction
            label="Editar datos"
            icon="create-outline"
            accessibilityLabel="Editar datos de la empresa"
            onPress={onEdit}
          />
        </View>
        <View className="overflow-hidden rounded-xl border border-border bg-background">
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

      <ClientBranches
        branches={branches}
        canAdd={client.isActive}
        onAdd={onAddBranch}
        onOpen={onOpenBranch}
      />

      <View className="flex-row flex-wrap items-center justify-between gap-4">
        <Text className="font-sans text-base text-muted">
          Agregado el {dateFormat.format(new Date(client.createdAt))}
        </Text>
        <View className="min-w-[240px]">
          <Button
            label={client.isActive ? 'Desactivar cliente' : 'Reactivar cliente'}
            icon={client.isActive ? 'archive-outline' : 'refresh-outline'}
            variant={client.isActive ? 'destructive-outline' : 'secondary'}
            onPress={onToggleActive}
          />
        </View>
      </View>
    </ScrollView>
  );
}
