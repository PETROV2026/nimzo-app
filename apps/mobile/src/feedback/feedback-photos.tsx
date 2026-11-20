import { feedbackMaxPhotos } from '@nimzo/shared';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { deletePhoto, savePhoto } from '@/lib/save-photo';

type Source = 'camera' | 'library';

type FeedbackPhotosProps = {
  uris: string[];
  onChange: (uris: string[]) => void;
};

export function FeedbackPhotos({ uris, onChange }: FeedbackPhotosProps) {
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();
  const running = useRef(false);
  const [busy, setBusy] = useState<Source>();
  const [problem, setProblem] = useState<string>();
  const remaining = feedbackMaxPhotos - uris.length;
  const full = remaining <= 0;

  async function add(source: Source, pick: () => Promise<ImagePicker.ImagePickerResult | null>) {
    if (running.current) return;
    running.current = true;
    setBusy(source);
    setProblem(undefined);
    try {
      const result = await pick();
      if (!result || result.canceled) return;
      const saved: string[] = [];
      for (const asset of result.assets.slice(0, remaining)) {
        try {
          saved.push(await savePhoto(asset, 'feedback'));
        } catch {
          setProblem('Una o más imágenes no se pudieron agregar. Intenta con otra.');
        }
      }
      if (saved.length) onChange([...uris, ...saved]);
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
      }),
    );
  }

  return (
    <View className="gap-3">
      <Text className="font-sans-medium text-lg text-foreground">Fotos o capturas (opcional)</Text>
      <Text className="font-sans text-base text-muted">
        Para mandar una captura de pantalla, tómala con los botones de tu dispositivo y elígela de
        la galería.
      </Text>
      {uris.length ? (
        <View className="flex-row flex-wrap gap-4">
          {uris.map((uri, index) => (
            <View key={uri} className="w-32 gap-2">
              <View className="size-32 overflow-hidden rounded-lg bg-surface">
                <Image
                  source={uri}
                  contentFit="cover"
                  style={{ flex: 1 }}
                  accessibilityLabel={`Imagen ${index + 1}`}
                />
              </View>
              <Button
                label="Quitar"
                variant="secondary"
                onPress={() => {
                  deletePhoto(uri);
                  onChange(uris.filter((other) => other !== uri));
                }}
                disabled={Boolean(busy)}
              />
            </View>
          ))}
        </View>
      ) : null}
      <View className="flex-row flex-wrap items-center gap-4">
        <Button
          label="Tomar foto"
          variant="secondary"
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
          <Text className="font-sans-medium text-base text-muted">
            Máximo {feedbackMaxPhotos} imágenes
          </Text>
        ) : null}
      </View>
      {problem ? (
        <Text accessibilityRole="alert" className="font-sans-medium text-base text-destructive">
          {problem}
        </Text>
      ) : null}
      {permission?.status === 'denied' ? (
        <View className="items-start gap-3 rounded-lg bg-surface p-4">
          <Text className="font-sans text-base text-foreground">
            Para tomar fotos, Nimzo necesita permiso de cámara. Actívalo en Ajustes › Aplicaciones ›
            Nimzo › Permisos › Cámara.
          </Text>
          <Button label="Abrir ajustes" variant="outline" onPress={Linking.openSettings} />
        </View>
      ) : null}
    </View>
  );
}
