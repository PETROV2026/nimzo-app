import { MaterialIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { mexicanStateLabels, mexicanStates, userEditSchema } from '@nimzo/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSession, type Profile } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { SelectField } from '@/components/select-field';
import { TextField } from '@/components/text-field';
import { colors } from '@/theme/colors';

const profileEditSchema = userEditSchema.omit({ role: true });

const stateOptions = mexicanStates.map((code) => ({
  value: code,
  label: mexicanStateLabels[code],
}));

type EditProfileDialogProps = {
  profile: Profile;
  onClose: () => void;
};

export function EditProfileDialog({ profile, onClose }: EditProfileDialogProps) {
  const { updateProfile } = useSession();
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
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
    onClose();
  });

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-foreground/40 p-8">
        <View className="w-full max-w-[520px] gap-5 rounded-2xl bg-background p-6">
          <View className="flex-row items-center justify-between">
            <Text accessibilityRole="header" className="font-sans-semibold text-xl text-foreground">
              Editar información del usuario
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="min-h-12 min-w-12 items-center justify-center"
            >
              <MaterialIcons name="close" size={24} color={colors.muted} />
            </Pressable>
          </View>
          <Controller
            control={control}
            name="full_name"
            render={({ field, fieldState }) => (
              <TextField
                label="Nombre completo"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isSubmitting}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <TextField
                label="Teléfono"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholder="Ej. 686 123 4567"
                editable={!isSubmitting}
              />
            )}
          />
          <Controller
            control={control}
            name="state"
            render={({ field }) => (
              <SelectField
                label="Estado"
                value={field.value ?? null}
                options={stateOptions}
                onChange={field.onChange}
                placeholder="Selecciona un estado"
                disabled={isSubmitting}
              />
            )}
          />
          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <TextField
                label="Ciudad"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Ej. Mexicali"
                editable={!isSubmitting}
              />
            )}
          />
          {error ? (
            <Text accessibilityRole="alert" className="font-sans text-base text-danger-strong">
              {error}
            </Text>
          ) : null}
          <View className="flex-row justify-center gap-4">
            <View className="w-[190px]">
              <Button
                variant="secondary"
                label="Cancelar"
                onPress={onClose}
                disabled={isSubmitting}
              />
            </View>
            <View className="w-[190px]">
              <Button
                variant="success"
                label="Guardar cambios"
                onPress={onSubmit}
                loading={isSubmitting}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}