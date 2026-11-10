import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema, toSearchText } from '@nimzo/shared';
import { useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useWindowDimensions, View, type TextInputInstance } from 'react-native';
import type { ClientDetails, LocalClient } from '@/clients/clients-db';
import { FormDialog } from '@/components/form-dialog';
import { FormGroup } from '@/components/form-group';
import { FormTextField } from '@/components/form-text-field';
import { Notice } from '@/components/notice';

const clientDetailsSchema = clientFormSchema.omit({ is_active: true });

type ClientFormDialogProps = {
  client?: LocalClient;
  otherClients: LocalClient[];
  onSave: (details: ClientDetails) => void;
  onClose: () => void;
};

export function ClientFormDialog({ client, otherClients, onSave, onClose }: ClientFormDialogProps) {
  const twoColumns = useWindowDimensions().width >= 720;
  const taxIdRef = useRef<TextInputInstance>(null);
  const contactNameRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const notesRef = useRef<TextInputInstance>(null);
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    resolver: zodResolver(clientDetailsSchema),
    defaultValues: {
      name: client?.name ?? '',
      tax_id: client?.tax_id ?? '',
      contact_name: client?.contact_name ?? '',
      contact_phone: client?.contact_phone ?? '',
      contact_email: client?.contact_email ?? '',
      notes: client?.notes ?? '',
    },
  });

  const name = toSearchText(useWatch({ control, name: 'name' }).trim());
  const duplicate = name ? otherClients.find((other) => toSearchText(other.name) === name) : null;
  const row = twoColumns ? 'flex-row gap-5' : 'gap-4';
  const cell = twoColumns ? 'flex-1' : '';

  return (
    <FormDialog
      wide
      title={client ? 'Editar cliente' : 'Nuevo cliente'}
      description={
        client
          ? undefined
          : 'Se guarda en esta tablet; después podrás agregar sus sucursales y sistemas.'
      }
      dirty={isDirty}
      discardQuestion={client ? undefined : '¿Descartar este cliente?'}
      submitLabel={client ? 'Guardar cambios' : 'Agregar cliente'}
      submitIcon={client ? undefined : 'add'}
      submitDisabled={Boolean(client) && !isDirty}
      onSubmit={handleSubmit((values) => onSave(values))}
      onClose={onClose}
    >
      <FormGroup title="Empresa">
        <View className={row}>
          <View className={twoColumns ? 'flex-[3]' : ''}>
            <FormTextField
              control={control}
              name="name"
              label="Nombre o razón social"
              placeholder="Ej. Plásticos del Norte"
              autoCapitalize="words"
              autoFocus={!client}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => taxIdRef.current?.focus()}
            />
          </View>
          <View className={twoColumns ? 'flex-[2]' : ''}>
            <FormTextField
              control={control}
              name="tax_id"
              ref={taxIdRef}
              label="RFC (opcional)"
              format={(text) => text.toUpperCase()}
              placeholder="Ej. PNO850101AB1"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={13}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => contactNameRef.current?.focus()}
            />
          </View>
        </View>
        {duplicate ? (
          <Notice
            message={`Ya tienes un cliente llamado “${duplicate.name}”. Revisa que no lo estés agregando dos veces.`}
          />
        ) : null}
      </FormGroup>
      <FormGroup title="Contacto">
        <FormTextField
          control={control}
          name="contact_name"
          ref={contactNameRef}
          label="Persona de contacto"
          placeholder="Quién te recibe en las visitas"
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => phoneRef.current?.focus()}
        />
        <View className={row}>
          <View className={cell}>
            <FormTextField
              control={control}
              name="contact_phone"
              ref={phoneRef}
              label="Teléfono"
              placeholder="Ej. 686 123 4567"
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>
          <View className={cell}>
            <FormTextField
              control={control}
              name="contact_email"
              ref={emailRef}
              label="Correo"
              placeholder="Ej. mantenimiento@empresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => notesRef.current?.focus()}
            />
          </View>
        </View>
      </FormGroup>
      <FormTextField
        control={control}
        name="notes"
        ref={notesRef}
        label="Notas (opcional)"
        placeholder="Horarios de acceso, a quién preguntar, dónde estacionarse…"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </FormDialog>
  );
}
