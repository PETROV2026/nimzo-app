import { Linking, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { FormField } from '@nimzo/shared';
import { Button } from '@/components/button';
import type { FieldProps, PhotosValue } from '@/forms/types';
import { FieldFrame } from './field-frame';

type PhotosFieldProps = FieldProps<Extract<FormField, { type: 'photos' }>, PhotosValue>;

export function PhotosField({ field, value = [], onChange, error }: PhotosFieldProps) {
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();
  const remaining = field.count - value.length;

  function add(result: ImagePicker.ImagePickerResult) {
    if (result.canceled) return;
    const takenAt = new Date().toISOString();
    const photos = result.assets.slice(0, remaining).map(({ uri }) => ({ uri, takenAt }));
    onChange([...value, ...photos]);
  }

  async function takePhoto() {
    const { granted } = permission?.granted ? permission : await requestPermission();
    if (granted) add(await ImagePicker.launchCameraAsync());
  }

  async function pickPhotos() {
    add(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      }),
    );
  }

  return (
    <FieldFrame field={field} error={error}>
      <View className="flex-row flex-wrap gap-4">
        <Button label="Tomar foto" onPress={takePhoto} disabled={remaining === 0} />
        <Button
          label="Elegir de la galería"
          variant="secondary"
          onPress={pickPhotos}
          disabled={remaining === 0}
        />
      </View>
      {permission?.status === 'denied' ? (
        <View className="items-start gap-3 rounded-lg bg-surface p-4">
          <Text className="font-sans text-base text-foreground">
            Para tomar fotos de evidencia, Nimzo necesita permiso de cámara. Actívalo en Ajustes ›
            Aplicaciones › Nimzo › Permisos › Cámara.
          </Text>
          <Button label="Abrir ajustes" variant="outline" onPress={Linking.openSettings} />
        </View>
      ) : null}
    </FieldFrame>
  );
}
