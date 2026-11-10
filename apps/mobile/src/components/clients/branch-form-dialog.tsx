import { zodResolver } from '@hookform/resolvers/zod';
import { branchFormSchema, mexicanStateLabels, mexicanStates, toSearchText } from '@nimzo/shared';
import { useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type TextInputInstance,
} from 'react-native';
import type { BranchDetails, LocalBranch } from '@/clients/branches-db';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { Icon } from '@/components/icon';
import { SelectField } from '@/components/select-field';
import { TextField } from '@/components/text-field';
import { useKeyboardVisible } from '@/lib/use-keyboard-visible';
import { colors } from '@/theme';

const branchDetailsSchema = branchFormSchema.omit({ is_active: true });

const stateOptions = mexicanStates.map((code) => ({
  value: code,
  label: mexicanStateLabels[code],
}));

type BranchFormDialogProps = {
  clientName: string;
  branch?: LocalBranch;
  siblings: LocalBranch[];
  onSave: (details: BranchDetails) => void;
  onToggleActive?: () => void;
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

export function BranchFormDialog({
  clientName,
  branch,
  siblings,
  onSave,
  onToggleActive,
  onClose,
}: BranchFormDialogProps) {
  const { width, height } = useWindowDimensions();
  const compact = height < 800;
  const twoColumns = width >= 720;
  const keyboardVisible = useKeyboardVisible();
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const addressRef = useRef<TextInputInstance>(null);
  const cityRef = useRef<TextInputInstance>(null);
  const contactNameRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    resolver: zodResolver(branchDetailsSchema),
    defaultValues: {
      name: branch?.name ?? '',
      address: branch?.address ?? '',
      city: branch?.city ?? '',
      state: branch?.state ?? null,
      contact_name: branch?.contact_name ?? '',
      contact_phone: branch?.contact_phone ?? '',
      contact_email: branch?.contact_email ?? '',
    },
  });

  const name = useWatch({ control, name: 'name' });
  const normalizedName = toSearchText(name.trim());
  const duplicate = normalizedName
    ? siblings.find((other) => toSearchText(other.name) === normalizedName)
    : undefined;

  const onSubmit = handleSubmit((values) => onSave(values));

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
          contentContainerClassName={`grow items-center p-8 ${keyboardVisible ? 'justify-start' : 'justify-center'}`}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className={`w-full max-w-[760px] rounded-3xl bg-background ${compact ? 'gap-5 p-6' : 'gap-7 p-8'}`}
          >
            <DialogHeader
              title={branch ? 'Editar sucursal' : 'Nueva sucursal'}
              description={`De ${clientName}`}
              onClose={handleClose}
            />
            <FormGroup title="Ubicación">
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Nombre de la sucursal"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="Ej. Planta Apodaca"
                    autoCapitalize="words"
                    autoFocus={!branch}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => addressRef.current?.focus()}
                  />
                )}
              />
              {duplicate ? (
                <View className="flex-row items-start gap-3 rounded-lg bg-accent/25 px-4 py-3">
                  <Icon name="information-circle-outline" size={22} color={colors.foreground} />
                  <Text className="flex-1 font-sans text-base text-foreground">
                    {clientName} ya tiene una sucursal llamada “{duplicate.name}”.
                  </Text>
                </View>
              ) : null}
              <Controller
                control={control}
                name="address"
                render={({ field, fieldState }) => (
                  <TextField
                    ref={addressRef}
                    label="Dirección (opcional)"
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    placeholder="Calle, número y colonia"
                    autoCapitalize="sentences"
                    autoComplete="street-address"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => cityRef.current?.focus()}
                  />
                )}
              />
              <View className={row}>
                <View className={cell}>
                  <Controller
                    control={control}
                    name="city"
                    render={({ field, fieldState }) => (
                      <TextField
                        ref={cityRef}
                        label="Ciudad (opcional)"
                        value={field.value ?? ''}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        placeholder="Ej. Monterrey"
                        autoCapitalize="words"
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => contactNameRef.current?.focus()}
                      />
                    )}
                  />
                </View>
                <View className={cell}>
                  <Controller
                    control={control}
                    name="state"
                    render={({ field }) => (
                      <SelectField
                        label="Estado (opcional)"
                        value={field.value ?? null}
                        options={stateOptions}
                        onChange={field.onChange}
                        placeholder="Selecciona el estado"
                      />
                    )}
                  />
                </View>
              </View>
            </FormGroup>
            <FormGroup title="Contacto en la sucursal">
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
                    placeholder="Quién te recibe en esta sucursal"
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
                        placeholder="Ej. 81 1234 5678"
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
                        label="Correo para reportes (opcional)"
                        value={field.value ?? ''}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        placeholder="Ej. planta@empresa.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                        returnKeyType="done"
                      />
                    )}
                  />
                </View>
              </View>
              <Text className="font-sans text-base text-muted">
                A este correo se enviarán los reportes de los servicios en esta sucursal.
              </Text>
            </FormGroup>
            {confirmingDiscard ? (
              <View className="gap-4">
                <Text className="font-sans-medium text-lg text-foreground">
                  {branch ? '¿Descartar los cambios que hiciste?' : '¿Descartar esta sucursal?'}
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
              <View className="gap-4">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button variant="secondary" label="Cancelar" onPress={handleClose} />
                  </View>
                  <View className="flex-1">
                    <Button
                      label={branch ? 'Guardar cambios' : 'Agregar sucursal'}
                      variant="success"
                      icon={branch ? undefined : 'add'}
                      onPress={onSubmit}
                      disabled={Boolean(branch) && !isDirty}
                    />
                  </View>
                </View>
                {branch && onToggleActive ? (
                  <Pressable
                    onPress={onToggleActive}
                    accessibilityRole="button"
                    className="min-h-14 flex-row items-center justify-center gap-2 self-center rounded-lg px-4 active:bg-border"
                  >
                    <Icon
                      name={branch.isActive ? 'archive-outline' : 'refresh-outline'}
                      size={22}
                      color={branch.isActive ? colors.destructive : colors['primary-strong']}
                    />
                    <Text
                      className={`font-sans-semibold text-base ${branch.isActive ? 'text-destructive' : 'text-primary-strong'}`}
                    >
                      {branch.isActive ? 'Desactivar sucursal' : 'Reactivar sucursal'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
