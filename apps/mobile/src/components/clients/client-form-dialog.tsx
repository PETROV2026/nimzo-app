import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema, toSearchText } from '@nimzo/shared';
import { useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type TextInputInstance,
} from 'react-native';
import type { ClientDetails, LocalClient } from '@/clients/clients-db';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { Icon } from '@/components/icon';
import { TextField } from '@/components/text-field';
import { colors } from '@/theme';

const clientDetailsSchema = clientFormSchema.omit({ is_active: true });

type ClientFormDialogProps = {
  client?: LocalClient;
  otherClients: LocalClient[];
  onSave: (details: ClientDetails) => void;
  onClose: () => void;
};

function FormGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="font-sans-semibold text-lg text-muted">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function ClientFormDialog({ client, otherClients, onSave, onClose }: ClientFormDialogProps) {
  const { width, height } = useWindowDimensions();
  const compact = height < 800;
  const twoColumns = width >= 720;
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
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

  const name = useWatch({ control, name: 'name' });
  const normalizedName = toSearchText(name.trim());
  const duplicate = normalizedName
    ? otherClients.find((other) => toSearchText(other.name) === normalizedName)
    : undefined;

  const onSubmit = handleSubmit((values) => {
    onSave(values);
  });

  function handleClose() {
    if (isDirty && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  }

  const row = twoColumns ? 'flex-row gap-5' : 'gap-4';
  const cell = twoColumns ? 'flex-1' : '';

  return (
    <Modal transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 bg-foreground/40">
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow items-center justify-center p-8"
          keyboardShouldPersistTaps="handled"
        >
          <View
            className={`w-full max-w-[760px] rounded-3xl bg-background ${compact ? 'gap-5 p-6' : 'gap-7 p-8'}`}
          >
            <DialogHeader
              title={client ? 'Editar cliente' : 'Nuevo cliente'}
              description={
                client
                  ? undefined
                  : 'Se guarda en esta tablet; después podrás agregar sus sucursales y sistemas.'
              }
              onClose={handleClose}
            />
            <FormGroup title="Empresa">
              <View className={row}>
                <View className={twoColumns ? 'flex-[3]' : ''}>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <TextField
                        label="Nombre o razón social"
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        placeholder="Ej. Plásticos del Norte"
                        autoCapitalize="words"
                        autoFocus={!client}
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => taxIdRef.current?.focus()}
                      />
                    )}
                  />
                </View>
                <View className={twoColumns ? 'flex-[2]' : ''}>
                  <Controller
                    control={control}
                    name="tax_id"
                    render={({ field, fieldState }) => (
                      <TextField
                        ref={taxIdRef}
                        label="RFC (opcional)"
                        value={field.value ?? ''}
                        onChangeText={(text) => field.onChange(text.toUpperCase())}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        placeholder="Ej. PNO850101AB1"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={13}
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => contactNameRef.current?.focus()}
                      />
                    )}
                  />
                </View>
              </View>
              {duplicate ? (
                <View className="flex-row items-start gap-3 rounded-lg bg-accent/25 px-4 py-3">
                  <Icon name="information-circle-outline" size={22} color={colors.foreground} />
                  <Text className="flex-1 font-sans text-base text-foreground">
                    Ya tienes un cliente llamado “{duplicate.name}”. Revisa que no lo estés
                    agregando dos veces.
                  </Text>
                </View>
              ) : null}
            </FormGroup>
            <FormGroup title="Contacto">
              <Controller
                control={control}
                name="contact_name"
                render={({ field, fieldState }) => (
                  <TextField
                    ref={contactNameRef}
                    label="Persona de contacto (opcional)"
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="Quién te recibe en las visitas"
                    autoCapitalize="words"
                    autoComplete="name"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                  />
                )}
              />
              <View className={row}>
                <View className={cell}>
                  <Controller
                    control={control}
                    name="contact_phone"
                    render={({ field, fieldState }) => (
                      <TextField
                        ref={phoneRef}
                        label="Teléfono (opcional)"
                        value={field.value ?? ''}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        placeholder="Ej. 686 123 4567"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => emailRef.current?.focus()}
                      />
                    )}
                  />
                </View>
                <View className={cell}>
                  <Controller
                    control={control}
                    name="contact_email"
                    render={({ field, fieldState }) => (
                      <TextField
                        ref={emailRef}
                        label="Correo (opcional)"
                        value={field.value ?? ''}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        placeholder="Ej. mantenimiento@empresa.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => notesRef.current?.focus()}
                      />
                    )}
                  />
                </View>
              </View>
            </FormGroup>
            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <TextField
                  ref={notesRef}
                  label="Notas (opcional)"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="Horarios de acceso, a quién preguntar, dónde estacionarse…"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />
            {confirmingDiscard ? (
              <View className="gap-4">
                <Text className="font-sans-medium text-lg text-foreground">
                  {client ? '¿Descartar los cambios que hiciste?' : '¿Descartar este cliente?'}
                </Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button
                      variant="secondary"
                      label="Seguir editando"
                      onPress={() => setConfirmingDiscard(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button variant="destructive" label="Descartar" onPress={onClose} />
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button variant="secondary" label="Cancelar" onPress={handleClose} />
                </View>
                <View className="flex-1">
                  <Button
                    label={client ? 'Guardar cambios' : 'Agregar cliente'}
                    variant="success"
                    icon={client ? undefined : 'add'}
                    onPress={onSubmit}
                    disabled={Boolean(client) && !isDirty}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
