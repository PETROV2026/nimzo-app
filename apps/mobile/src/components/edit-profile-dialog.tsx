import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { mexicanStateLabels, mexicanStates, userEditSchema } from '@nimzo/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Modal, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSession, type Profile } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
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
  email: string | null;
  onClose: () => void;
};

export function EditProfileDialog({ profile, email, onClose }: EditProfileDialogProps) {
  const { height } = useWindowDimensions();
  const compact = height < 800;
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
    <Modal transparent animationType="fade" onRequestClose={isSubmitting ? undefined : onClose}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 bg-foreground/40">
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow items-center justify-center p-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className={`w-full max-w-[640px] rounded-3xl bg-background ${compact ? 'gap-4 p-6' : 'gap-6 p-8'}`}>
            <DialogHeader
              title="Editar tu información"
              description="Mantén tus datos de contacto al día."
              onClose={onClose}
              disabled={isSubmitting}
            />
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
            <View className="flex-row gap-5">
              <View className="w-[210px]">
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
              </View>
              <View className="flex-1">
                <ReadOnlyField label="Correo electrónico · Solo lectura" value={email ?? ''} />
              </View>
            </View>
            <View className="flex-row gap-5">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <SelectField
                      label="Estado"
                      value={field.value ?? null}
                      options={stateOptions}
                      onChange={field.onChange}
                      placeholder="Selecciona"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
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
              </View>
            </View>
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
                <Button label="Guardar cambios" variant="success" onPress={onSubmit} loading={isSubmitting} />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-2">
      <Text className="font-sans-semibold text-sm text-muted">{label}</Text>
      <View
        accessible
        accessibilityLabel={`${label}: ${value}`}
        className="min-h-[54px] flex-row items-center gap-3 rounded-[10px] border border-border bg-canvas px-4"
      >
        <Text numberOfLines={1} className="flex-1 font-sans text-base text-muted">
          {value}
        </Text>
        <Feather name="lock" size={18} color={colors.muted} />
      </View>
    </View>
  );
}
