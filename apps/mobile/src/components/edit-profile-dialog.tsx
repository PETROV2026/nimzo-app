import { zodResolver } from '@hookform/resolvers/zod';
import { mexicanStateLabels, mexicanStates, userEditSchema } from '@nimzo/shared';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type TextInputInstance,
} from 'react-native';
import { Icon } from '@/components/icon';
import { useSession, type Profile } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { DialogHeader } from '@/components/dialog-header';
import { SelectField } from '@/components/select-field';
import { TextField } from '@/components/text-field';
import { colors } from '@/theme';

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
  const { height } = useWindowDimensions();
  const compact = height < 800;
  const { updateProfile } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
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

  function handleClose() {
    if (isSubmitting) return;
    if (isDirty && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 bg-foreground/40">
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow items-center justify-center p-8"
          keyboardShouldPersistTaps="handled"
        >
          <View
            className={`w-full max-w-[640px] rounded-3xl bg-background ${compact ? 'gap-4 p-6' : 'gap-6 p-8'}`}
          >
            <DialogHeader
              title="Editar tus datos"
              description="Aparecen junto a tu firma en cada reporte que envías."
              onClose={handleClose}
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
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  editable={!isSubmitting}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field, fieldState }) => (
                <TextField
                  ref={phoneRef}
                  label="Teléfono (opcional)"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  placeholder="Ej. 686 123 4567"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => cityRef.current?.focus()}
                  editable={!isSubmitting}
                />
              )}
            />
            <View className="flex-row gap-5">
              <View className="flex-1">
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
                      autoCapitalize="words"
                      autoComplete="address-line2"
                      placeholder="Ej. Mexicali"
                      returnKeyType="done"
                      editable={!isSubmitting}
                    />
                  )}
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
            {error ? (
              <View
                accessibilityRole="alert"
                className="flex-row items-start gap-3 rounded-lg border-2 border-destructive px-4 py-3"
              >
                <Icon name="alert-circle-outline" size={22} color={colors.destructive} />
                <Text className="flex-1 font-sans-medium text-base text-destructive">{error}</Text>
              </View>
            ) : null}
            {confirmingDiscard ? (
              <View className="gap-4">
                <Text className="font-sans-medium text-lg text-foreground">
                  ¿Descartar los cambios que hiciste?
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
                  <Button
                    variant="secondary"
                    label="Cancelar"
                    onPress={handleClose}
                    disabled={isSubmitting}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Guardar cambios"
                    variant="success"
                    onPress={onSubmit}
                    loading={isSubmitting}
                    disabled={!isDirty}
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
