import { Canvas, Path } from '@shopify/react-native-skia';
import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { renderSignaturePng, strokeStyle, useSignatureInk } from '@/lib/signature-ink';
import { colors } from '@/theme';

type SignaturePadProps = {
  label: string;
  value: string | null;
  onChange: (uri: string | null) => void;
  error?: string;
};

function savePng(png: Uint8Array) {
  const directory = new Directory(Paths.document, 'signatures');
  if (!directory.exists) directory.create();
  const file = new File(directory, `${randomUUID()}.png`);
  file.write(png);
  return file.uri;
}

export function SignaturePad({ label, value, onChange, error }: SignaturePadProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const { pan, inkPath, strokePath, ink, drawing, clear, readable } = useSignatureInk({
    enabled: value === null,
    onStrokeStart: () => setSaveError(null),
  });
  const hasInk = ink !== null;
  const shownError =
    saveError ??
    (value || !error ? undefined : hasInk ? 'Toca "Listo" para guardar la firma' : error);

  function handleAccept() {
    const png = ink ? renderSignaturePng(ink) : null;
    if (!png) {
      setSaveError('No se pudo leer la firma. Intenta de nuevo.');
      return;
    }
    try {
      onChange(savePng(png));
      clear();
    } catch {
      setSaveError('No se pudo guardar la firma. Intenta de nuevo.');
    }
  }

  function handleRedo() {
    if (value) {
      const file = new File(value);
      if (file.exists) file.delete();
    }
    onChange(null);
  }

  const help = value
    ? undefined
    : !hasInk
      ? 'Usa todo el espacio: una firma grande se lee mejor en el reporte.'
      : readable
        ? 'Revisa que se lea bien antes de tocar "Listo".'
        : 'Haz la firma un poco más grande para poder aceptarla.';

  const borderClass =
    value || hasInk
      ? 'border-border'
      : shownError
        ? 'border-dashed border-danger'
        : 'border-dashed border-border-strong';

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap items-baseline gap-x-3">
        <Text className="font-sans-medium text-lg text-foreground">
          {label}
          <Text className="text-danger-strong"> *</Text>
        </Text>
        {shownError ? (
          <Text accessibilityLiveRegion="polite" className="font-sans text-base text-destructive">
            {shownError}
          </Text>
        ) : null}
      </View>
      <View className={`h-56 overflow-hidden rounded-xl border-2 ${borderClass}`}>
        {value ? (
          <Image
            source={{ uri: value }}
            contentFit="contain"
            style={{ flex: 1 }}
            accessibilityLabel={label}
          />
        ) : (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <GestureDetector gesture={pan}>
              <Canvas style={{ flex: 1 }}>
                <Path path={inkPath} {...strokeStyle} />
                <Path path={strokePath} {...strokeStyle} />
              </Canvas>
            </GestureDetector>
            {hasInk || drawing ? null : (
              <View
                pointerEvents="none"
                className="absolute inset-x-0 top-0 bottom-10 items-center justify-center gap-2"
              >
                <Icon name="create-outline" size={28} color={colors['border-strong']} />
                <Text className="font-sans text-base text-muted">
                  Firma aquí con el dedo o con un lápiz
                </Text>
              </View>
            )}
            <View pointerEvents="none" className="absolute inset-x-8 bottom-6 gap-1">
              <Icon name="close" size={18} color={colors['border-strong']} />
              <View className="h-px bg-border-strong" />
            </View>
          </GestureHandlerRootView>
        )}
      </View>
      {help && !shownError ? <Text className="font-sans text-base text-muted">{help}</Text> : null}
      <View className="flex-row justify-end gap-3">
        {value ? (
          <Button variant="secondary" icon="refresh" label="Volver a firmar" onPress={handleRedo} />
        ) : (
          <>
            <Button
              variant="secondary"
              icon="trash-outline"
              label="Borrar"
              onPress={clear}
              disabled={!hasInk}
            />
            <Button icon="checkmark" label="Listo" onPress={handleAccept} disabled={!readable} />
          </>
        )}
      </View>
    </View>
  );
}
