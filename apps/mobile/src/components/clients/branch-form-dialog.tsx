import { zodResolver } from '@hookform/resolvers/zod';
import { branchFormSchema, mexicanStateLabels, mexicanStates, toSearchText } from '@nimzo/shared';
import { useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text, useWindowDimensions, View, type TextInputInstance } from 'react-native';
import type { BranchDetails, LocalBranch } from '@/clients/branches-db';
import { FormDialog } from '@/components/form-dialog';
import { FormGroup } from '@/components/form-group';
import { FormTextField } from '@/components/form-text-field';
import { Notice } from '@/components/notice';
import { SelectField } from '@/components/select-field';

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
  onToggleActive: (branch: LocalBranch) => void;
  onClose: () => void;
};

export function BranchFormDialog({
  clientName,
  branch,
  siblings,
  onSave,
  onToggleActive,
  onClose,
}: BranchFormDialogProps) {
  const twoColumns = useWindowDimensions().width >= 720;
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

  const name = toSearchText(useWatch({ control, name: 'name' }).trim());
  const duplicate = name ? siblings.find((other) => toSearchText(other.name) === name) : null;
  const row = twoColumns ? 'flex-row gap-5' : 'gap-4';
  const cell = twoColumns ? 'flex-1' : '';

  return (
    <FormDialog
      wide
      title={branch ? 'Editar sucursal' : 'Nueva sucursal'}
      description={`De ${clientName}`}
      dirty={isDirty}
      discardQuestion={branch ? undefined : '¿Descartar esta sucursal?'}
      submitLabel={branch ? 'Guardar cambios' : 'Agregar sucursal'}
      submitIcon={branch ? undefined : 'add'}
      submitDisabled={Boolean(branch) && !isDirty}
      secondaryAction={
        branch
          ? {
              label: branch.isActive ? 'Desactivar sucursal' : 'Reactivar sucursal',
              icon: branch.isActive ? 'archive-outline' : 'refresh-outline',
              tone: branch.isActive ? 'destructive' : 'primary',
              onPress: () => onToggleActive(branch),
            }
          : undefined
      }
      onSubmit={handleSubmit((values) => onSave(values))}
      onClose={onClose}
    >
      <FormGroup title="Ubicación">
        <FormTextField
          control={control}
          name="name"
          label="Nombre de la sucursal"
          placeholder="Ej. Planta Apodaca"
          autoCapitalize="words"
          autoFocus={!branch}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => addressRef.current?.focus()}
        />
        {duplicate ? (
          <Notice message={`${clientName} ya tiene una sucursal llamada “${duplicate.name}”.`} />
        ) : null}
        <FormTextField
          control={control}
          name="address"
          ref={addressRef}
          label="Dirección"
          placeholder="Calle, número y colonia"
          autoCapitalize="sentences"
          autoComplete="street-address"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => cityRef.current?.focus()}
        />
        <View className={row}>
          <View className={cell}>
            <FormTextField
              control={control}
              name="city"
              ref={cityRef}
              label="Ciudad"
              placeholder="Ej. Monterrey"
              autoCapitalize="words"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => contactNameRef.current?.focus()}
            />
          </View>
          <View className={cell}>
            <Controller
              control={control}
              name="state"
              render={({ field, fieldState }) => (
                <SelectField
                  label="Estado"
                  value={field.value ?? null}
                  options={stateOptions}
                  onChange={field.onChange}
                  placeholder="Selecciona el estado"
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>
        </View>
      </FormGroup>
      <FormGroup title="Contacto en la sucursal">
        <FormTextField
          control={control}
          name="contact_name"
          ref={contactNameRef}
          label="Persona de contacto (opcional)"
          placeholder="Ej. responsable de mantenimiento"
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
              label="Teléfono (opcional)"
              placeholder="Ej. 81 1234 5678"
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
              label="Correo para reportes (opcional)"
              placeholder="Ej. planta@empresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        </View>
        <Text className="font-sans text-base text-muted">
          Los reportes de esta sucursal se enviarán a este correo.
        </Text>
      </FormGroup>
    </FormDialog>
  );
}
