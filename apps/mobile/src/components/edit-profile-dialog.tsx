import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSession, type Profile } from '@/auth/session-provider';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { colors } from '@/theme/colors';
import { mexicanStateLabels, mexicanStates, type MexicanState } from '@nimzo/shared';
import { SelectField } from '@/components/select-field';

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
  const [fullName, setFullName] = useState(profile.fullName);
  const [nameError, setNameError] = useState<string>();
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [state, setState] = useState<MexicanState | null>(profile.state);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const name = fullName.trim();
    if (!name) {
      setNameError('Escribe tu nombre completo.');
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      fullName: name,
      phone: phone.trim() || null,
      state: state,
      city: city.trim() || null,
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
            onChangeText={(text) => {
              setFullName(text);
              setNameError(undefined);
            }}
            error={nameError}
            autoCapitalize="words"
            autoComplete="name"
            editable={!saving}
          />
          <TextField
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
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
            onChangeText={setCity}
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
