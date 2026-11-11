import { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { FormField } from '@nimzo/shared';
import { Button } from '@/components/button';
import type { FieldProps, PhotosValue } from '@/forms/types';
import { FieldFrame } from './field-frame';
import { Image } from 'expo-image';

type PhotosFieldProps = FieldProps<Extract<FormField, { type: 'photos' }>, PhotosValue>;
type Asset = ImagePicker.ImagePickerAsset;
type Coords = { latitude?: number; longitude?: number };
type Source = PhotosValue[number]['source'];

const maxSide = 1600;
const maxBytes = 1024 * 1024;
const folder = new Directory(Paths.document, 'photos');

async function currentCoords(): Promise<Coords> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return {};
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 120_000 })) ??
      (await Location.getCurrentPositionAsync());
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return {};
  }
}

function exifCoords(exif: Asset['exif']): Coords {
  const {
    GPSLatitude: latitude,
    GPSLongitude: longitude,
    GPSLatitudeRef,
    GPSLongitudeRef,
  } = exif ?? {};
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || (!latitude && !longitude))
    return {};
  return {
    latitude: GPSLatitudeRef === 'S' ? -Math.abs(latitude) : latitude,
    longitude: GPSLongitudeRef === 'W' ? -Math.abs(longitude) : longitude,
  };
}

function exifDate(exif: Asset['exif']) {
  const value = exif?.DateTimeOriginal;
  if (typeof value !== 'string') return undefined;
  const [year, month, day, hour, minute, second] = value.split(/[: ]/).map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function savePhoto({ uri, width, height }: Asset) {
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > maxSide) {
    context.resize(
      width >= height ? { width: maxSide, height: null } : { width: null, height: maxSide },
    );
  }
  const image = await context.renderAsync();
  const file = new File((await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 })).uri);
  if (file.size > maxBytes) {
    file.delete();
    throw new Error('Photo is larger than 1 MB');
  }
  folder.create({ idempotent: true });
  await file.move(folder);
  return file.uri;
}

export function PhotosField({ field, value = [], onChange, error }: PhotosFieldProps) {
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string>();
  const remaining = field.count - value.length;
  const blocked = remaining === 0 || saving;

  async function add(
    result: ImagePicker.ImagePickerResult,
    source: Source,
    coordsOf: (asset: Asset) => Promise<Coords>,
  ) {
    if (result.canceled) return;
    setSaving(true);
    const results = await Promise.allSettled(
      result.assets.slice(0, remaining).map(async (asset) => ({
        uri: await savePhoto(asset),
        takenAt: exifDate(asset.exif) ?? new Date().toISOString(),
        source,
        ...(await coordsOf(asset)),
      })),
    );
    const photos = results.flatMap((item) => (item.status === 'fulfilled' ? [item.value] : []));
    setProblem(
      photos.length < results.length
        ? 'Una o más fotos no se pudieron guardar. Intenta con otra.'
        : undefined,
    );
    onChange([...value, ...photos]);
    setSaving(false);
  }

  async function takePhoto() {
    const { granted } = permission?.granted ? permission : await requestPermission();
    if (granted) await add(await ImagePicker.launchCameraAsync(), 'camera', currentCoords);
  }

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      exif: true,
    });
    await add(result, 'library', async (asset) => exifCoords(asset.exif));
  }

  function remove(uri: string) {
    const file = new File(uri);
    if (file.exists) file.delete();
    const next = value.filter((photo) => photo.uri !== uri);
    onChange(next.length ? next : undefined);
  }

  function confirmRemove(uri: string) {
    Alert.alert('¿Quitar esta foto?', 'La foto se borrará del reporte.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => remove(uri) },
    ]);
  }

  return (
    <FieldFrame field={field} error={error ?? problem}>
      {value.length ? (
        <View className="flex-row flex-wrap gap-4">
          {value.map((photo) => (
            <View key={photo.uri} className="w-48 gap-2">
              <View className="size-48 overflow-hidden rounded-lg bg-surface">
                <Image
                  source={photo.uri}
                  contentFit="cover"
                  style={{ flex: 1 }}
                  accessibilityLabel="Foto de evidencia"
                />
              </View>
              <Button label="Quitar" variant="secondary" onPress={() => confirmRemove(photo.uri)} />
            </View>
          ))}
        </View>
      ) : (
        <Text className="font-sans text-base text-muted">
          Aún no hay fotos. Toma una foto o elige de la galería.
        </Text>
      )}
      <View className="flex-row flex-wrap items-center gap-4">
        <Button label="Tomar foto" onPress={takePhoto} loading={saving} disabled={blocked} />
        <Button
          label="Elegir de la galería"
          variant="secondary"
          onPress={pickPhotos}
          disabled={blocked}
        />
        {remaining === 0 ? (
          <Text className="font-sans-medium text-base text-muted">Máximo {field.count} fotos</Text>
        ) : null}
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
