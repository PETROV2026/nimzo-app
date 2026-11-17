import { zodResolver } from '@hookform/resolvers/zod';
import { mexicanStateLabels, mexicanStates, userEditSchema } from '@nimzo/shared';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View, type TextInputInstance } from 'react-native';
import { useSession, type Profile } from '@/auth/session-provider';
import { FormDialog } from '@/components/form-dialog';
import { FormTextField } from '@/components/form-text-field';
import { SelectField } from '@/components/select-field';

const profileEditSchema = userEditSchema.omit({ role: true });

const stateOptions = mexicanStates.map((code) => ({
  value: code,
  label: mexicanStateLabels[code],
}));

type EditProfileDialogProps = {
  profile: Profile;
  onClose: () => void;
  onSaved: () => void;
};

export function EditProfileDialog({ profile, onClose, onSaved }: EditProfileDialogProps) {
  const { updateProfile } = useSession();
  const [error, setError] = useState<string | null>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const cityRef = useRef<TextInputInstance>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      full_name: profile.fullName,
      phone: profile.phone ?? '',
      state: profile.state,
      city: profile.city ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await updateProfile({
      fullName: values.full_name,
      phone: values.phone ?? null,
      state: values.state,
      city: values.city ?? null,
    });
    if (result) {
      setError(result);
      return;
    }
    onSaved();
    onClose();
  });

  return (
    <FormDialog
      title="Editar tus datos"
      description="Aparecen junto a tu firma en cada reporte que envías."
      dirty={isDirty}
      submitLabel="Guardar cambios"
      submitDisabled={!isDirty}
      submitting={isSubmitting}
      error={error}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <FormTextField
        control={control}
        name="full_name"
        label="Nombre completo"
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => phoneRef.current?.focus()}
        editable={!isSubmitting}
      />
      <FormTextField
        control={control}
        name="phone"
        ref={phoneRef}
        label="Teléfono (opcional)"
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="Ej. 686 123 4567"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => cityRef.current?.focus()}
        editable={!isSubmitting}
      />
      <View className="flex-row gap-5">
        <View className="flex-1">
          <FormTextField
            control={control}
            name="city"
            ref={cityRef}
            label="Ciudad (opcional)"
            autoCapitalize="words"
            autoComplete="address-line2"
            placeholder="Ej. Mexicali"
            returnKeyType="done"
            editable={!isSubmitting}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="state"
            render={({ field }) => (
              <SelectField
                label="Estado (opcional)"
                value={field.value ?? null}
                options={stateOptions}
                onChange={field.onChange}
                placeholder="Selecciona tu estado"
                disabled={isSubmitting}
              />
            )}
          />
        </View>
      </View>
    </FormDialog>
  );
}
