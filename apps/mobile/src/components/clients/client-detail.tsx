import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import type { LocalClient } from '@/clients/clients-db';
import { Button } from '@/components/button';
import { ClientMonogram } from '@/components/clients/client-monogram';
import { Icon, type IconName } from '@/components/icon';
import { colors } from '@/theme';

type ClientDetailProps = {
  client: LocalClient;
  showBack: boolean;
  onBack: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
};

const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' });

type ContactLineProps = {
  icon: IconName;
  label: string;
  value: string | null;
  missing: string;
  action?: { url: string; label: string };
};

function ContactLine({ icon, label, value, missing, action }: ContactLineProps) {
  const content = (
    <>
      <View className="h-11 w-11 items-center justify-center rounded-full bg-surface">
        <Icon name={icon} size={22} color={value ? colors.foreground : colors['border-strong']} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-sans text-sm text-muted">{label}</Text>
        <Text
          selectable={Boolean(value)}
          className={`text-lg ${value ? 'font-sans-medium text-foreground' : 'font-sans text-muted'}`}
        >
          {value ?? missing}
        </Text>
      </View>
      {action ? <Icon name="open-outline" size={20} color={colors['primary-strong']} /> : null}
    </>
  );

  if (!value || !action) {
    return <View className="min-h-16 flex-row items-center gap-4 px-5 py-2">{content}</View>;
  }
  return (
    <Pressable
      onPress={() => Linking.openURL(action.url)}
      accessibilityRole="link"
      accessibilityLabel={`${action.label} ${value}`}
      className="min-h-16 flex-row items-center gap-4 px-5 py-2 active:bg-surface"
    >
      {content}
    </Pressable>
  );
}

export function ClientDetail({
  client,
  showBack,
  onBack,
  onEdit,
  onToggleActive,
}: ClientDetailProps) {
  const phone = client.contact_phone?.replace(/[^\d+]/g, '');

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="gap-6 p-6 pb-10">
      {showBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver a tus clientes"
          className="-ml-2 min-h-14 flex-row items-center gap-2 self-start rounded-lg px-2 active:bg-border"
        >
          <Icon name="arrow-back" size={24} color={colors.foreground} />
          <Text className="font-sans-medium text-lg text-foreground">Clientes</Text>
        </Pressable>
      ) : null}

      <View className="flex-row flex-wrap items-center gap-5">
        <ClientMonogram name={client.name} active={client.isActive} size="lg" />
        <View className="min-w-[240px] flex-1 gap-1">
          <Text
            accessibilityRole="header"
            selectable
            className="font-sans-bold text-3xl text-foreground"
          >
            {client.name}
          </Text>
          <View className="flex-row flex-wrap items-center gap-3">
            <Text selectable className="font-sans-medium text-lg text-muted">
              {client.tax_id ? `RFC ${client.tax_id}` : 'Sin RFC'}
            </Text>
            {client.isActive ? null : (
              <View className="rounded-full bg-border px-3 py-1">
                <Text className="font-sans-semibold text-sm text-muted">Inactivo</Text>
              </View>
            )}
          </View>
        </View>
        <View className="min-w-[180px]">
          <Button label="Editar" variant="secondary" icon="create-outline" onPress={onEdit} />
        </View>
      </View>

      {client.isActive ? null : (
        <View className="flex-row items-start gap-3 rounded-2xl bg-border/60 px-5 py-4">
          <Icon name="archive-outline" size={22} color={colors.muted} />
          <Text className="flex-1 font-sans text-base text-foreground">
            Este cliente está inactivo y ya no aparece al ligar notas. Sus datos se conservan;
            puedes reactivarlo cuando vuelvas a darle servicio.
          </Text>
        </View>
      )}

      <View className="gap-3">
        <Text accessibilityRole="header" className="px-1 font-sans-semibold text-lg text-muted">
          Contacto
        </Text>
        <View className="overflow-hidden rounded-2xl bg-background">
          <ContactLine
            icon="person-outline"
            label="Persona de contacto"
            value={client.contact_name}
            missing="Sin registrar"
          />
          <View className="mx-5 h-px bg-border" />
          <ContactLine
            icon="call-outline"
            label="Teléfono"
            value={client.contact_phone}
            missing="Sin registrar"
            action={phone ? { url: `tel:${phone}`, label: 'Llamar a' } : undefined}
          />
          <View className="mx-5 h-px bg-border" />
          <ContactLine
            icon="mail-outline"
            label="Correo"
            value={client.contact_email}
            missing="Sin registrar"
            action={
              client.contact_email
                ? { url: `mailto:${client.contact_email}`, label: 'Escribir a' }
                : undefined
            }
          />
        </View>
      </View>

      <View className="gap-3">
        <Text accessibilityRole="header" className="px-1 font-sans-semibold text-lg text-muted">
          Notas
        </Text>
        <View className="rounded-2xl bg-background px-5 py-4">
          <Text
            selectable={Boolean(client.notes)}
            className={`text-lg ${client.notes ? 'font-sans text-foreground' : 'font-sans text-muted'}`}
          >
            {client.notes ?? 'Sin notas. Usa Editar para anotar horarios de acceso o indicaciones.'}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <Text className="font-sans text-base text-muted">
          Agregado el {dateFormat.format(new Date(client.createdAt))}
        </Text>
        <Pressable
          onPress={onToggleActive}
          accessibilityRole="button"
          className="min-h-14 flex-row items-center gap-2 rounded-lg px-4 active:bg-border"
        >
          <Icon
            name={client.isActive ? 'archive-outline' : 'refresh-outline'}
            size={22}
            color={client.isActive ? colors.destructive : colors['primary-strong']}
          />
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
