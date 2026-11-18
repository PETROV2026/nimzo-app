import { zodResolver } from '@hookform/resolvers/zod';
import { systemFormSchema, systemTypeLabels, toSearchText, type SystemType } from '@nimzo/shared';
import { useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useWindowDimensions, View, type TextInputInstance } from 'react-native';
import type { LocalSystem, SystemDetails } from '@/clients/systems-db';
import { FormDialog } from '@/components/form-dialog';
import { FormTextField } from '@/components/form-text-field';
import { Notice } from '@/components/notice';
import { SelectField } from '@/components/select-field';

const systemDetailsSchema = systemFormSchema.omit({ is_active: true });

const typeOptions = (Object.keys(systemTypeLabels) as SystemType[]).map((code) => ({
  value: code,
  label: systemTypeLabels[code],
}));

type SystemFormDialogProps = {
  branchName: string;
  system?: LocalSystem;
  siblings: LocalSystem[];
  onSave: (details: SystemDetails) => void;
  onToggleActive: (system: LocalSystem) => void;
  onClose: () => void;
};

export function SystemFormDialog({
  branchName,
  system,
  siblings,
  onSave,
  onToggleActive,
  onClose,
}: SystemFormDialogProps) {
  const twoColumns = useWindowDimensions().width >= 720;
  const locationRef = useRef<TextInputInstance>(null);
  const notesRef = useRef<TextInputInstance>(null);
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    resolver: zodResolver(systemDetailsSchema),
    defaultValues: {
      system_type: system?.system_type ?? ('' as SystemType),
      name: system?.name ?? '',
      location: system?.location ?? '',
      notes: system?.notes ?? '',
    },
  });

  const name = toSearchText(useWatch({ control, name: 'name' }).trim());
  const duplicate = name ? siblings.find((other) => toSearchText(other.name) === name) : null;

  return (
    <FormDialog
      wide
      title={system ? 'Editar sistema' : 'Nuevo sistema'}
      description={`En ${branchName}`}
      dirty={isDirty}
      discardQuestion={system ? undefined : '¿Descartar este sistema?'}
      submitLabel={system ? 'Guardar cambios' : 'Agregar sistema'}
      submitIcon={system ? undefined : 'add'}
      submitDisabled={Boolean(system) && !isDirty}
      secondaryAction={
        system
          ? {
              label: system.isActive ? 'Desactivar sistema' : 'Reactivar sistema',
              icon: system.isActive ? 'archive-outline' : 'refresh-outline',
              tone: system.isActive ? 'destructive' : 'primary',
              onPress: () => onToggleActive(system),
            }
          : undefined
      }
      onSubmit={handleSubmit((values) => onSave(values))}
      onClose={onClose}
    >
      <View className={twoColumns ? 'flex-row gap-5' : 'gap-4'}>
        <View className={twoColumns ? 'flex-1' : ''}>
          <Controller
            control={control}
            name="system_type"
            render={({ field, fieldState }) => (
              <SelectField
                label="Tipo de sistema"
                value={field.value || null}
                options={typeOptions}
                onChange={field.onChange}
                placeholder="Selecciona el tipo"
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
        <View className={twoColumns ? 'flex-1' : ''}>
          <FormTextField
            control={control}
            name="name"
            label="Nombre"
            placeholder="Ej. Bomba principal"
            autoCapitalize="sentences"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => locationRef.current?.focus()}
          />
        </View>
      </View>
      {duplicate ? (
        <Notice message={`${branchName} ya tiene un sistema llamado “${duplicate.name}”.`} />
      ) : null}
      <FormTextField
        control={control}
        name="location"
        ref={locationRef}
        label="Ubicación (opcional)"
        placeholder="Ej. Cuarto de bombas, planta baja"
        autoCapitalize="sentences"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => notesRef.current?.focus()}
      />
      <FormTextField
        control={control}
        name="notes"
        ref={notesRef}
        label="Notas (opcional)"
        placeholder="Ej. marca, modelo o número de serie"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </FormDialog>
  );
}
