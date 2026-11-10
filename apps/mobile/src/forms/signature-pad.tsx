import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/button';
import { ClearSignatureButton, SignatureCanvas } from '@/components/signature-canvas';
import { deleteSignatureFile, saveSignaturePng } from '@/forms/signature-files';
import { renderSignaturePng, useSignatureInk } from '@/lib/signature-ink';

type SignaturePadProps = {
  label: string;
  value: string | null;
  onChange: (uri: string | null) => void;
  error?: string;
  onDrawingChange?: (drawing: boolean) => void;
};

export function SignaturePad({ label, value, onChange, error, onDrawingChange }: SignaturePadProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const signature = useSignatureInk({
    enabled: value === null,
    onStrokeStart: () => {
      setSaveError(null);
      onDrawingChange?.(true);
    },
    onStrokeEnd: () => onDrawingChange?.(false),
  });
  const { ink, clear, readable } = signature;
  const hasInk = ink !== null;
  const missing = !value && !hasInk && Boolean(error);
  const message = saveError ?? (missing ? error : undefined);

  function handleAccept() {
    const png = ink ? renderSignaturePng(ink) : null;
    if (!png) {
      setSaveError('No se pudo leer la firma. Intenta de nuevo.');
      return;
    }
    try {
      onChange(saveSignaturePng(png));
      clear();
    } catch {
      setSaveError('No se pudo guardar la firma. Intenta de nuevo.');
    }
  }

  function handleClear() {
    if (value) deleteSignatureFile(value);
    onChange(null);
  }

  const help = value
    ? undefined
    : !hasInk
      ? 'Usa todo el espacio: una firma grande se lee mejor en el reporte.'
      : readable
        ? 'Revisa que se lea bien antes de tocar "Listo".'
        : 'Haz la firma un poco más grande para poder aceptarla.';

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap items-baseline gap-x-3">
        <Text className="font-sans-medium text-lg text-foreground">
          {label}
          <Text className="text-danger-strong"> *</Text>
        </Text>
            {message ? (
          <Text accessibilityLiveRegion="polite" className="font-sans text-base text-destructive">
            {message}
          </Text>
        ) : null}
      </View>
      {value ? (
        <View className="h-56 overflow-hidden rounded-xl border-2 border-border">
          <Image
            source={{ uri: value }}
            contentFit="contain"
            style={{ flex: 1 }}
            accessibilityLabel={label}
          />
          <ClearSignatureButton onPress={handleClear} />
        </View>
      ) : (
        <SignatureCanvas signature={signature} invalid={missing} />
      )}
        {help && !message ? <Text className="font-sans text-base text-muted">{help}</Text> : null}
      {value ? null : (
        <View className="flex-row justify-end">
          <Button icon="checkmark" label="Listo" onPress={handleAccept} disabled={!readable} />
        </View>
      )}
    </View>
  );
}