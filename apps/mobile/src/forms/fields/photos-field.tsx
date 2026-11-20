import { useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { FormField } from '@nimzo/shared';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { savePhoto } from '@/lib/save-photo';
import type { FieldProps, PhotosValue } from '@/forms/types';
import { FieldFrame } from './field-frame';

type PhotosFieldProps = FieldProps<Extract<FormField, { type: 'photos' }>, PhotosValue>;
type Asset = ImagePicker.ImagePickerAsset;
type Coords = { latitude?: number; longitude?: number };
type Source = PhotosValue[number]['source'];

const locationTimeout = 10_000;

async function currentPosition() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), locationTimeout);
  });
  return Promise.race([Location.getCurrentPositionAsync(), timeout]).finally(() =>
    clearTimeout(timer),
  );
}

async function currentCoords(): Promise<Coords> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return {};
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 120_000 })) ?? (await currentPosition());
    return position
      ? { latitude: position.coords.latitude, longitude: position.coords.longitude }
      : {};
  } catch {
    return {};
  }
}

function exifDate(exif: Asset['exif']) {
  const value = exif?.DateTimeOriginal;
  if (typeof value !== 'string') return undefined;
  const [year, month, day, hour, minute, second] = value.split(/[: ]/).map(Number);
  if (!year) return undefined;
  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function PhotosField({ field, value = [], onChange, error }: PhotosFieldProps) {
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();
  const running = useRef(false);
  const [busy, setBusy] = useState<Source>();
  const [problem, setProblem] = useState<string>();
  const [removing, setRemoving] = useState<string>();
  const remaining = field.count - value.length;
  const full = remaining <= 0;

  async function add(source: Source, pick: () => Promise<ImagePicker.ImagePickerResult | null>) {
    if (running.current) return;
    running.current = true;
    setBusy(source);
    setProblem(undefined);
    try {
      const result = await pick();
      if (!result || result.canceled) return;
      const coords = source === 'camera' ? currentCoords() : Promise.resolve<Coords>({});
      const photos: PhotosValue = [];
      for (const asset of result.assets.slice(0, remaining)) {
        try {
          const uri = await savePhoto(asset, 'photos');
          photos.push({
            uri,
            takenAt: exifDate(asset.exif) ?? new Date().toISOString(),
            source,
            ...(await coords),
          });
        } catch {
          setProblem('Una o más fotos no se pudieron guardar. Intenta con otra.');
        }
      }
      if (photos.length) onChange([...value, ...photos]);
    } catch {
      setProblem(
        source === 'camera'
          ? 'No se pudo abrir la cámara. Intenta de nuevo.'
          : 'No se pudo abrir la galería. Intenta de nuevo.',
      );
    } finally {
      running.current = false;
      setBusy(undefined);
    }
  }

  function takePhoto() {
    return add('camera', async () => {
      const { granted } = permission?.granted ? permission : await requestPermission();
      return granted ? ImagePicker.launchCameraAsync() : null;
    });
  }

  function pickPhotos() {
    return add('library', () =>
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        exif: true,
      }),
    );
  }

  function remove(uri: string) {
    const next = value.filter((photo) => photo.uri !== uri);
    onChange(next.length ? next : undefined);
    setRemoving(undefined);
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
              <Button
                label="Quitar"
                variant="secondary"
                onPress={() => setRemoving(photo.uri)}
                disabled={Boolean(busy)}
              />
            </View>
          ))}
        </View>
      ) : (
        <Text className="font-sans text-base text-muted">
          Aún no hay fotos. Toma una foto o elige de la galería.
        </Text>
      )}
      <View className="flex-row flex-wrap items-center gap-4">
        <Button
          label="Tomar foto"
          onPress={takePhoto}
          loading={busy === 'camera'}
          disabled={full || Boolean(busy)}
        />
        <Button
          label="Elegir de la galería"
          variant="secondary"
          onPress={pickPhotos}
          loading={busy === 'library'}
          disabled={full || Boolean(busy)}
        />
        {full ? (
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
      {removing ? (
        <ConfirmDialog
          title="¿Quitar esta foto?"
          message="La foto se quitará de este reporte."
          confirmLabel="Quitar foto"
          tone="destructive"
          onConfirm={() => remove(removing)}
          onClose={() => setRemoving(undefined)}
        />
      ) : null}
    </FieldFrame>
  );
}
