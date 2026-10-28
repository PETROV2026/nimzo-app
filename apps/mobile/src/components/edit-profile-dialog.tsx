import { MaterialIcons } from '@expo/vector-icons';
import { mexicanStateLabels, mexicanStates, userEditSchema, type MexicanState } from '@nimzo/shared';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { z } from 'zod';
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

type FieldErrors = Partial<Record<'full_name' | 'phone' | 'city', string>>;

type EditProfileDialogProps = {
  profile: Profile;
  onClose: () => void;
};

export function EditProfileDialog({ profile, onClose }: EditProfileDialogProps) {
  const { updateProfile } = useSession();
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [state, setState] = useState<MexicanState | null>(profile.state);
  const [city, setCity] = useState(profile.city ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: keyof FieldErrors, setValue: (text: string) => void) {
    return (text: string) => {
      setValue(text);
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    };
  }

  async function handleSave() {
    const parsed = profileEditSchema.safeParse({ full_name: fullName, phone, state, city });
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      setErrors({
        full_name: fieldErrors.full_name?.[0],
        phone: fieldErrors.phone?.[0],
        city: fieldErrors.city?.[0],
      });
      return;
    }
    setErrors({});
    setSaving(true);
    const result = await updateProfile({
      fullName: parsed.data.full_name,
      phone: parsed.data.phone ?? null,
      state: parsed.data.state,
      city: parsed.data.city ?? null,
    });
    setSaving(false);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  }

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
          <TextField
            label="Nombre completo"
            value={fullName}
            onChangeText={handleChange('full_name', setFullName)}
            error={errors.full_name}
            autoCapitalize="words"
            autoComplete="name"
            editable={!saving}
          />
          <TextField
            label="Teléfono"
            value={phone}
            onChangeText={handleChange('phone', setPhone)}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="Ej. 686 123 4567"
            editable={!saving}
          />
          <SelectField
            label="Estado"
            value={state}
            options={stateOptions}
            onChange={setState}
            placeholder="Selecciona un estado"
            disabled={saving}
          />
          <TextField
            label="Ciudad"
            value={city}
            onChangeText={handleChange('city', setCity)}
            error={errors.city}
            placeholder="Ej. Mexicali"
            editable={!saving}
          />
          {error ? (
            <Text accessibilityRole="alert" className="font-sans text-base text-danger-strong">
              {error}
            </Text>
          ) : null}
          <View className="flex-row justify-center gap-4">
            <View className="w-[190px]">
              <Button variant="secondary" label="Cancelar" onPress={onClose} disabled={saving} />
            </View>
            <View className="w-[190px]">
              <Button
                variant="success"
                label="Guardar cambios"
                onPress={handleSave}
                loading={saving}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}